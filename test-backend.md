# Backend Testing Steps

## ✅ CRITICAL FIX APPLIED

**Issue Found:** The `monthly_summary` table was missing the `is_onboarding` column.
**Fix:** Removed all references to `is_onboarding` from the backend code.

## 1. Restart Your Backend Server (REQUIRED!)
```bash
# Stop the current server (Ctrl+C)
# Then restart it
npm start
# or
node server.js
```

**You MUST restart the server for the fix to take effect!**

## 2. Test the Debug Endpoint
Visit: `http://localhost:3000/ai/debug/transactions?user_id=17445612-2c19-4ff3-b147-bf1c9d36b96c`

You should see:
```json
{
  "budgetSplit": {
    "needs": 4000,
    "wants": 0,
    "investing": 0
  }
}
```

## 3. Test the This Month Endpoint
Visit: `http://localhost:3000/ai/thisMonth?user_id=17445612-2c19-4ff3-b147-bf1c9d36b96c`

Check the backend console logs for:
```
📊 Found 1 transactions for current month
🔍 Processing transactions: [...]
  → Transaction: 4000, category: "Needs" → normalized: "needs"
💰 Budget Split: { needs: 4000, wants: 0, investing: 0 }
🎯 Attaching progress to actions...
   Action: Essentials Budget (maintain)
     Target: 20000, Current: 4000, Progress: 20%
```

## 4. Check the Response
The response should include:
```json
{
  "success": true,
  "data": {
    "challenges": [
      {
        "title": "Hit Savings Target",
        "progress": 0,
        ...
      },
      {
        "title": "Essentials Budget",
        "progress": 20,  ← Should be 20% (4000/20000)
        ...
      },
      {
        "title": "Wants Limit",
        "progress": 0,
        ...
      }
    ],
    "spendingSplit": [
      { "category": "Needs", "expected": "50%", "actual": "10%" },  ← 4000/40000 = 10%
      { "category": "Wants", "expected": "30%", "actual": "0%" },
      { "category": "Savings", "expected": "20%", "actual": "0%" }
    ]
  }
}
```

## 5. In the App
1. Click the 🔄 refresh button in the top right
2. The "Essentials Budget" card should show 20% progress (₹4,000 / ₹20,000 target)
3. The Spending Split table should show:
   - Needs: 10% (₹4,000 / ₹40,000 income)
   - Wants: 0%
   - Savings: 0%

## Understanding the Two Different Percentages

**Challenge Progress (20%):**
- Shows progress toward your BUDGET TARGET
- Essentials Budget target: ₹20,000 (50% of ₹40,000)
- You spent: ₹4,000
- Progress: 4000/20000 = 20%

**Spending Split Actual (10%):**
- Shows percentage of your MONTHLY INCOME
- Monthly income: ₹40,000
- You spent on needs: ₹4,000
- Actual: 4000/40000 = 10%
- Goal is 50%, so you're well within budget!

## If Still Not Working

Check these:
1. ✅ Backend server restarted?
2. ✅ Transaction category is "Needs" or "needs"?
3. ✅ Transaction date is in April 2026?
4. ✅ Your preferences table has monthly_income set (this determines the target)?
5. ✅ Check backend console for any errors
