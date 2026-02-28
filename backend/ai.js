const express = require('express');
const { GoogleGenAI  } = require('@google/genai');
const { supabase } = require('./supabase');
require('dotenv').config();
const router = express.Router();

const apikey = process.env.GEMINI_API_KEY;
const genAI = new GoogleGenAI(apikey);

router.post('/lastMonth', async (req, res) => {
    try {
        const { user_id } = req.body;

        if (!user_id) {
            return res.status(400).json({ error: 'user_id is required' });
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

        // Calculate category totals
        const categoryTotals = transactions.reduce((acc, t) => {
            const cat = t.subcategory || t.category || 'Other';
            acc[cat] = (acc[cat] || 0) + t.amount;
            return acc;
        }, {});

        // Get top 3 categories
        const sortedCategories = Object.entries(categoryTotals)
            .sort(([, a], [, b]) => b - a)
            .slice(0, 3);

        const rankedCategories = sortedCategories.map(([category, amount], index) => ({
            rank: index + 1,
            category,
            amount: `₹${amount.toLocaleString('en-IN')}`,
            label: index === 0 ? 'Highest spend category' : 
                   index === 1 ? 'Second biggest drain' : 
                   'Smaller, but frequent'
        }));

        // Calculate spending by budget category (needs/wants/investing)
        const budgetSplit = transactions.reduce((acc, t) => {
            const cat = t.category || 'needs';
            acc[cat] = (acc[cat] || 0) + t.amount;
            return acc;
        }, { needs: 0, wants: 0, investing: 0 });

        const totalSpent = Object.values(budgetSplit).reduce((sum, val) => sum + val, 0);
        
        const spendingSplit = [
            {
                category: 'Needs',
                expected: '50%',
                actual: `${Math.round((budgetSplit.needs / totalSpent) * 100)}%`
            },
            {
                category: 'Wants',
                expected: '30%',
                actual: `${Math.round((budgetSplit.wants / totalSpent) * 100)}%`
            },
            {
                category: 'Savings',
                expected: '20%',
                actual: `${Math.round((budgetSplit.investing / totalSpent) * 100)}%`
            }
        ];

        // Generate AI insights
        const prompt = `Analyze this spending data from last month and provide 4 concise insights (each under 15 words):

Total spent: ₹${totalSpent.toLocaleString('en-IN')}
Top categories: ${sortedCategories.map(([cat, amt]) => `${cat}: ₹${amt}`).join(', ')}
Budget split: Needs ${spendingSplit[0].actual}, Wants ${spendingSplit[1].actual}, Savings ${spendingSplit[2].actual}

Return ONLY 4 bullet points, each starting with a dash (-). Be specific with numbers and actionable.`;

        const model = genAI.getGenerativeModel({ model: "gemini-pro" });
        const aiResponse = await model.generateContent(prompt);
        const response = await aiResponse.response;
        const insights = response.text()
            .split('\n')
            .filter(line => line.trim().startsWith('-'))
            .map(line => line.replace(/^-\s*/, '').trim())
            .slice(0, 4);

        // Generate summary
        const summaryPrompt = `Based on this spending: Total ₹${totalSpent.toLocaleString('en-IN')}, Needs ${spendingSplit[0].actual}, Wants ${spendingSplit[1].actual}, Savings ${spendingSplit[2].actual}. 
Write ONE sentence summary (under 20 words) starting with an emoji. Be honest about their financial health.`;

        const summaryResponse = await model.generateContent(summaryPrompt);
        const summaryResult = await summaryResponse.response;
        const summary = summaryResult.text().trim();

        // Determine status
        const savingsPercent = (budgetSplit.investing / totalSpent) * 100;
        const status = savingsPercent >= 20 ? 'Great' : 
                      savingsPercent >= 15 ? 'Good' : 'OK';

        const result = {
            status,
            rankedCategories,
            insights: insights.length > 0 ? insights : [
                `Your top category was ${sortedCategories[0][0]} at ₹${sortedCategories[0][1]}.`,
                `Total spending last month: ₹${totalSpent.toLocaleString('en-IN')}.`,
                `Wants spending was ${spendingSplit[1].actual} of your budget.`,
                `Savings rate was ${spendingSplit[2].actual}.`
            ],
            spendingSplit,
            summary: summary || `💡 Last month you spent ₹${totalSpent.toLocaleString('en-IN')} across ${transactions.length} transactions.`
        };

        console.log('✅ Generated coach data:', result);
        res.json({ success: true, data: result });

    } catch (err) {
        console.error('Fetch error:', err);
        res.status(500).json({ error: 'Failed to fetch AI response', details: err.message });
    }
});

router.get('/thisWeek', async(req,res) => {
    res.json({ success: true, message: 'This week endpoint' });
});

module.exports = router;
