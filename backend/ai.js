const express = require('express');
const { GoogleGenAI } = require('@google/genai');
const { supabase } = require('./supabase');
require('dotenv').config();

const router = express.Router();
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

// ─── Date Helpers ────────────────────────────────────────────────────────────

const getMonthKey = (date = new Date()) => {
    const y = date.getFullYear();
    const m = date.getMonth() + 1;
    return `${y}-${String(m).padStart(2, '0')}-01`;
};

const getCurrentMonthKey = () => getMonthKey();

const getLastMonthKey = () => {
    const now = new Date();
    return getMonthKey(new Date(now.getFullYear(), now.getMonth() - 1, 1));
};

const getDateRange = (year, month) => {
    const start = new Date(year, month, 1);
    const end   = new Date(year, month + 1, 0, 23, 59, 59, 999);
    return [start.toISOString(), end.toISOString()];
};

const getLastMonthRange    = () => { const n = new Date(); return getDateRange(n.getFullYear(), n.getMonth() - 1); };
const getCurrentMonthRange = () => { const n = new Date(); return getDateRange(n.getFullYear(), n.getMonth()); };

// ─── Formatting ──────────────────────────────────────────────────────────────

const formatCategoryName = (cat) =>
    cat.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');

const pct = (part, total) =>
    total > 0 ? `${Math.round((part / total) * 100)}%` : '0%';

const toInr = (n) => `₹${Math.round(n).toLocaleString('en-IN')}`;

// ─── Supabase Queries ────────────────────────────────────────────────────────

const fetchPreferences = async (user_id) => {
    const { data, error } = await supabase
        .from('preferences').select('*').eq('user_id', user_id).single();
    if (error) console.error('ERROR fetching preferences:', error);
    return data || null;
};

const fetchTransactions = async (user_id, [rangeStart, rangeEnd]) => {
    const { data, error } = await supabase
        .from('transactions').select('*')
        .eq('user_id', user_id)
        .gte('occured_at', rangeStart)
        .lte('occured_at', rangeEnd)
        .order('amount', { ascending: false });
    if (error) throw error;
    return data || [];
};

const fetchMonthlySummary = async (user_id, monthKey) => {
    const { data, error } = await supabase
        .from('monthly_summary').select('*')
        .eq('user_id', user_id).eq('month', monthKey).single();
    return error ? null : data;
};

const saveMonthlySummary = async (user_id, monthKey, fields) => {
    // First, try to update existing record
    const { data: existing } = await supabase
        .from('monthly_summary')
        .select('id')
        .eq('user_id', user_id)
        .eq('month', monthKey)
        .single();

    if (existing) {
        // Update existing record
        const { error } = await supabase
            .from('monthly_summary')
            .update(fields)
            .eq('user_id', user_id)
            .eq('month', monthKey);
        if (error) console.error('⚠️ Failed to update summary:', error);
    } else {
        // Insert new record
        const { error } = await supabase
            .from('monthly_summary')
            .insert({ user_id, month: monthKey, ...fields });
        if (error) console.error('⚠️ Failed to insert summary:', error);
    }
};

// ─── Stats ───────────────────────────────────────────────────────────────────

const buildBudgetSplit = (transactions) => {
    return transactions.reduce((acc, t) => {
            const cat = (t.category || '').toLowerCase().trim();
            if      (cat === 'needs')     acc.needs     += t.amount;
            else if (cat === 'wants')     acc.wants     += t.amount;
            else if (cat === 'investing' || cat === 'savings') acc.investing += t.amount;
            return acc;
        },
        { needs: 0, wants: 0, investing: 0 }
    );
};

const buildSpendingSplit = (budgetSplit, monthlyIncome) => {
    const needsPct = monthlyIncome > 0 ? Math.round((budgetSplit.needs / monthlyIncome) * 100) : 0;
    const wantsPct = monthlyIncome > 0 ? Math.round((budgetSplit.wants / monthlyIncome) * 100) : 0;
    const savingsPct = monthlyIncome > 0 ? Math.round((budgetSplit.investing / monthlyIncome) * 100) : 0;
    
    return [
        { category: 'Needs',   expected: '50%', actual: `${needsPct}%` },
        { category: 'Wants',   expected: '30%', actual: `${wantsPct}%` },
        { category: 'Savings', expected: '20%', actual: `${savingsPct}%` },
    ];
};

const buildSpendingStats = (transactions, monthlyIncome = 0) => {
    const budgetSplit  = buildBudgetSplit(transactions);
    const totalSpent   = budgetSplit.needs + budgetSplit.wants + budgetSplit.investing;
    
    const spendingSplit = buildSpendingSplit(budgetSplit, monthlyIncome);

    const categoryTotals = transactions.reduce((acc, t) => {
        const cat = t.subcategory || 'Other';
        acc[cat] = (acc[cat] || 0) + t.amount;
        return acc;
    }, {});

    const sortedCategories = Object.entries(categoryTotals)
        .sort(([, a], [, b]) => b - a).slice(0, 3);

    const rankedCategories = sortedCategories.map(([category, amount], i) => ({
        rank:     i + 1,
        category: formatCategoryName(category),
        amount:   toInr(amount),
        label:    ['Highest spend category', 'Second biggest drain', 'Smaller, but frequent'][i],
    }));

    return { totalSpent, sortedCategories, spendingSplit, rankedCategories, budgetSplit };
};

// ─── AI ──────────────────────────────────────────────────────────────────────

const generateAIContent = async (stats) => {
    const { totalSpent, sortedCategories, spendingSplit } = stats;
    const topCatsText = sortedCategories
        .map(([cat, amt], i) => `${i + 1}. ${formatCategoryName(cat)} ${toInr(amt)}`).join('\n');

    const prompt = `
You are a financial coach for a budgeting app. Analyze the spending data below and return ONLY a single valid JSON object — no markdown, no explanations.

SPENDING DATA:
Total Spent: ${toInr(totalSpent)}
Needs: ${spendingSplit[0].actual} | Wants: ${spendingSplit[1].actual} | Savings: ${spendingSplit[2].actual}
Top Categories:
${topCatsText}

RETURN THIS EXACT SCHEMA:
{
  "review_status": "OK | Good | Great | Excellent",
  "review_summary": "<emoji + one sentence under 20 words>",
  "review_insights": ["<string>", "<string>", "<string>", "<string>"],
  "review_ranked_categories": [
    { "rank": 1, "category": "<name>", "amount": "₹<n>", "label": "Highest spend category" },
    { "rank": 2, "category": "<name>", "amount": "₹<n>", "label": "Second biggest drain"   },
    { "rank": 3, "category": "<name>", "amount": "₹<n>", "label": "Smaller, but frequent"  }
  ],
  "challenges": [
    { "type": "curb|encourage|maintain", "emoji": "<emoji>", "title": "<name>", "metric": { "target": <number>, "unit": "currency" }, "priority": 1, "missionType": "CURB|ENCOURAGE|MAINTAIN" },
    { "type": "curb|encourage|maintain", "emoji": "<emoji>", "title": "<name>", "metric": { "target": <number>, "unit": "currency" }, "priority": 2, "missionType": "CURB|ENCOURAGE|MAINTAIN" },
    { "type": "curb|encourage|maintain", "emoji": "<emoji>", "title": "<name>", "metric": { "target": <number>, "unit": "currency" }, "priority": 3, "missionType": "CURB|ENCOURAGE|MAINTAIN" }
  ]
}

RULES:
- review_insights: exactly 4 strings, each under 15 words, specific with numbers
- review_summary: exactly 1 sentence, starts with emoji, under 20 words
- challenges: exactly 3 objects. 
    curb → wants > 30% of income, target = 70–80% of last spend. 
    encourage → savings < 20% of income. 
    maintain → stable/healthy categories.
- Return ONLY the JSON object.`;

    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash-lite',
        contents: prompt
    });
    const raw = response.text.trim().replace(/^```json\s*/i, '').replace(/```$/i, '');
    const match = raw.match(/\{[\s\S]*\}/);
    if (!match) throw new Error('Gemini did not return valid JSON');
    return JSON.parse(match[0]);
};

// ─── Defaults ────────────────────────────────────────────────────────────────

const FALLBACK_ACTIONS = [
    { type: 'curb',      emoji: '🛍️', title: 'Shopping',      metric: { target: 1000, unit: 'currency' }, priority: 1, missionType: 'CURB' },
    { type: 'maintain',  emoji: '🛒', title: 'Groceries',     metric: { target: 1500, unit: 'currency' }, priority: 2, missionType: 'MAINTAIN' },
    { type: 'encourage', emoji: '🏦', title: 'Fixed Deposit', metric: { target: 2000, unit: 'currency' }, priority: 3, missionType: 'ENCOURAGE' },
];

const EMPTY_SPENDING_SPLIT = [
    { category: 'Needs',   expected: '50%', actual: '0%' },
    { category: 'Wants',   expected: '30%', actual: '0%' },
    { category: 'Savings', expected: '20%', actual: '0%' },
];

// ─── New User Bootstrap ──────────────────────────────────────────────────────

const buildOnboardingData = (preferences) => {
    const { monthly_income: income, monthly_savings_target: savingsTarget } = preferences;

    const challenges = [
        { type: 'encourage', emoji: '💰', title: 'Hit Savings Target', metric: { target: savingsTarget,                  unit: 'currency' }, priority: 1, missionType: 'ENCOURAGE' },
        { type: 'maintain',  emoji: '🏠', title: 'Essentials Budget',  metric: { target: Math.round(income * 0.50),      unit: 'currency' }, priority: 2, missionType: 'MAINTAIN'  },
        { type: 'curb',      emoji: '🛍️', title: 'Wants Limit',        metric: { target: Math.round(income * 0.30),      unit: 'currency' }, priority: 3, missionType: 'CURB'      },
    ];

    return challenges;
};

// ─── Challenge Progress ──────────────────────────────────────────────────────

const attachProgress = (challenges, budgetSplit) => {
    return challenges.map((challenge) => {
        const target = challenge.metric?.target || 0;

        const spendMap = {
            encourage: budgetSplit.investing,
            maintain:  budgetSplit.needs,
            curb:      budgetSplit.wants,
        };
        const currentSpend = spendMap[challenge.type] ?? 0;
        const progress     = target > 0 ? Math.min(Math.round((currentSpend / target) * 100), 100) : 0;

        let status = 'regular', statusText = '';
        if (challenge.type === 'encourage') {
            if (progress >= 100) { status = 'completed'; statusText = 'Target Hit!'; }
            else if (progress >= 75)  statusText = 'Almost there';
        } else if (challenge.type === 'curb') {
            if (progress >= 100) { status = 'warning'; statusText = 'Over limit'; }
            else if (progress >= 80) { status = 'warning'; statusText = 'Near limit'; }
        }

        return { ...challenge, progress, status, statusText, currentSpend };
    });
};

// ─── Routes ──────────────────────────────────────────────────────────────────

router.get('/lastMonth', async (req, res) => {
    try {
        const { user_id } = req.query;
        if (!user_id) return res.status(400).json({ error: 'user_id is required' });

        const lastMonthKey = getLastMonthKey();

        // Fetch last month's row. If review_ranked_categories is not null → return cached, stop.
        const cached = await fetchMonthlySummary(user_id, lastMonthKey);
        if (cached && cached.review_ranked_categories) {
            return res.json({ 
                success: true, 
                data: { 
                    review_status: cached.review_status,
                    review_summary: cached.review_summary,
                    review_insights: cached.review_insights,
                    review_spending_split: cached.review_spending_split,
                    review_ranked_categories: cached.review_ranked_categories
                } 
            });
        }

        // Fetch last month's transactions
        const transactions = await fetchTransactions(user_id, getLastMonthRange());
        
        // If < 5 → return empty state, stop.
        if (transactions.length < 5) {
            return res.json({ success: true, data: {
                review_status: null,
                review_summary: 'No data yet — keep tracking this month to unlock your first review.',
                review_insights: null,
                review_spending_split: null,
                review_ranked_categories: null
            }});
        }

        // Fetch preferences for monthly_income.
        const preferences = await fetchPreferences(user_id);
        const monthlyIncome = preferences?.monthly_income || 0;

        // Compute: buildSpendingStats → gets totalSpent, spendingSplit, rankedCategories, budgetSplit
        const stats = buildSpendingStats(transactions, monthlyIncome);

        // Call Gemini to generate AI fields
        let aiContent = null;
        try { aiContent = await generateAIContent(stats); }
        catch (e) { 
            console.error('⚠️ AI generation failed:', e.message);
            // Fallback content
            aiContent = {
                review_status: 'OK',
                review_summary: `💡 Last month you spent ${toInr(stats.totalSpent)} across ${transactions.length} transactions.`,
                review_insights: [
                    `Top category: ${stats.rankedCategories[0]?.category} at ${stats.rankedCategories[0]?.amount}.`,
                    `Total spending: ${toInr(stats.totalSpent)}.`,
                    `Wants: ${stats.spendingSplit[1].actual} of budget.`,
                    `Savings rate: ${stats.spendingSplit[2].actual}.`,
                ],
                review_ranked_categories: stats.rankedCategories,
                challenges: FALLBACK_ACTIONS
            };
        }

        const finalFields = {
            is_onboarding: false,
            review_status: aiContent.review_status,
            review_summary: aiContent.review_summary,
            review_insights: aiContent.review_insights,
            review_spending_split: stats.spendingSplit,
            review_ranked_categories: aiContent.review_ranked_categories,
            challenges: aiContent.challenges
        };

        // Upsert to last month's row
        await saveMonthlySummary(user_id, lastMonthKey, finalFields);

        return res.json({ 
            success: true, 
            data: {
                review_status: finalFields.review_status,
                review_summary: finalFields.review_summary,
                review_insights: finalFields.review_insights,
                review_spending_split: finalFields.review_spending_split,
                review_ranked_categories: finalFields.review_ranked_categories
            }
        });

    } catch (err) {
        console.error('Unhandled error in /lastMonth:', err);
        res.status(500).json({ error: 'Failed to fetch last month data', details: err.message });
    }
});

router.get('/thisMonth', async (req, res) => {
    try {
        const { user_id } = req.query;
        if (!user_id) return res.status(400).json({ error: 'user_id is required' });

        const prevMonthKey = getLastMonthKey();
        const currentMonthKey = getCurrentMonthKey();
        const preferences = await fetchPreferences(user_id);
        if (!preferences) return res.status(404).json({ error: 'User preferences not found' });

        // Fetch prev month's row (last month key).
        const prevRow = await fetchMonthlySummary(user_id, prevMonthKey);

        let challenges;
        // If no prev row or prev row is_onboarding: true → seed from preferences
        if (!prevRow || prevRow.is_onboarding) {
            challenges = buildOnboardingData(preferences);
            // Upsert current month row with is_onboarding: true + seeded challenges
            await saveMonthlySummary(user_id, currentMonthKey, {
                is_onboarding: true,
                challenges: challenges
            });
        } else {
            // If prev row exists and has real challenges → use prev row's challenges
            challenges = prevRow.challenges || [];
        }

        // Fetch current month's transactions.
        const transactions = await fetchTransactions(user_id, getCurrentMonthRange());
        const budgetSplit = buildBudgetSplit(transactions);
        const monthlyIncome = preferences?.monthly_income || 0;
        const spendingSplit = buildSpendingSplit(budgetSplit, monthlyIncome);

        // Call attachProgress to add progress/status/statusText/currentSpend to each challenge.
        const challengesWithProgress = attachProgress(challenges, budgetSplit);

        return res.json({ 
            success: true, 
            data: {
                challenges: challengesWithProgress,
                spendingSplit: spendingSplit,
                insights: prevRow?.review_insights || [
                    `Your monthly income is ${toInr(monthlyIncome)}.`,
                    `Target savings: ${toInr(preferences.monthly_savings_target)}.`,
                    'Keep tracking your expenses to see live insights.',
                    'New challenges will be generated at the start of next month.'
                ],
                summary: prevRow?.review_summary || `🚀 Welcome! Let's hit your ${toInr(monthlyIncome)} budget goal.`,
                status: prevRow?.review_status || 'Good'
            }
        });

    } catch (err) {
        console.error('Unhandled error in /thisMonth:', err);
        res.status(500).json({ error: 'Failed to fetch this month data', details: err.message });
    }
});

module.exports = router;