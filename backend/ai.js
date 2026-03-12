const express = require('express');
const { GoogleGenAI } = require('@google/genai');
const { supabase } = require('./supabase');
require('dotenv').config();

const router = express.Router();
const ai = new GoogleGenAI({ apikey: process.env.GEMINI_API_KEY });

// ─── Helpers ────────────────────────────────────────────────────────────────

/**
 * Returns the first day of last month as a YYYY-MM-DD string,
 * computed in LOCAL time (avoids UTC rollback bug, e.g. IST → previous month).
 */
const getLastMonthKey = () => {
    const now = new Date();
    const year  = now.getMonth() === 0 ? now.getFullYear() - 1 : now.getFullYear();
    const month = now.getMonth() === 0 ? 12 : now.getMonth(); // 1-based
    return `${year}-${String(month).padStart(2, '0')}-01`;
};

/**
 * Returns the first day of current month as a YYYY-MM-DD string.
 */
const getCurrentMonthKey = () => {
    const now = new Date();
    const year  = now.getFullYear();
    const month = now.getMonth() + 1; // 1-based
    return `${year}-${String(month).padStart(2, '0')}-01`;
};

/** Returns [start ISO, end ISO] of last month in UTC, safe for Supabase range queries. */
const getLastMonthRange = () => {
    const now   = new Date();
    const start = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const end   = new Date(now.getFullYear(), now.getMonth(),     0, 23, 59, 59, 999);
    return [start.toISOString(), end.toISOString()];
};

const formatCategoryName = (cat) =>
    cat.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');

const pct = (part, total) =>
    total > 0 ? `${Math.round((part / total) * 100)}%` : '0%';

// ─── Data processing (pure, no side-effects) ────────────────────────────────

const buildSpendingStats = (transactions) => {
    const totalSpent = transactions.reduce((sum, t) => sum + t.amount, 0);

    // Category totals (subcategory level for display)
    const categoryTotals = transactions.reduce((acc, t) => {
        const cat = t.subcategory || 'Other';
        acc[cat] = (acc[cat] || 0) + t.amount;
        return acc;
    }, {});

    const sortedCategories = Object.entries(categoryTotals)
        .sort(([, a], [, b]) => b - a)
        .slice(0, 3);

    // Budget split (needs / wants / investing)
    const budgetSplit = transactions.reduce(
        (acc, t) => {
            const cat = (t.category || '').toLowerCase();
            if (cat === 'needs')     acc.needs     += t.amount;
            else if (cat === 'wants')    acc.wants     += t.amount;
            else if (cat === 'investing') acc.investing += t.amount;
            return acc;
        },
        { needs: 0, wants: 0, investing: 0 }
    );

    const spendingSplit = [
        { category: 'Needs',   expected: '50%', actual: pct(budgetSplit.needs,     totalSpent) },
        { category: 'Wants',   expected: '30%', actual: pct(budgetSplit.wants,     totalSpent) },
        { category: 'Savings', expected: '20%', actual: pct(budgetSplit.investing, totalSpent) },
    ];

    const rankedCategories = sortedCategories.map(([category, amount], i) => ({
        rank:     i + 1,
        category: formatCategoryName(category),
        amount:   `₹${amount.toLocaleString('en-IN')}`,
        label:    i === 0 ? 'Highest spend category'
                : i === 1 ? 'Second biggest drain'
                :           'Smaller, but frequent',
    }));

    const savingsPercent = totalSpent > 0
        ? (budgetSplit.investing / totalSpent) * 100
        : 0;
    const status = savingsPercent >= 20 ? 'Great' : savingsPercent >= 15 ? 'Good' : 'OK';

    return { totalSpent, sortedCategories, spendingSplit, rankedCategories, status, budgetSplit };
};

// ─── Single Gemini call ──────────────────────────────────────────────────────

const generateAIContent = async ({ totalSpent, sortedCategories, spendingSplit }) => {
    const topCatsText = sortedCategories
        .map(([cat, amt], i) => `${i + 1}. ${formatCategoryName(cat)} ₹${amt.toLocaleString('en-IN')}`)
        .join('\n');

    const prompt = `
You are a financial coach for a budgeting app. Analyze the spending data below and return ONLY a single valid JSON object — no markdown, no explanations.

SPENDING DATA:
Total Spent: ₹${totalSpent.toLocaleString('en-IN')}
Budget Split:
  Needs:   ${spendingSplit[0].actual}
  Wants:   ${spendingSplit[1].actual}
  Savings: ${spendingSplit[2].actual}
Top Categories:
${topCatsText}

RETURN THIS EXACT SCHEMA:
{
  "insights": ["<string under 15 words>", "<string>", "<string>", "<string>"],
  "summary": "<one sentence starting with an emoji, under 20 words, honest about financial health>",
  "actions": [
    {
      "type": "curb | encourage | maintain",
      "title": "<category or action name>",
      "emoji": "<relevant emoji>",
      "metric": { "target": <number>, "unit": "currency" },
      "priority": <1|2|3>
    }
  ]
}

RULES:
- insights: exactly 4 strings, each under 15 words, specific with numbers
- summary: exactly 1 sentence, starts with emoji, under 20 words
- actions: exactly 3 objects
  - curb: use when wants > 30%; target = 70-80% of last month's spend
  - encourage: use when savings < 20%; target = reasonable monthly contribution
  - maintain: use for stable/essential categories; target = similar to last month
- Return ONLY the JSON object.
`;

    const response = await ai.models.generateContent({
        model:    'gemini-2.5-flash-lite',
        contents: prompt,
    });

    const raw = response.text.trim().replace(/^```json\s*/i, '').replace(/```$/i, '');

    // Extract JSON object from response (robust to any stray text)
    const jsonMatch = raw.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error('Gemini did not return valid JSON');

    return JSON.parse(jsonMatch[0]);
};

// ─── Fallback result when there are no transactions ─────────────────────────

const emptyResult = () => ({
    status:          'OK',
    rankedCategories: [],
    insights:        ['No transactions found for last month.'],
    spendingSplit:   [],
    summary:         'No spending data available for last month.',
    actions:         [],
});

// ─── Default actions/insights if AI parsing fails ───────────────────────────

const fallbackActions = [
    { type: 'curb',     title: 'Reduce top spending',    emoji: '🎯', metric: { target: 1000, unit: 'currency' }, priority: 1 },
    { type: 'encourage',title: 'Increase savings',       emoji: '💰', metric: { target: 500,  unit: 'currency' }, priority: 2 },
    { type: 'maintain', title: 'Keep essentials steady', emoji: '✨', metric: { target: 2000, unit: 'currency' }, priority: 3 },
];

// ─── Routes ──────────────────────────────────────────────────────────────────

router.get('/lastMonth', async (req, res) => {
    try {
        const { user_id } = req.query;
        if (!user_id) return res.status(400).json({ error: 'user_id is required' });

        console.log('🎯 /lastMonth for user:', user_id);

        const lastMonthKey = getLastMonthKey();
        const currentMonthKey = getCurrentMonthKey();
        console.log('Last month key:', lastMonthKey, '| Current month key:', currentMonthKey);

        // ── 1. Check if summary already exists for CURRENT month (where actions are stored) ──
        const { data: cached, error: cacheError } = await supabase
            .from('monthly_summary')
            .select('*')
            .eq('user_id', user_id)
            .eq('month', currentMonthKey)
            .single();

        if (!cacheError && cached) {
            console.log('✅ Returning cached summary for current month');
            return res.json({
                success: true,
                data: { ...cached.summary, actions: cached.action },
            });
        }

        // ── 2. Fetch transactions from LAST month ──
        const [rangeStart, rangeEnd] = getLastMonthRange();
        console.log('Fetching transactions:', rangeStart, '→', rangeEnd);

        const { data: transactions, error: txError } = await supabase
            .from('transactions')
            .select('*')
            .eq('user_id', user_id)
            .gte('occured_at', rangeStart)
            .lte('occured_at', rangeEnd)
            .order('amount', { ascending: false });

        if (txError) {
            console.error('Supabase error:', txError);
            return res.status(500).json({ error: txError.message });
        }

        console.log(`Found ${transactions?.length ?? 0} transactions`);

        if (!transactions?.length) {
            return res.json({ success: true, data: emptyResult() });
        }

        // ── 3. Compute spending stats (no AI needed) ──
        const stats = buildSpendingStats(transactions);
        console.log('Stats:', {
            totalSpent:   stats.totalSpent,
            spendingSplit: stats.spendingSplit,
            sortedCategories: stats.sortedCategories,
        });

        // ── 4. Single Gemini call ──
        let aiContent;
        try {
            aiContent = await generateAIContent(stats);
        } catch (aiErr) {
            console.error('⚠️ AI generation failed:', aiErr.message);
            aiContent = null;
        }

        const result = {
            status:          stats.status,
            rankedCategories: stats.rankedCategories,
            spendingSplit:   stats.spendingSplit,
            insights: aiContent?.insights?.length
                ? aiContent.insights.slice(0, 4)
                : [
                    `Top category: ${stats.rankedCategories[0]?.category} at ${stats.rankedCategories[0]?.amount}.`,
                    `Total spending: ₹${stats.totalSpent.toLocaleString('en-IN')}.`,
                    `Wants: ${stats.spendingSplit[1].actual} of budget.`,
                    `Savings rate: ${stats.spendingSplit[2].actual}.`,
                ],
            summary: aiContent?.summary
                || `💡 Last month you spent ₹${stats.totalSpent.toLocaleString('en-IN')} across ${transactions.length} transactions.`,
            actions: aiContent?.actions?.length === 3
                ? aiContent.actions
                : fallbackActions,
        };

        // ── 5. Persist to Supabase with CURRENT month key (actions are for THIS month) ──
        const { error: insertError } = await supabase
            .from('monthly_summary')
            .insert({
                user_id,
                month: currentMonthKey,
                summary: {
                    status:          result.status,
                    rankedCategories: result.rankedCategories,
                    insights:        result.insights,
                    spendingSplit:   result.spendingSplit,
                    summary:         result.summary,
                },
                action: result.actions,
            });

        if (insertError) console.error('⚠️ Failed to save summary:', insertError);
        else             console.log('💾 Saved to DB with month key:', currentMonthKey);

        return res.json({ success: true, data: result });

    } catch (err) {
        console.error('Unhandled error in /lastMonth:', err);
        res.status(500).json({ error: 'Failed to fetch AI response', details: err.message });
    }
});

router.get('/thisMonth', async (req, res) => {
    try {
        const { user_id } = req.query;
        if (!user_id) return res.status(400).json({ error: 'user_id is required' });

        console.log('🎯 /thisMonth for user:', user_id);

        // Actions for THIS month are stored with current month key
        const currentMonthKey = getCurrentMonthKey();
        console.log('Looking up actions from month key:', currentMonthKey);

        const { data: row, error } = await supabase
            .from('monthly_summary')
            .select('action')
            .eq('user_id', user_id)
            .eq('month', currentMonthKey)
            .single();

        if (error || !row) {
            console.log('No actions found');
            return res.json({ success: true, data: { challenges: [] } });
        }

        console.log('✅ Found actions');
        return res.json({ success: true, data: { challenges: row.action || [] } });

    } catch (err) {
        console.error('Unhandled error in /thisMonth:', err);
        res.status(500).json({ error: 'Failed to fetch this month data', details: err.message });
    }
});

module.exports = router;