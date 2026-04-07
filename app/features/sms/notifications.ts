import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import { ParsedTransaction } from './types';

// Configure notification handler
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

/**
 * Request notification permissions
 */
export async function requestNotificationPermissions(): Promise<boolean> {
  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('transactions', {
      name: 'Transaction Alerts',
      importance: Notifications.AndroidImportance.HIGH,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#FF231F7C',
    });
  }

  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;

  if (existingStatus !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }

  return finalStatus === 'granted';
}

/**
 * Format amount for display
 */
function formatAmount(amount: number): string {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 2,
  }).format(amount);
}

/**
 * Send transaction notification with action buttons
 */
export async function sendTransactionNotification(
  transaction: ParsedTransaction
): Promise<string> {
  const formattedAmount = formatAmount(transaction.amount);
  const transactionType = transaction.type === 'debit' ? '💸 Spent' : '💰 Received';
  
  const title = `${transactionType} ${formattedAmount}`;
  
  let body = '';
  if (transaction.merchant) {
    body += `at ${transaction.merchant}`;
  }
  if (transaction.accountNumber) {
    body += body ? ` • A/C XX${transaction.accountNumber}` : `A/C XX${transaction.accountNumber}`;
  }
  
  const notificationId = await Notifications.scheduleNotificationAsync({
    content: {
      title,
      body: body || 'Transaction detected',
      data: {
        transactionId: transaction.id,
        transaction: JSON.stringify(transaction),
        type: 'bank_transaction',
      },
      categoryIdentifier: 'transaction',
      sound: true,
    },
    trigger: null, // Send immediately
  });

  return notificationId;
}

/**
 * Cancel a notification
 */
export async function cancelNotification(notificationId: string): Promise<void> {
  await Notifications.dismissNotificationAsync(notificationId);
}

/**
 * Setup notification categories with action buttons
 */
export async function setupNotificationCategories(): Promise<void> {
  await Notifications.setNotificationCategoryAsync('transaction', [
    {
      identifier: 'categorize',
      buttonTitle: 'Categorize',
      options: {
        opensAppToForeground: true,
      },
    },
    {
      identifier: 'ignore',
      buttonTitle: 'Ignore',
      options: {
        opensAppToForeground: false,
      },
    },
  ]);
}

/**
 * Add notification response listener
 */
export function addNotificationResponseListener(
  callback: (response: Notifications.NotificationResponse) => void
): Notifications.Subscription {
  return Notifications.addNotificationResponseReceivedListener(callback);
}

/**
 * Remove notification response listener
 */
export function removeNotificationResponseListener(
  subscription: Notifications.Subscription
): void {
  subscription.remove();
}
