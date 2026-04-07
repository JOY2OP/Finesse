# Debug Guide: Transaction Progress Not Showing

## ✅ ISSUE FOUND AND FIXED!

The backend now handles both uppercase and lowercase category names:
- `"Needs"` or `"needs"` → both work ✓
- `"Wants"` or `"wants"` → both work ✓
- `"Investing"` or `"investing"` or `"Savings"` or `"savings"` → all work ✓

**Your transaction with `"category": "Needs"` will now be counted correctly!**

## How to See the Fix

1. **Refresh your app** - Switch tabs or reload the page
2. **Check the "This Month" tab** - You should now see:
   - Progress bar showing 40% (₹4,000 out of your Essentials Budget target)
   - Spending Split table showing actual percentages
   - Your ₹4,000 rent transaction being counted

3. **Expected Result:**
   - If your "Essentials Budget" target is ₹10,000, you'll see 40% progress
   - Spending Split will show "Needs: 100%" (since you only have needs spending so far)

## Debugging Steps (if still needed)

### 1. Check Your Transaction Data
Visit this URL in your browser (replace `YOUR_USER_ID` with your actual user ID):
```
http://localhost:3000/ai/debug/transactions?user_id=YOUR_USER_ID
```

This will show you:
- How many transactions were found
- The date range being searched
- Each transaction's category, amount, and date
- The calculated budget split

### 2. Verify Transaction Requirements

Your transaction MUST have:
- **category**: Must be exactly one of: `needs`, `wants`, or `investing` (lowercase)
- **amount**: A number (e.g., 1000)
- **occured_at**: A timestamp in the current month (April 2026)
- **user_id**: Your user ID

### 3. Common Issues

#### ✅ FIXED: Category case sensitivity
The backend now accepts both:
- `"Needs"` and `"needs"` ✓
- `"Wants"` and `"wants"` ✓  
- `"Investing"`, `"investing"`, `"Savings"`, `"savings"` ✓

#### Issue: Date is wrong
❌ Wrong: Transaction from March 2026 or earlier
✅ Correct: Transaction from April 1-30, 2026
✅ Your transaction: April 1, 2026 - Perfect!

#### Issue: Amount is zero or null
❌ Wrong: `amount: 0` or `amount: null`
✅ Correct: `amount: 1000`
✅ Your transaction: ₹4,000 - Perfect!

### 4. Example Correct Transaction

```sql
INSERT INTO transactions (user_id, amount, category, subcategory, occured_at, description)
VALUES (
  'your-user-id-here',
  1500,
  'wants',
  'food_delivery',
  '2026-04-15T10:30:00Z',
  'Swiggy order'
);
```

### 5. Check Backend Logs

After refreshing the "This Month" tab, check your backend console for:
```
📊 Found X transactions for current month
📝 Sample transaction: { ... }
💰 Budget Split: { needs: 0, wants: 1500, investing: 0 }
📈 Spending Split: [ ... ]
🎯 Challenges with progress: [ ... ]
```

### 6. Expected Behavior

If you add a transaction with:
- `category: 'wants'`
- `amount: 1500`
- And your "Wants Limit" target is ₹5000

Then you should see:
- Progress bar at 30% (1500/5000)
- "30%" displayed next to the progress bar
- Spending Split table showing "30%" in the Wants row

### 7. Force Refresh

If data still doesn't show:
1. Close and reopen the app
2. Switch to "Last Month" tab, then back to "This Month"
3. Check the browser/app console for any errors

## Need More Help?

Check the backend console logs - they now include detailed debugging information about:
- How many transactions were found
- What categories they have
- How the budget split is calculated
- What progress values are being sent to the frontend
