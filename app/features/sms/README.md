# SMS Transaction Detection

Real-time SMS monitoring for automatic bank transaction detection.

## Features

- ✅ **Real-time SMS detection** via native BroadcastReceiver
- ✅ **Instant notifications** when transactions are detected
- ✅ **Background monitoring** - works even when app is closed
- ✅ **Smart parsing** - extracts amount, merchant, account, UPI ref
- ✅ **Deduplication** - prevents duplicate notifications
- ✅ **Battery efficient** - event-driven, not polling
- ✅ **Fallback polling** - backup in case real-time fails

## Architecture

```
smsListener.ts          → Real-time SMS listener (BroadcastReceiver)
smsReader.ts            → Read existing SMS (polling backup)
parser.ts               → Parse bank SMS into transactions
transactionManager.ts   → Orchestrates everything
notifications.ts        → Send notifications
deduplicator.ts         → Prevent duplicates
useSMSTransactions.ts   → React hook for UI
```

## Usage

```typescript
import { useSMSTransactions } from '@/app/features/sms';

function MyComponent() {
  const {
    isMonitoring,
    hasPermission,
    pendingTransaction,
    showCategorizationModal,
    requestPermissions,
    dismissCategorization,
    confirmCategorization,
  } = useSMSTransactions();

  // Automatically starts monitoring when permissions granted
  // Shows modal when transaction detected
}
```

## How It Works

1. **User grants SMS permission**
2. **Real-time listener starts** (BroadcastReceiver)
3. **SMS arrives** → Listener fires instantly
4. **Parser extracts** transaction details
5. **Deduplicator checks** if already seen
6. **Notification sent** with "Categorize" button
7. **User taps** → Modal opens for categorization

## Supported Banks

Works with all Indian banks that send SMS in this format:
- Amount: `Rs.500` or `INR 500`
- Type: `debited`, `credited`, `paid`, `received`
- Account: `A/C XX1234`
- Merchant: `at Swiggy` or `to John Doe`
- UPI: `UPI Ref 123456789`

## Testing

Send yourself a test SMS:
```
Rs.500 debited from A/C XX1234 on 15-04-26 at Swiggy UPI Ref 123456789
```

Check logs for:
```
[SMS Listener] 🔔 NEW SMS RECEIVED
[TM] 🔔 Real-time SMS received, processing...
[TM] Notification sent
```

## Permissions Required

```json
"android": {
  "permissions": [
    "android.permission.READ_SMS",
    "android.permission.RECEIVE_SMS"
  ]
}
```

## Libraries Used

- `react-native-android-sms-listener` - Real-time SMS (BroadcastReceiver)
- `react-native-get-sms-android` - Read existing SMS (backup)
- `expo-notifications` - Send notifications

## Production Ready

- ✅ Works in EAS builds
- ✅ No ejection needed
- ✅ Background detection
- ✅ Battery efficient
- ✅ Error handling
- ✅ Deduplication
