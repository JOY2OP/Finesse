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

        console.log('Date range:', {
            start: lastMonthStart.toISOString(),
            end: lastMonthEnd.toISOString()
        });

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

        if (!transactions || transactions.length === 0) {
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

        // Calculate spending by budget category (needs/wants/investing)
        // Check if transactions have category field set
        const budgetSplit = transactions.reduce((acc, t) => {
            const cat = t.category;
            if (cat === 'needs' || cat === 'wants' || cat === 'investing') {
                acc[cat] = (acc[cat] || 0) + t.amount;
            }
            return acc;
        }, { needs: 0, wants: 0, investing: 0 });

        const totalSpent = transactions.reduce((sum, t) => sum + t.amount, 0);

        console.log('Budget split:', budgetSplit, 'Total:', totalSpent);

        // Check if any transactions have proper category set
        const hasCategoryData = budgetSplit.needs > 0 || budgetSplit.wants > 0 || budgetSplit.investing > 0;
        
        // If no category data, distribute based on subcategory heuristics
        if (!hasCategoryData && totalSpent > 0) {
            console.log('⚠️ No category data found, using heuristics');
            transactions.forEach(t => {
                const sub = (t.subcategory || '').toLowerCase();
                // Investing categories
                if (sub.includes('deposit') || sub.includes('investment') || sub.includes('mutual') || sub.includes('stock')) {
                    budgetSplit.investing += t.amount;
                }
                // Needs categories
                else if (sub.includes('groceries') || sub.includes('rent') || sub.includes('utilities') || sub.includes('medical') || sub.includes('insurance')) {
                    budgetSplit.needs += t.amount;
                }
                // Everything else as wants
                else {
                    budgetSplit.wants += t.amount;
                }
            });
            console.log('Budget split after heuristics:', budgetSplit);
        }

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
        const status = savingsPercent >= 20 ? 'Great' :
            savingsPercent >= 15 ? 'Good' : 'OK';

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
            summary: summary || `💡 Last month you spent ₹${totalSpent.toLocaleString('en-IN')} across ${transactions.length} transactions.`
        };

        console.log('✅ Generated coach data:', JSON.stringify(result, null, 2));
        res.json({ success: true, data: result });

    } catch (err) {
        console.error('Fetch error:', err);
        res.status(500).json({ error: 'Failed to fetch AI response', details: err.message });
    }
});

router.get('/thisMonth', async (req, res) => {
    res.json({ success: true, message: 'This month endpoint' });
});

module.exports = router;
