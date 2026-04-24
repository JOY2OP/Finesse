import * as Notifications from 'expo-notifications';
import { useCallback, useEffect, useRef, useState } from 'react';
import { AppState, AppStateStatus, Platform } from 'react-native';
import { NativeTransactionBridge } from './nativeBridge';
import { transactionManager } from './transactionManager';
import { ParsedTransaction } from './types';

export interface SMSTransactionState {
  isMonitoring: boolean;
  hasPermission: boolean | null;
  pendingTransaction: ParsedTransaction | null;
  showCategorizationModal: boolean;
  requestPermissions: () => Promise<void>;
  dismissCategorization: () => void;
  confirmCategorization: (transactionId: string, category: string) => Promise<void>;
}

/**
 * useSMSTransactions - React hook that integrates with the Native Kotlin Bridge.
 * This version ONLY listens to the Native Bridge and does NOT poll SMS via JS.
 */
export function useSMSTransactions(): SMSTransactionState {
  const [isMonitoring, setIsMonitoring] = useState(true);
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [pendingTransaction, setPendingTransaction] = useState<ParsedTransaction | null>(null);
  const [showCategorizationModal, setShowCategorizationModal] = useState(false);
  const appState = useRef(AppState.currentState);

  /**
   * Check for pending transaction from native bridge
   */
  const checkNativePendingTransaction = useCallback(async () => {
    if (!NativeTransactionBridge.isAvailable()) {
      return;
    }

    try {
      const nativeTransaction = await NativeTransactionBridge.getPendingTransaction();
      
      if (nativeTransaction) {
        console.log('[useSMSTransactions] 🔔 Native transaction received:', nativeTransaction);
        
        // Convert native transaction to ParsedTransaction format
        const transaction: ParsedTransaction = {
          id: `native-${nativeTransaction.timestamp}`,
          amount: nativeTransaction.amount,
          type: nativeTransaction.type,
          merchant: nativeTransaction.merchant || undefined,
          accountNumber: nativeTransaction.accountNumber || undefined,
          timestamp: nativeTransaction.timestamp,
          rawMessage: nativeTransaction.rawMessage,
          date: new Date(nativeTransaction.timestamp).toISOString().split('T')[0],
        };
        
        setPendingTransaction(transaction);
        setShowCategorizationModal(true);
        
        // Clear the native transaction
        await NativeTransactionBridge.clearPendingTransaction();
      }
    } catch (error) {
      console.error('[useSMSTransactions] Error checking native transaction:', error);
    }
  }, []);

  // Initialize on mount
  useEffect(() => {
    if (Platform.OS !== 'android') return;

    let notifSubscription: Notifications.Subscription;

    const init = async () => {
      await transactionManager.initialize();
      const permission = await transactionManager.hasPermissions();
      setHasPermission(permission);

      // Check for pending transaction from native bridge on mount (if app was opened via notification)
      await checkNativePendingTransaction();

      // Listen for notification responses (specifically for any JS fallback, though Kotlin uses Intents)
      notifSubscription = Notifications.addNotificationResponseReceivedListener(async (response) => {
        const { actionIdentifier, notification } = response;
        const data = notification.request.content.data;

        console.log('[useSMSTransactions] Notification response action:', actionIdentifier);

        // Always check the native bridge when a notification is interacted with
        await checkNativePendingTransaction();

        // Support for test button / JS-triggered notifications
        if (data?.type === 'bank_transaction' && actionIdentifier === 'categorize') {
          const transaction = JSON.parse(data.transaction as string) as ParsedTransaction;
          setPendingTransaction(transaction);
          setShowCategorizationModal(true);
        }
      });
    };

    init();

    // Check native bridge whenever app comes to foreground
    const subscription = AppState.addEventListener('change', async (nextState: AppStateStatus) => {
      if (appState.current.match(/inactive|background/) && nextState === 'active') {
        console.log('[useSMSTransactions] App foregrounded, checking bridge...');
        await checkNativePendingTransaction();
      }
      appState.current = nextState;
    });

    return () => {
      subscription.remove();
      notifSubscription?.remove();
    };
  }, [checkNativePendingTransaction]);

  const requestPermissions = useCallback(async () => {
    const granted = await transactionManager.requestPermissions();
    setHasPermission(granted);
  }, []);

  const dismissCategorization = useCallback(() => {
    setShowCategorizationModal(false);
    setPendingTransaction(null);
  }, []);

  const confirmCategorization = useCallback(async (transactionId: string, _category: string) => {
    await transactionManager.removePendingTransaction(transactionId);
    setShowCategorizationModal(false);
    setPendingTransaction(null);
  }, []);

  return {
    isMonitoring,
    hasPermission,
    pendingTransaction,
    showCategorizationModal,
    requestPermissions,
    dismissCategorization,
    confirmCategorization,
  };
}
