import { Platform } from 'react-native';
import SmsListener from 'react-native-android-sms-listener';
import { SMSMessage } from './types';

/**
 * Real-time SMS listener using react-native-android-sms-listener
 * This actually listens for incoming SMS via BroadcastReceiver
 */

export interface SmsListenerSubscription {
  remove: () => void;
}

/**
 * Start listening for incoming SMS messages in real-time
 * This uses a native BroadcastReceiver, not polling!
 */
export function startRealtimeSMSListener(
  callback: (message: SMSMessage) => void
): SmsListenerSubscription | null {
  if (Platform.OS !== 'android') {
    console.warn('[SMS Listener] Only available on Android');
    return null;
  }

  console.log('[SMS Listener] Starting real-time SMS listener...');

  const subscription = SmsListener.addListener((message: any) => {
    console.log('[SMS Listener] 🔔 NEW SMS RECEIVED:', {
      from: message.originatingAddress,
      body: message.body?.substring(0, 50) + '...',
      timestamp: message.timestamp,
    });

    // Convert to our SMSMessage format
    const smsMessage: SMSMessage = {
      _id: String(message.timestamp || Date.now()),
      address: message.originatingAddress || '',
      body: message.body || '',
      date: message.timestamp || Date.now(),
      read: 0,
    };

    callback(smsMessage);
  });

  console.log('[SMS Listener] ✅ Real-time listener active');

  return {
    remove: () => {
      console.log('[SMS Listener] Stopping real-time listener');
      subscription.remove();
    },
  };
}

/**
 * Check if SMS listener is available
 */
export function isSmsListenerAvailable(): boolean {
  return Platform.OS === 'android' && !!SmsListener;
}
