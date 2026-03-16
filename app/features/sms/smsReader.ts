import { PermissionsAndroid, Platform } from 'react-native';
import SmsAndroid from 'react-native-get-sms-android';
import { SMSMessage } from './types';

export async function requestSMSPermission(): Promise<boolean> {
  if (Platform.OS !== 'android') return false;

  try {
    const granted = await PermissionsAndroid.request(
      PermissionsAndroid.PERMISSIONS.READ_SMS,
      {
        title: 'SMS Permission',
        message: 'This app needs SMS access to detect bank transactions automatically.',
        buttonNeutral: 'Ask Me Later',
        buttonNegative: 'Cancel',
        buttonPositive: 'OK',
      }
    );
    const result = granted === PermissionsAndroid.RESULTS.GRANTED;
    console.log('[SMS] Permission request result:', result);
    return result;
  } catch (error) {
    console.error('[SMS] Error requesting permission:', error);
    return false;
  }
}

export async function hasSMSPermission(): Promise<boolean> {
  if (Platform.OS !== 'android') return false;
  try {
    const granted = await PermissionsAndroid.check(PermissionsAndroid.PERMISSIONS.READ_SMS);
    console.log('[SMS] Has permission:', granted);
    return granted;
  } catch (error) {
    console.error('[SMS] Error checking permission:', error);
    return false;
  }
}

export async function readSMSMessages(
  maxCount: number = 100,
  minDate?: number
): Promise<SMSMessage[]> {
  if (Platform.OS !== 'android') return [];

  const hasPermission = await hasSMSPermission();
  if (!hasPermission) {
    console.error('[SMS] Permission not granted — cannot read SMS');
    throw new Error('SMS permission not granted');
  }

  return new Promise((resolve, reject) => {
    const filter: Record<string, unknown> = { box: 'inbox', maxCount };
    if (minDate) filter.minDate = minDate;

    console.log('[SMS] Reading messages with filter:', JSON.stringify(filter));

    SmsAndroid.list(
      JSON.stringify(filter),
      (fail: string) => {
        console.error('[SMS] SmsAndroid.list failed:', fail);
        reject(new Error(fail));
      },
      (count: number, smsList: string) => {
        console.log('[SMS] Got', count, 'messages');
        try {
          const messages: SMSMessage[] = JSON.parse(smsList);
          resolve(messages);
        } catch (error) {
          console.error('[SMS] Error parsing SMS list:', error);
          reject(error);
        }
      }
    );
  });
}

export async function readRecentSMS(): Promise<SMSMessage[]> {
  const oneDayAgo = Date.now() - 24 * 60 * 60 * 1000;
  return readSMSMessages(100, oneDayAgo);
}

export function startSMSMonitoring(
  callback: (messages: SMSMessage[]) => void,
  intervalMs: number = 30000
): ReturnType<typeof setInterval> {
  // Track last check time — start from now so we only catch NEW messages
  let lastCheckTime = Date.now();

  console.log('[SMS] Monitoring started, polling every', intervalMs / 1000, 'seconds');

  const interval = setInterval(async () => {
    try {
      console.log('[SMS] Polling for new messages since', new Date(lastCheckTime).toISOString());
      const messages = await readSMSMessages(20, lastCheckTime);
      console.log('[SMS] Poll found', messages.length, 'new messages');
      lastCheckTime = Date.now();
      if (messages.length > 0) {
        callback(messages);
      }
    } catch (error) {
      console.error('[SMS] Polling error:', error);
    }
  }, intervalMs);

  return interval;
}

export function stopSMSMonitoring(interval: ReturnType<typeof setInterval>): void {
  clearInterval(interval);
  console.log('[SMS] Monitoring stopped');
}
