const express = require('express');
const { GoogleGenAI } = require('@google/genai');
const { supabase } = require('./supabase');
require('dotenv').config();
const router = express.Router();

const apikey = process.env.GEMINI_API_KEY;
const ai = new GoogleGenAI({ apikey });

// Format category name (fixed_deposit -> Fixed Deposit)
const formatCategoryName = (cat) => {
    return cat.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
};

router.get('/lastMonth', async (req, res) => {
    try {
        const { user_id } = req.query;

        if (!user_id) {
            return res.status(400).json({ error: 'user_id is required as query parameter' });
        }

        console.log('🎯 Fetching last month data for user:', user_id);

        // Calculate last month's date range
        const now = new Date();
        const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
        const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59);
        const lastMonthKey = lastMonthStart.toISOString().split('T')[0]; // "2026-02-01"

        console.log('Date range:', {
            start: lastMonthStart.toISOString(),
            end: lastMonthEnd.toISOString(),
            monthKey: lastMonthKey
        });

        // Check if summary already exists in Supabase
        const { data: existingSummary, error: summaryError } = await supabase
            .from('monthly_summary')
            .select('*')
            .eq('user_id', user_id)
            .eq('month', lastMonthKey)
            .single();

        if (!summaryError && existingSummary) {
            console.log('✅ Found existing summary in database');
            return res.json({ 
                success: true, 
                data: {
                    ...existingSummary.summary,
                    actions: existingSummary.action
                }
            });
        }

        console.log('📝 No existing summary, generating new one...');

        // Fetch last month's transactions
        const { data: transactions, error } = await supabase
            .from('transactions')
            .select('*')
            .eq('user_id', user_id)
            .gte('occured_at', lastMonthStart.toISOString())
            .lte('occured_at', lastMonthEnd.toISOString())
            .order('amount', { ascending: false });

        if (error) {
            console.error('Supabase error:', error);
            return res.status(500).json({ error: error.message });
        }

        console.log(`Found ${transactions?.length || 0} transactions`);

        // Debug: Log first transaction to see structure
        if (transactions && transactions.length > 0) {
            console.log('Sample transaction:', JSON.stringify(transactions[0], null, 2));
        }

        if (transactions.length === 0) {
            return res.json({
                success: true,
                data: {
                    status: 'OK',
                    rankedCategories: [],
                    insights: ['No transactions found for last month.'],
                    spendingSplit: [],
                    summary: 'No spending data available for last month.'
                }
            });
        }

        // Calculate category totals (using subcategory for display)
        const categoryTotals = transactions.reduce((acc, t) => {
            const cat = t.subcategory || 'Other';
            acc[cat] = (acc[cat] || 0) + t.amount;
            return acc;
        }, {});

        // Get top 3 categories
        const sortedCategories = Object.entries(categoryTotals)
            .sort(([, a], [, b]) => b - a)
            .slice(0, 3);

        const rankedCategories = sortedCategories.map(([category, amount], index) => ({
            rank: index + 1,
            category: formatCategoryName(category),
            amount: `₹${amount.toLocaleString('en-IN')}`,
            label: index === 0 ? 'Highest spend category' :
                index === 1 ? 'Second biggest drain' :
                    'Smaller, but frequent'
        }));

        // Calculate spending by budget category
        const budgetSplit = { needs: 0, wants: 0, investing: 0 };
        const totalSpent = transactions.reduce((sum, t) => sum + t.amount, 0);

        transactions.forEach(t => {
            const cat = (t.category || '').toLowerCase();
            if (cat === 'needs') budgetSplit.needs += t.amount;
            else if (cat === 'wants') budgetSplit.wants += t.amount;
            else if (cat === 'investing') budgetSplit.investing += t.amount;
        });

        console.log('Budget split:', budgetSplit, 'Total:', totalSpent);

        // Avoid division by zero
        const spendingSplit = [
            {
                category: 'Needs',
                expected: '50%',
                actual: totalSpent > 0 ? `${Math.round((budgetSplit.needs / totalSpent) * 100)}%` : '0%'
            },
            {
                category: 'Wants',
                expected: '30%',
                actual: totalSpent > 0 ? `${Math.round((budgetSplit.wants / totalSpent) * 100)}%` : '0%'
            },
            {
                category: 'Savings',
                expected: '20%',
                actual: totalSpent > 0 ? `${Math.round((budgetSplit.investing / totalSpent) * 100)}%` : '0%'
            }
        ];

        // Generate AI insights
        const insightsPrompt = `Analyze this spending data from last month and provide 4 concise insights (each under 15 words):

Total spent: ₹${totalSpent.toLocaleString('en-IN')}
Top categories: ${sortedCategories.map(([cat, amt]) => `${formatCategoryName(cat)}: ₹${amt}`).join(', ')}
Budget split: Needs ${spendingSplit[0].actual}, Wants ${spendingSplit[1].actual}, Savings ${spendingSplit[2].actual}

Return ONLY 4 bullet points, each starting with a dash (-). Be specific with numbers and actionable.`;

        const insightsResponse = await ai.models.generateContent({
            model: "gemini-2.5-flash-lite",
            // model: "gemini-2.5-flash",
            contents: insightsPrompt,
        });

        const insights = insightsResponse.text
            .split('\n')
            .filter(line => line.trim().startsWith('-'))
            .map(line => line.replace(/^-\s*/, '').trim())
            .slice(0, 4);

        // Generate summary
        const summaryPrompt = `Based on this spending: Total ₹${totalSpent.toLocaleString('en-IN')}, Needs ${spendingSplit[0].actual}, Wants ${spendingSplit[1].actual}, Savings ${spendingSplit[2].actual}. 
Write ONE sentence summary (under 20 words) starting with an emoji. Be honest about their financial health.`;

        const summaryResponse = await ai.models.generateContent({
            model: "gemini-2.5-flash-lite",
            contents: summaryPrompt,
        });

        const summary = summaryResponse.text.trim();

        // Determine status
        const savingsPercent = (budgetSplit.investing / totalSpent) * 100;
        const status = savingsPercent >= 20 ? 'Great' : savingsPercent >= 15 ? 'Good' : 'OK';
        
        console.log(
            "TOTAL SPENT===",
            totalSpent.toLocaleString('en-IN'),
            "\nSPENDING SPLIT===",
            spendingSplit,
            "\nSORTED CATEGORIES===",
            sortedCategories
            );

        const actionPrompt = `
You are a financial coach generating monthly challenge cards for a budgeting app.
The goal is to create actionable missions for the upcoming month based on last month's spending behavior.

LAST MONTH'S DATA: 
Total Spent: ₹${totalSpent.toLocaleString('en-IN')}
Spending Split:
- Needs: ${spendingSplit[0].actual}
- Wants: ${spendingSplit[1].actual}
- Savings: ${spendingSplit[2].actual}

Top Spending Categories:
${sortedCategories
  .slice(0, 3)
  .map(([cat, amt], i) => `${i + 1}. ${formatCategoryName(cat)} ₹${amt}`)
  .join('\n')}

---

MISSION RULES

Generate EXACTLY 3 mission cards.

Each card must be one of these types:

1. "curb"  
Used when a category has excessive spending.  
Goal: reduce spending vs last month.

2. "encourage"  
Used when savings or investing should increase.

3. "maintain"  
Used when a category is stable and should stay consistent.

Important logic:

- If wants spending is high (>30%), generate 1 to 3 curb cards from top discretionary categories.
- If savings are low (<20%), generate an encourage card to increase investing.
- If a category is stable or essential, generate a maintain card.
- Prioritize curb cards when overspending is severe.

---

RETURN FORMAT

Return ONLY a JSON array with EXACTLY 3 objects.

Each object must follow this schema:

{
"type": "curb | encourage | maintain",
"title": "Short category or action name",
"emoji": "relevant emoji",
"metric": {
  "target": number,
  "unit": "currency"
},
"priority": number
}

---

CARD TYPE GUIDELINES

curb:
- title = spending category (Shopping, Groceries, Dining etc.)
- target = ~70 to 80% of last month's spend

encourage:
- title = investment or saving action (Fixed Deposit, SIP, Savings Boost)
- target = reasonable monthly contribution

maintain:
- title = stable category (Housing, Utilities, Transport etc.)
- target = similar to last month's spending

---

IMPORTANT

- Return ONLY JSON.
- Do NOT include explanations.
- Do NOT include markdown.
- Do NOT include additional text.
`;

        const actionResponse = await ai.models.generateContent({
            model: "gemini-2.5-flash-lite",
            contents: actionPrompt,
        });

        // Parse action cards
        const actionText = actionResponse.text;
        const actionBlocks = actionText.split('\n\n').filter(b => b.trim());
        const actions = actionBlocks.slice(0, 3).map((block, idx) => {
            const lines = block.split('\n');
            const title = lines.find(l => l.startsWith('Title:'))?.replace('Title:', '').trim() || `Challenge ${idx + 1}`;
            const description = lines.find(l => l.startsWith('Description:'))?.replace('Description:', '').trim() || 'Improve your spending';
            const target = lines.find(l => l.startsWith('Target:'))?.replace('Target:', '').trim() || '₹1000';
            
            return { title, description, target };
        });

        const result = {
            status,
            rankedCategories,
            insights: insights.length > 0 ? insights : [
                `Your top category was ${formatCategoryName(sortedCategories[0][0])} at ₹${sortedCategories[0][1]}.`,
                `Total spending last month: ₹${totalSpent.toLocaleString('en-IN')}.`,
                `Wants spending was ${spendingSplit[1].actual} of your budget.`,
                `Savings rate was ${spendingSplit[2].actual}.`
            ],
            spendingSplit,
            summary: summary || `💡 Last month you spent ₹${totalSpent.toLocaleString('en-IN')} across ${transactions.length} transactions.`,
            actions: actions.length > 0 ? actions : [
                { title: 'Reduce dining out', description: 'Cut restaurant spending by 20%', target: '₹2000' },
                { title: 'Increase savings', description: 'Save an extra 5% this month', target: '5%' },
                { title: 'Track daily', description: 'Log every transaction within 24 hours', target: '100%' }
            ]
        };

        // Save to Supabase
        const { error: insertError } = await supabase
            .from('monthly_summary')
            .insert({
                user_id,
                month: lastMonthKey,
                summary: {
                    status: result.status,
                    rankedCategories: result.rankedCategories,
                    insights: result.insights,
                    spendingSplit: result.spendingSplit,
                    summary: result.summary
                },
                action: result.actions
            });

        if (insertError) {
            console.error('⚠️ Failed to save summary:', insertError);
        } else {
            console.log('💾 Saved summary to database');
        }

        console.log('✅ Generated coach data:', JSON.stringify(result, null, 2));
        res.json({ success: true, data: result });

    } catch (err) {
        console.error('Fetch error:', err);
        res.status(500).json({ error: 'Failed to fetch AI response', details: err.message });
    }
});

router.get('/thisMonth', async (req, res) => {
    try {
        const { user_id } = req.query;

        if (!user_id) {
            return res.status(400).json({ error: 'user_id is required as query parameter' });
        }

        console.log('🎯 Fetching this month actions for user:', user_id);

        // Calculate current month's date
        const now = new Date();
        const currentMonthKey = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];

        console.log('Current month key:', currentMonthKey);

        // Fetch actions from monthly_summary
        const { data: summary, error } = await supabase
            .from('monthly_summary')
            .select('action')
            .eq('user_id', user_id)
            .eq('month', currentMonthKey)
            .single();

        if (error || !summary) {
            console.log('No actions found for current month');
            return res.json({
                success: true,
                data: {
                    challenges: []
                }
            });
        }

        console.log('✅ Found actions:', summary.action);
        res.json({ success: true, data: { challenges: summary.action || [] } });

    } catch (err) {
        console.error('Fetch error:', err);
        res.status(500).json({ error: 'Failed to fetch this month data', details: err.message });
    }
});

module.exports = router;
