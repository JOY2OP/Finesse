const express = require('express');
const { GoogleGenAI } = require('@google/genai');
const { supabase } = require('./supabase');
require('dotenv').config();

const router = express.Router();
const ai = new GoogleGenAI({ apikey: process.env.GEMINI_API_KEY });

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

const toInr = (n) => `₹${n.toLocaleString('en-IN')}`;

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

const saveMonthlySummary = async (user_id, monthKey, summary, action) => {
    const { error } = await supabase
        .from('monthly_summary')
        .insert({ user_id, month: monthKey, summary, action });
    if (error) console.error('⚠️ Failed to save summary:', error);
};

// ─── Stats ───────────────────────────────────────────────────────────────────

const buildBudgetSplit = (transactions) => {
    console.log('🔍 Processing transactions:', transactions.map(t => ({ 
        amount: t.amount, 
        category: t.category,
        subcategory: t.subcategory 
    })));
    
    return transactions.reduce((acc, t) => {
            const cat = (t.category || '').toLowerCase().trim();
            console.log(`  → Transaction: ${t.amount}, category: "${t.category}" → normalized: "${cat}"`);
            
            if      (cat === 'needs')     acc.needs     += t.amount;
            else if (cat === 'wants')     acc.wants     += t.amount;
            else if (cat === 'investing' || cat === 'savings') acc.investing += t.amount;
            else console.log(`  ⚠️ Unmatched category: "${cat}" (original: "${t.category}")`);
            
            return acc;
        },
        { needs: 0, wants: 0, investing: 0 }
    );
};

const buildSpendingSplit = (budgetSplit, monthlyIncome) => {
    // Calculate percentage of monthly income, not total spending
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
    
    // Use monthly income if provided, otherwise fall back to total spent for percentage calculation
    const spendingSplit = monthlyIncome > 0 
        ? buildSpendingSplit(budgetSplit, monthlyIncome)
        : buildSpendingSplit(budgetSplit, totalSpent);

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

    const savingsPct = totalSpent > 0 ? (budgetSplit.investing / totalSpent) * 100 : 0;
    const status = savingsPct >= 20 ? 'Great' : savingsPct >= 15 ? 'Good' : 'OK';

    return { totalSpent, sortedCategories, spendingSplit, rankedCategories, status, budgetSplit };
};

// ─── AI ──────────────────────────────────────────────────────────────────────

const generateAIContent = async ({ totalSpent, sortedCategories, spendingSplit }) => {
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
  "insights": ["<string under 15 words>", "<string>", "<string>", "<string>"],
  "summary": "<one sentence starting with an emoji, under 20 words>",
  "actions": [
    { "type": "curb|encourage|maintain", "title": "<name>", "emoji": "<emoji>", "metric": { "target": <number>, "unit": "currency" }, "priority": <1|2|3> }
  ]
}

RULES:
- insights: exactly 4 strings, each under 15 words, specific with numbers
- summary: exactly 1 sentence, starts with emoji, under 20 words
- actions: exactly 3 objects. curb → wants > 30%, target = 70-80% of last spend. encourage → savings < 20%. maintain → stable categories.
- Return ONLY the JSON object.`;

    const response = await ai.models.generateContent({ model: 'gemini-2.5-flash-lite', contents: prompt });
    const raw = response.text.trim().replace(/^```json\s*/i, '').replace(/```$/i, '');
    const match = raw.match(/\{[\s\S]*\}/);
    if (!match) throw new Error('Gemini did not return valid JSON');
    return JSON.parse(match[0]);
};

// ─── Defaults ────────────────────────────────────────────────────────────────

const FALLBACK_ACTIONS = [
    { type: 'curb',      title: 'Reduce top spending',    emoji: '🎯', metric: { target: 1000, unit: 'currency' }, priority: 1 },
    { type: 'encourage', title: 'Increase savings',       emoji: '💰', metric: { target: 500,  unit: 'currency' }, priority: 2 },
    { type: 'maintain',  title: 'Keep essentials steady', emoji: '✨', metric: { target: 2000, unit: 'currency' }, priority: 3 },
];

const EMPTY_SPENDING_SPLIT = [
    { category: 'Needs',   expected: '50%', actual: '0%' },
    { category: 'Wants',   expected: '30%', actual: '0%' },
    { category: 'Savings', expected: '20%', actual: '0%' },
];

// ─── New User Bootstrap ──────────────────────────────────────────────────────

const buildOnboardingData = (preferences) => {
    const { monthly_income: income, monthly_savings_target: savingsTarget } = preferences;

    const action = [
        { type: 'encourage', emoji: '💰', title: 'Hit Savings Target', metric: { target: savingsTarget,                  unit: 'currency' }, priority: 1, missionType: 'ENCOURAGE', color: '#10B981' },
        { type: 'maintain',  emoji: '🏠', title: 'Essentials Budget',  metric: { target: Math.round(income * 0.50),      unit: 'currency' }, priority: 2, missionType: 'MAINTAIN',  color: '#0052FF' },
        { type: 'curb',      emoji: '🛍️', title: 'Wants Limit',        metric: { target: Math.round(income * 0.30),      unit: 'currency' }, priority: 3, missionType: 'CURB',      color: '#EF4444' },
    ];

    const insights = [
        `Your savings target is ${toInr(savingsTarget)}/month.`,
        `Keep daily spending under ${toInr(Math.round((income - savingsTarget) / 30))}.`,
        'Your emergency fund goal is set — transactions will track progress.',
        'Categorize your transactions to unlock personalized insights.',
    ];

    const summary = {
        status: 'Good',
        summary: `🚀 Welcome! Your ${toInr(income)} income plan is ready.`,
        insights,
        spendingSplit: EMPTY_SPENDING_SPLIT,
        rankedCategories: [],
    };

    return { action, insights, summary };
};

// ─── Challenge Progress ──────────────────────────────────────────────────────

const attachProgress = (actions, budgetSplit) => {
    console.log('🎯 Attaching progress to actions...');
    console.log('   Budget Split:', budgetSplit);
    
    return actions.map((action) => {
        const target = action.metric?.target || 0;

        const spendMap = {
            encourage: budgetSplit.investing,
            maintain:  budgetSplit.needs,
            curb:      budgetSplit.wants,
        };
        const currentSpend = spendMap[action.type] ?? 0;
        const progress     = target > 0 ? Math.min(Math.round((currentSpend / target) * 100), 100) : 0;

        console.log(`   Action: ${action.title} (${action.type})`);
        console.log(`     Target: ${target}, Current: ${currentSpend}, Progress: ${progress}%`);

        let status = 'regular', statusText = '';
        if (action.type === 'encourage') {
            if (progress >= 100) { status = 'completed'; statusText = 'Target Hit!'; }
            else if (progress >= 75)  statusText = 'Almost there';
        } else if (action.type === 'curb') {
            if (progress >= 100) { status = 'warning'; statusText = 'Over limit'; }
            else if (progress >= 80) { status = 'warning'; statusText = 'Near limit'; }
        }

        return { ...action, progress, status, statusText, currentSpend };
    });
};

// ─── Routes ──────────────────────────────────────────────────────────────────

router.get('/lastMonth', async (req, res) => {
    try {
        const { user_id } = req.query;
        if (!user_id) return res.status(400).json({ error: 'user_id is required' });

        const currentMonthKey = getCurrentMonthKey();

        // Return cache if AI summary already exists for this month
        const cached = await fetchMonthlySummary(user_id, currentMonthKey);
        if (cached) {
            return res.json({ success: true, data: { ...cached.summary, actions: cached.action } });
        }

        // Fetch last month's transactions
        const transactions = await fetchTransactions(user_id, getLastMonthRange());
        if (!transactions.length) {
            return res.json({ success: true, data: {
                status: 'OK', rankedCategories: [], spendingSplit: [], actions: [],
                insights: ['No data yet — check back after your first full month. 😁'],
                summary: '📊 Start categorizing transactions to see your spending patterns.',
            }});
        }

        // Fetch user preferences to get monthly income
        const preferences = await fetchPreferences(user_id);
        const monthlyIncome = preferences?.monthly_income || 0;

        const stats = buildSpendingStats(transactions, monthlyIncome);

        let aiContent = null;
        try { aiContent = await generateAIContent(stats); }
        catch (e) { console.error('⚠️ AI generation failed:', e.message); }

        const result = {
            status:          stats.status,
            rankedCategories: stats.rankedCategories,
            spendingSplit:   stats.spendingSplit,
            insights: aiContent?.insights?.length ? aiContent.insights.slice(0, 4) : [
                `Top category: ${stats.rankedCategories[0]?.category} at ${stats.rankedCategories[0]?.amount}.`,
                `Total spending: ${toInr(stats.totalSpent)}.`,
                `Wants: ${stats.spendingSplit[1].actual} of budget.`,
                `Savings rate: ${stats.spendingSplit[2].actual}.`,
            ],
            summary: aiContent?.summary || `💡 Last month you spent ${toInr(stats.totalSpent)} across ${transactions.length} transactions.`,
            actions: aiContent?.actions?.length === 3 ? aiContent.actions : FALLBACK_ACTIONS,
        };

        // Save or update summary
        await saveMonthlySummary(user_id, currentMonthKey, result, result.actions);

        return res.json({ success: true, data: result });

    } catch (err) {
        console.error('Unhandled error in /lastMonth:', err);
        res.status(500).json({ error: 'Failed to fetch last month data', details: err.message });
    }
});

router.get('/thisMonth', async (req, res) => {
    try {
        const { user_id } = req.query;
        if (!user_id) return res.status(400).json({ error: 'user_id is required' });

        const currentMonthKey = getCurrentMonthKey();
        let row = await fetchMonthlySummary(user_id, currentMonthKey);

        // New user — seed from preferences
        if (!row) {
            const preferences = await fetchPreferences(user_id);
            if (!preferences) return res.status(404).json({ error: 'User preferences not found' });

            const { action, insights, summary } = buildOnboardingData(preferences);
            await saveMonthlySummary(user_id, currentMonthKey, summary, action);

            return res.json({ success: true, data: {
                challenges:   action,
                spendingSplit: EMPTY_SPENDING_SPLIT,
                insights,
                summary: summary.summary,
            }});
        }

        // Attach live progress to stored actions
        const transactions = await fetchTransactions(user_id, getCurrentMonthRange());
        console.log(`📊 Found ${transactions.length} transactions for current month`);
        
        if (transactions.length > 0) {
            console.log('📝 Sample transaction:', JSON.stringify(transactions[0], null, 2));
        }
        
        const budgetSplit  = buildBudgetSplit(transactions);
        console.log('💰 Budget Split:', budgetSplit);
        
        // Fetch user preferences to get monthly income for percentage calculation
        const preferences = await fetchPreferences(user_id);
        const monthlyIncome = preferences?.monthly_income || 0;
        console.log('💵 Monthly Income:', monthlyIncome);
        
        const spendingSplit = buildSpendingSplit(budgetSplit, monthlyIncome);
        console.log('📈 Spending Split:', spendingSplit);
        
        const challenges   = attachProgress(row.action || [], budgetSplit);
        console.log('🎯 Challenges with progress:', challenges);

        return res.json({ success: true, data: {
            challenges,
            spendingSplit,
            insights: row.summary?.insights || [],
            summary:  row.summary?.summary  || '',
        }});

    } catch (err) {
        console.error('Unhandled error in /thisMonth:', err);
        res.status(500).json({ error: 'Failed to fetch this month data', details: err.message });
    }
});

router.get('/debug/transactions', async (req, res) => {
    try {
        const { user_id } = req.query;
        if (!user_id) return res.status(400).json({ error: 'user_id is required' });

        const [rangeStart, rangeEnd] = getCurrentMonthRange();
        const transactions = await fetchTransactions(user_id, [rangeStart, rangeEnd]);
        const preferences = await fetchPreferences(user_id);
        
        const budgetSplit = buildBudgetSplit(transactions);
        const monthlyIncome = preferences?.monthly_income || 0;
        const spendingSplit = buildSpendingSplit(budgetSplit, monthlyIncome);
        
        return res.json({
            success: true,
            debug: {
                dateRange: { start: rangeStart, end: rangeEnd },
                transactionCount: transactions.length,
                transactions: transactions.map(t => ({
                    id: t.id,
                    amount: t.amount,
                    category: t.category,
                    subcategory: t.subcategory,
                    occured_at: t.occured_at,
                })),
                budgetSplit,
                monthlyIncome,
                spendingSplit,
                calculation: {
                    needsPercent: `${budgetSplit.needs} / ${monthlyIncome} = ${monthlyIncome > 0 ? Math.round((budgetSplit.needs / monthlyIncome) * 100) : 0}%`,
                    wantsPercent: `${budgetSplit.wants} / ${monthlyIncome} = ${monthlyIncome > 0 ? Math.round((budgetSplit.wants / monthlyIncome) * 100) : 0}%`,
                    savingsPercent: `${budgetSplit.investing} / ${monthlyIncome} = ${monthlyIncome > 0 ? Math.round((budgetSplit.investing / monthlyIncome) * 100) : 0}%`,
                }
            }
        });
    } catch (err) {
        console.error('Debug error:', err);
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;