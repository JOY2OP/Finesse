# Web Debug Mode

## How to Run on Web

1. Start the web server:
```bash
npm run web
```

2. Open your browser to the URL shown (usually http://localhost:8081)

3. The app will automatically bypass authentication on web and show mock transaction data

## What's Changed

- **app/_layout.tsx**: Detects web platform and creates a mock session with user ID `web-debug-user`
- **components/transactions/useTransactions.ts**: Returns 5 mock transactions with different categories and subcategories when running on web

## Mock Data Includes

- Grocery Shopping (Needs → Groceries) - ₹2,500
- Netflix Subscription (Wants → Streaming) - ₹649
- SIP Investment (Investing → SIP) - ₹5,000
- Uber Ride (Needs → Transport) - ₹350
- Zomato Order (Wants → Food Delivery) - ₹450

## Browser DevTools

Use browser DevTools (F12) to:
- Inspect CSS styles
- Debug layout issues
- Test responsive design
- Check console logs

## Reverting Changes

To disable web debug mode, remove the Platform.OS === 'web' check in `app/_layout.tsx`
