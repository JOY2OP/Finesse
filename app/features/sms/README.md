# SMS Transaction Detection Feature

A robust Axio-style SMS notification system for Android that automatically detects bank transactions from SMS messages and provides native notifications with categorization actions.

## Architecture

This feature uses a hybrid approach combining:

1. **Native Android BroadcastReceiver** - Intercepts SMS messages in real-time at the OS level
2. **React Native Bridge** - Passes transaction data from native to JavaScript
3. **Expo Config Plugin** - Injects native code during build time (works with EAS Build)

## Components

### Native Layer (Kotlin)

- **SMSBroadcastReceiver.kt** - Listens for incoming SMS, parses bank transactions, shows notifications
- **NotificationActionReceiver.kt** - Handles notification action buttons (Ignore)
- **TransactionModule.kt** - React Native bridge module for passing transaction data
- **TransactionPackage.kt** - Registers the native module with React Native

### JavaScript Layer

- **nativeBridge.ts** - TypeScript interface to native TransactionModule
- **useSMSTransactions.ts** - React hook that integrates native and JS transaction handling
- **parser.ts** - SMS parsing logic (regex patterns for Indian banks)
- **notifications.ts** - Expo Notifications integration
- **transactionManager.ts** - Manages transaction state and deduplication

### Build Configuration

- **plugins/withSmsListener.js** - Expo Config Plugin that:
  - Adds SMS permissions to AndroidManifest.xml
  - Registers BroadcastReceivers
  - Injects Kotlin files during prebuild
  - Modifies MainActivity and MainApplication

## How It Works

### 1. SMS Reception (Native)

When an SMS arrives:
1. Android OS broadcasts `SMS_RECEIVED` intent
2. `SMSBroadcastReceiver` intercepts it (priority 999)
3. Receiver checks if it's a bank SMS using regex patterns
4. Parses amount, type (debit/credit), merchant, account number
5. Shows native notification with "Categorize" and "Ignore" buttons

### 2. User Interaction

**Option A: User taps "Categorize"**
- Opens app with transaction data in Intent extras
- `MainActivity.onNewIntent()` passes Intent to `TransactionModule`
- React Native retrieves data via `NativeTransactionBridge.getPendingTransaction()`
- Shows categorization modal with pre-filled data

**Option B: User taps "Ignore"**
- `NotificationActionReceiver` dismisses notification
- No app interaction needed

### 3. App Foreground Detection

When app comes to foreground:
1. `AppState` listener in `useSMSTransactions` detects state change
2. Calls `NativeTransactionBridge.getPendingTransaction()`
3. If transaction data exists, shows categorization modal
4. Clears transaction data to prevent duplicate processing

## SMS Parsing Patterns

Optimized for Indian banks (HDFC, ICICI, SBI, Axis, Kotak, etc.):

```kotlin
// Amount: Rs. 1,234.56 or INR 1234.56 or ₹1234
AMOUNT_PATTERN = "(?:Rs\\.?|INR|₹)\\s*([\\d,]+\\.?\\d*)"

// Transaction Type
DEBIT_PATTERN = "(?:debited|paid|debit|spent|withdrawn|purchase|transferred)"
CREDIT_PATTERN = "(?:credited|credit|received|deposited)"

// Merchant: "at Swiggy" or "to Amazon" or "from John"
MERCHANT_PATTERN = "(?:to|at|from)\\s+([A-Za-z0-9\\s&.-]+?)(?:\\s*,|\\s*UPI|\\s*on|\\s*\\.|$)"

// Account: A/C XX1234 or account 1234
ACCOUNT_PATTERN = "(?:A/C|account|a/c)[\\s:]*(?:XX)?(\\d{4})"
```

## Setup Instructions

### 1. Install Dependencies

Already installed in package.json:
- `expo-notifications` - For notification handling
- `react-native-android-sms-listener` - Fallback SMS listener
- `react-native-get-sms-android` - SMS reading

### 2. Configure Plugin

The plugin is already added to `app.json`:

```json
{
  "plugins": [
    "./plugins/withSmsListener.js"
  ]
}
```

### 3. Build the App

The plugin works with both local builds and EAS Build:

```bash
# Local development build
npx expo prebuild --clean
npx expo run:android

# EAS Build
eas build --platform android --profile development
```

### 4. Usage in React Native

```typescript
import { useSMSTransactions } from '@/features/sms';

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

  // Request permissions on mount
  useEffect(() => {
    if (hasPermission === false) {
      requestPermissions();
    }
  }, [hasPermission]);

  // Show modal when transaction is pending
  if (showCategorizationModal && pendingTransaction) {
    return (
      <CategorizationModal
        transaction={pendingTransaction}
        onDismiss={dismissCategorization}
        onConfirm={(category) => 
          confirmCategorization(pendingTransaction.id, category)
        }
      />
    );
  }

  return <YourApp />;
}
```

## Permissions

The plugin automatically adds these permissions:

- `android.permission.RECEIVE_SMS` - Intercept incoming SMS
- `android.permission.READ_SMS` - Read SMS content
- `android.permission.POST_NOTIFICATIONS` - Show notifications (Android 13+)

Runtime permissions are requested via `requestPermissions()`.

## Testing

### Test with Real SMS

1. Build and install the app
2. Send a test SMS from another phone:
   ```
   Your A/C XX1234 debited by Rs. 500.00 at Swiggy on 20-Apr-26. Avail bal: Rs. 10,000.00
   ```
3. Notification should appear immediately
4. Tap "Categorize" to open app with pre-filled data

### Test with Notification Tap

1. Receive SMS notification
2. Tap "Categorize" button
3. App should open with transaction modal
4. Data should be pre-filled (amount, merchant, type)

### Test App Foreground

1. Receive SMS while app is closed
2. Tap notification to open app
3. Transaction modal should appear automatically

## Troubleshooting

### Notifications not showing

- Check notification permissions: Settings > Apps > Your App > Notifications
- Check SMS permissions: Settings > Apps > Your App > Permissions
- Check logcat: `adb logcat | grep SMSBroadcastReceiver`

### Transaction data not passing to app

- Check logcat: `adb logcat | grep TransactionModule`
- Verify MainActivity.onNewIntent() is being called
- Check if Intent extras are present

### Build errors

- Run `npx expo prebuild --clean` to regenerate android folder
- Ensure package name matches: `com.jman.finesseeas`
- Check Kotlin files are in correct directory

## Advantages Over Previous Implementation

1. **Real-time Detection** - BroadcastReceiver intercepts SMS immediately (no polling)
2. **Works When App is Closed** - Native receiver runs independently
3. **Battery Efficient** - No background JavaScript execution
4. **Robust Parsing** - Native regex patterns optimized for Indian banks
5. **EAS Build Compatible** - Config plugin survives prebuild
6. **Native Notifications** - Better UX with action buttons
7. **Intent-based Data Passing** - Reliable transaction data flow

## Future Enhancements

- [ ] Add support for more bank formats
- [ ] Machine learning for merchant categorization
- [ ] Transaction history sync
- [ ] Multi-account support
- [ ] Custom notification sounds per bank
- [ ] Widget for quick transaction view
