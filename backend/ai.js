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
    const { data: existing } = await supabase
        .from('monthly_summary')
        .select('id')
        .eq('user_id', user_id)
        .eq('month', monthKey)
        .single();

    if (existing) {
        const { error } = await supabase
            .from('monthly_summary')
            .update(fields)
            .eq('user_id', user_id)
            .eq('month', monthKey);
        if (error) console.error('⚠️ Failed to update summary:', error);
    } else {
        const { error } = await supabase
            .from('monthly_summary')
            .insert({ user_id, month: monthKey, ...fields });
        if (error) console.error('⚠️ Failed to insert summary:', error);
    }
};

// ─── Stats ───────────────────────────────────────────────────────────────────

const INVESTING_SUBCATEGORIES = new Set([
    'stocks', 'sip', 'mutual_fund', 'fd', 'fixed_deposit',
    'mutual fund', 'fixed deposit', 'ppf', 'nps', 'elss', 'etf',
    'crypto', 'cryptocurrency'
]);

const isInvestingSubcategory = (subcategory = '') =>
    INVESTING_SUBCATEGORIES.has(subcategory.toLowerCase().trim());

const getSpendingLabel = (subcategory, rank) => {
    if (isInvestingSubcategory(subcategory)) {
        return ['Top investing category', 'Consistent investment', 'Regular contribution'][rank];
    }
    return ['Highest spend category', 'Second biggest drain', 'Smaller, but frequent'][rank];
};

const buildBudgetSplit = (transactions) => {
    return transactions.reduce((acc, t) => {
            const cat = (t.category || '').toLowerCase().trim();
            if      (cat === 'needs')                            acc.needs     += t.amount;
            else if (cat === 'wants')                            acc.wants     += t.amount;
            else if (cat === 'investing' || cat === 'savings')   acc.investing += t.amount;
            return acc;
        },
        { needs: 0, wants: 0, investing: 0 }
    );
};

const buildSpendingSplit = (budgetSplit, monthlyIncome) => {
    const needsPct   = monthlyIncome > 0 ? Math.round((budgetSplit.needs     / monthlyIncome) * 100) : 0;
    const wantsPct   = monthlyIncome > 0 ? Math.round((budgetSplit.wants     / monthlyIncome) * 100) : 0;
    const savingsPct = monthlyIncome > 0 ? Math.round((budgetSplit.investing / monthlyIncome) * 100) : 0;

    return [
        { category: 'Needs',   expected: '50%', actual: `${needsPct}%`   },
        { category: 'Wants',   expected: '30%', actual: `${wantsPct}%`   },
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
        .sort(([, a], [, b]) => b - a)
        .slice(0, 3);

    const rankedCategories = sortedCategories.map(([category, amount], i) => ({
        rank:     i + 1,
        category: formatCategoryName(category),
        amount:   toInr(amount),
        label:    getSpendingLabel(category, i),       // ← fixed: context-aware label
        isInvesting: isInvestingSubcategory(category), // ← flag for Gemini prompt
    }));

    return { totalSpent, sortedCategories, spendingSplit, rankedCategories, budgetSplit };
};

// ─── AI ──────────────────────────────────────────────────────────────────────

const generateAIContent = async (stats) => {
    const { totalSpent, sortedCategories, spendingSplit, rankedCategories } = stats;

    // Build top categories text, distinguishing investing from spending
    const topCatsText = rankedCategories.map((cat, i) => {
        const tag = cat.isInvesting ? '[INVESTING]' : '[SPENDING]';
        return `${i + 1}. ${cat.category} ${cat.amount} ${tag}`;
    }).join('\n');

    const prompt = `
You are a financial coach for a budgeting app. Analyze the spending data below and return ONLY a single valid JSON object — no markdown, no explanations.

SPENDING DATA:
Total Spent: ${toInr(totalSpent)}
Needs: ${spendingSplit[0].actual} | Wants: ${spendingSplit[1].actual} | Savings: ${spendingSplit[2].actual}
Top Categories:
${topCatsText}

IMPORTANT: Categories tagged [INVESTING] are positive financial behaviour (stocks, SIP, mutual funds etc).
Do NOT frame them as drains or negatives. Treat [SPENDING] categories normally.

RETURN THIS EXACT SCHEMA:
{
  "review_status": "OK | Good | Great | Excellent",
  "review_summary": "<emoji + one sentence under 20 words>",
  "review_insights": ["<string>", "<string>", "<string>", "<string>"],
  "review_ranked_categories": [
    { "rank": 1, "category": "<name>", "amount": "₹<n>", "label": "<context-appropriate label>" },
    { "rank": 2, "category": "<name>", "amount": "₹<n>", "label": "<context-appropriate label>" },
    { "rank": 3, "category": "<name>", "amount": "₹<n>", "label": "<context-appropriate label>" }
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
- For [INVESTING] categories: use positive labels like "Top investing category", "Consistent investment", "Regular contribution"
- For [SPENDING] categories: use labels like "Highest spend category", "Second biggest drain", "Smaller, but frequent"
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
    { type: 'curb',      emoji: '🛍️', title: 'Shopping',      metric: { target: 1000, unit: 'currency' }, priority: 1, missionType: 'CURB'      },
    { type: 'maintain',  emoji: '🛒', title: 'Groceries',     metric: { target: 1500, unit: 'currency' }, priority: 2, missionType: 'MAINTAIN'  },
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

    return [
        { type: 'encourage', emoji: '💰', title: 'Hit Savings Target', metric: { target: savingsTarget,             unit: 'currency' }, priority: 1, missionType: 'ENCOURAGE' },
        { type: 'maintain',  emoji: '🏠', title: 'Essentials Budget',  metric: { target: Math.round(income * 0.50), unit: 'currency' }, priority: 2, missionType: 'MAINTAIN'  },
        { type: 'curb',      emoji: '🛍️', title: 'Wants Limit',        metric: { target: Math.round(income * 0.30), unit: 'currency' }, priority: 3, missionType: 'CURB'      },
    ];
};

// ─── Challenge Progress ──────────────────────────────────────────────────────

const attachProgress = (challenges, budgetSplit, transactions = []) => {
    // Build a per-subcategory spend map from raw transactions for precise matching
    const subcategorySpend = transactions.reduce((acc, t) => {
        const key = (t.subcategory || t.category || '').toLowerCase().trim();
        acc[key] = (acc[key] || 0) + t.amount;
        return acc;
    }, {});

    return challenges.map((challenge) => {
        const target    = challenge.metric?.target || 0;
        const titleKey  = (challenge.title || '').toLowerCase().trim();

        // Match challenge title against subcategory keys:
        // 1. Exact match: "rent" === "rent"
        // 2. Partial match: title contains the key or key contains the title
        //    e.g. "rent expenses" contains "rent", or "food delivery" matches "food_delivery"
        const normalise = (s) => s.replace(/[_\s-]+/g, ' ').trim();
        const normTitle = normalise(titleKey);

        // Investments are accumulation goals even if an older AI-generated
        // challenge incorrectly stored them as a spending-maintenance goal.
        const challengeType = isInvestingSubcategory(titleKey)
            ? 'encourage'
            : challenge.type;

        let subcategoryMatch;
        // exact first
        if (subcategorySpend[titleKey] !== undefined) {
            subcategoryMatch = subcategorySpend[titleKey];
        } else {
            // find the best partial match
            for (const [key, val] of Object.entries(subcategorySpend)) {
                const normKey = normalise(key);
                if (normTitle.includes(normKey) || normKey.includes(normTitle)) {
                    subcategoryMatch = val;
                    break;
                }
            }
        }

        const bucketSpend = { encourage: budgetSplit.investing, maintain: budgetSplit.needs, curb: budgetSplit.wants };
        const bucketChallengeTitles = new Set([
            'hit savings target', 'savings target', 'total savings', 'investing target',
            'essentials budget', 'needs budget', 'essential spending', 'needs',
            'wants limit', 'wants budget', 'discretionary spending', 'wants',
        ]);
        const shouldUseBucketFallback = bucketChallengeTitles.has(normTitle);

        // A named challenge such as Stocks, SIP, or Groceries must only use
        // transactions from that matching subcategory. No match means zero.
        const currentSpend = subcategoryMatch !== undefined
            ? subcategoryMatch
            : shouldUseBucketFallback ? (bucketSpend[challengeType] ?? 0) : 0;

        // No cap — let progress exceed 100 so the UI can show 126% etc.
        const progress = target > 0 ? Math.round((currentSpend / target) * 100) : 0;

        // console.log(`[progress] "${challenge.title}" | titleKey="${titleKey}" | subcategoryMatch=${subcategoryMatch} | currentSpend=${currentSpend} | target=${target} | progress=${progress}%`);
        const overAmount  = currentSpend > target ? toInr(Math.round(currentSpend - target)) : null;

        let status = 'regular', statusText = '';

        if (challengeType === 'encourage') {
            // Higher spend = better; exceeding target is a bonus
            if (progress >= 100) {
                status = 'completed';
                statusText = overAmount ? `+${overAmount} extra saved` : 'Target Hit!';
            } else if (progress >= 75) { statusText = 'Almost there'; }
            else if (progress >= 50)   { statusText = 'In progress';  }
            else                       { statusText = 'Just started'; }
        } else if (challengeType === 'maintain') {
            // Exceeding the ceiling is bad
            if (progress >= 100) {
                status = 'warning';
                statusText = overAmount ? `Over by ${overAmount}` : 'Over budget';
            } else if (progress >= 80) { status = 'warning'; statusText = 'Near limit';  }
            else if (progress >= 50)   {                      statusText = 'On Track';    }
            else                       {                      statusText = 'Well within'; }
        } else if (challengeType === 'curb') {
            // Exceeding the curb target is bad
            if (progress >= 100) {
                status = 'warning';
                statusText = overAmount ? `Over by ${overAmount}` : 'Over limit';
            } else if (progress >= 80) { status = 'warning'; statusText = 'Near limit'; }
            else if (progress >= 50)   {                      statusText = 'In control'; }
            else                       {                      statusText = 'Great job';  }
        }

        return {
            ...challenge,
            type: challengeType,
            missionType: challengeType !== challenge.type ? 'ENCOURAGE' : challenge.missionType,
            progress,
            status,
            statusText,
            currentSpend,
        };
    });
};

// ─── Routes ──────────────────────────────────────────────────────────────────

router.get('/lastMonth', async (req, res) => {
    try {
        const { user_id } = req.query;
        if (!user_id) return res.status(400).json({ error: 'user_id is required' });

        const lastMonthKey = getLastMonthKey();

        const cached = await fetchMonthlySummary(user_id, lastMonthKey);
        if (cached && cached.review_ranked_categories) {
            // Keep AI-written copy cached, but calculate the numeric table from
            // live transactions so edits and deletions are reflected immediately.
            const transactions  = await fetchTransactions(user_id, getLastMonthRange());
            const preferences   = await fetchPreferences(user_id);
            const monthlyIncome = preferences?.monthly_income || 0;
            const stats         = buildSpendingStats(transactions, monthlyIncome);

            return res.json({
                success: true,
                data: {
                    review_status:            cached.review_status,
                    review_summary:           cached.review_summary,
                    review_insights:          cached.review_insights,
                    review_spending_split:    stats.spendingSplit,
                    review_ranked_categories: stats.rankedCategories,
                }
            });
        }

        const transactions = await fetchTransactions(user_id, getLastMonthRange());

        if (transactions.length < 5) {
            return res.json({ success: true, data: {
                review_status:            null,
                review_summary:           'No data yet — keep tracking this month to unlock your first review.',
                review_insights:          null,
                review_spending_split:    null,
                review_ranked_categories: null,
            }});
        }

        const preferences   = await fetchPreferences(user_id);
        const monthlyIncome = preferences?.monthly_income || 0;
        const stats         = buildSpendingStats(transactions, monthlyIncome);

        let aiContent = null;
        try { aiContent = await generateAIContent(stats); }
        catch (e) {
            console.error('⚠️ AI generation failed:', e.message);
            aiContent = {
                review_status:            'OK',
                review_summary:           `💡 Last month you spent ${toInr(stats.totalSpent)} across ${transactions.length} transactions.`,
                review_insights: [
                    `Top category: ${stats.rankedCategories[0]?.category} at ${stats.rankedCategories[0]?.amount}.`,
                    `Total spending: ${toInr(stats.totalSpent)}.`,
                    `Wants: ${stats.spendingSplit[1].actual} of budget.`,
                    `Savings rate: ${stats.spendingSplit[2].actual}.`,
                ],
                review_ranked_categories: stats.rankedCategories,
                challenges:               FALLBACK_ACTIONS,
            };
        }

        const finalFields = {
            is_onboarding:            false,
            review_status:            aiContent.review_status,
            review_summary:           aiContent.review_summary,
            review_insights:          aiContent.review_insights,
            review_spending_split:    stats.spendingSplit,
            review_ranked_categories: aiContent.review_ranked_categories,
            challenges:               aiContent.challenges,
        };

        await saveMonthlySummary(user_id, lastMonthKey, finalFields);

        return res.json({
            success: true,
            data: {
                review_status:            finalFields.review_status,
                review_summary:           finalFields.review_summary,
                review_insights:          finalFields.review_insights,
                review_spending_split:    finalFields.review_spending_split,
                review_ranked_categories: finalFields.review_ranked_categories,
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

        const prevMonthKey    = getLastMonthKey();
        const currentMonthKey = getCurrentMonthKey();
        const preferences     = await fetchPreferences(user_id);
        if (!preferences) return res.status(404).json({ error: 'User preferences not found' });

        const prevRow = await fetchMonthlySummary(user_id, prevMonthKey);

        let challenges;
        if (!prevRow || prevRow.is_onboarding) {
            challenges = buildOnboardingData(preferences);
            await saveMonthlySummary(user_id, currentMonthKey, {
                is_onboarding: true,
                challenges,
            });
        } else {
            challenges = prevRow.challenges || [];
        }

        const transactions  = await fetchTransactions(user_id, getCurrentMonthRange());
        const budgetSplit   = buildBudgetSplit(transactions);
        const monthlyIncome = preferences?.monthly_income || 0;
        const spendingSplit = buildSpendingSplit(budgetSplit, monthlyIncome);
        const stats         = buildSpendingStats(transactions, monthlyIncome);

        const challengesWithProgress = attachProgress(challenges, budgetSplit, transactions);

        // ── Live insights based on current month transactions ──────────────
        const totalSpent    = budgetSplit.needs + budgetSplit.wants + budgetSplit.investing;
        const topCat        = stats.rankedCategories[0];
        const secondCat     = stats.rankedCategories[1];
        const savingsGap    = (preferences.monthly_savings_target || 0) - budgetSplit.investing;
        const incomeUsedPct = monthlyIncome > 0 ? Math.round((totalSpent / monthlyIncome) * 100) : 0;

        const insights = transactions.length < 3
            ? [
                `Your monthly income is ${toInr(monthlyIncome)}.`,
                `Target savings: ${toInr(preferences.monthly_savings_target)}.`,
                'Keep tracking your expenses to see live insights.',
                'New challenges will be generated at the start of next month.',
            ]
            : [
                `You have used ${incomeUsedPct}% of your income (${toInr(totalSpent)} of ${toInr(monthlyIncome)}) this month.`,
                topCat
                    ? `${topCat.category} leads your spending at ${topCat.amount}${secondCat ? `, with ${secondCat.category} close behind at ${secondCat.amount}` : ''}.`
                    : `Needs are at ${spendingSplit[0].actual} of your income this month.`,
                `Needs ${spendingSplit[0].actual} vs Wants ${spendingSplit[1].actual} vs Savings ${spendingSplit[2].actual} - target is 50/30/20.`,
                savingsGap <= 0
                    ? `Savings target hit. You are ${toInr(Math.abs(savingsGap))} ahead of your ${toInr(preferences.monthly_savings_target)} goal.`
                    : `${toInr(savingsGap)} left to reach your ${toInr(preferences.monthly_savings_target)} savings target.`,
            ];

        return res.json({
            success: true,
            data: {
                challenges:   challengesWithProgress,
                spendingSplit,
                insights,
                summary: prevRow?.review_summary || `🚀 Welcome! Let's hit your ${toInr(monthlyIncome)} budget goal.`,
                status:  prevRow?.review_status  || 'Good',
            }
        });

    } catch (err) {
        console.error('Unhandled error in /thisMonth:', err);
        res.status(500).json({ error: 'Failed to fetch this month data', details: err.message });
    }
});

module.exports = router;
