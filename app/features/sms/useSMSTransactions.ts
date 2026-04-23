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

export function useSMSTransactions(): SMSTransactionState {
  const [isMonitoring, setIsMonitoring] = useState(false);
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [pendingTransaction, setPendingTransaction] = useState<ParsedTransaction | null>(null);
  const [showCategorizationModal, setShowCategorizationModal] = useState(false);
  const appState = useRef(AppState.currentState);

  /**
   * Check for pending transaction from native bridge
   */
  const checkNativePendingTransaction = useCallback(async () => {
    console.log('[useSMSTransactions] Checking native bridge availability...');
    console.log('[useSMSTransactions] NativeModules:', Object.keys(require('react-native').NativeModules));
    console.log('[useSMSTransactions] TransactionModule exists?', !!require('react-native').NativeModules.TransactionModule);
    
    if (!NativeTransactionBridge.isAvailable()) {
      console.log('[useSMSTransactions] ❌ Native bridge not available');
      console.log('[useSMSTransactions] Platform:', require('react-native').Platform.OS);
      return;
    }

    console.log('[useSMSTransactions] ✅ Native bridge available, getting pending transaction...');

    try {
      const nativeTransaction = await NativeTransactionBridge.getPendingTransaction();
      
      console.log('[useSMSTransactions] Native bridge response:', nativeTransaction);
      
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
      } else {
        console.log('[useSMSTransactions] No pending transaction from native bridge');
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
      const initialized = await transactionManager.initialize();
      if (!initialized) return;

      const permission = await transactionManager.hasPermissions();
      setHasPermission(permission);

      if (permission) {
        const started = await transactionManager.startMonitoring();
        setIsMonitoring(started);
      }

      // Check for pending transaction from native bridge on mount
      await checkNativePendingTransaction();

      // Listen for notification responses (Categorize tap)
      notifSubscription = Notifications.addNotificationResponseReceivedListener(async (response) => {
        const { actionIdentifier, notification } = response;
        const data = notification.request.content.data;

        console.log('[useSMSTransactions] Notification response:', actionIdentifier, data?.type);

        // Check native bridge first (for Kotlin notifications)
        await checkNativePendingTransaction();

        // Then check JS notification data (for test button)
        if (data?.type === 'bank_transaction' && actionIdentifier === 'categorize') {
          const transaction = JSON.parse(data.transaction as string) as ParsedTransaction;
          setPendingTransaction(transaction);
          setShowCategorizationModal(true);
        } else if (data?.type === 'bank_transaction' && actionIdentifier === 'ignore') {
          transactionManager.removePendingTransaction(data.transactionId as string);
        }
      });
    };

    init();

    // Re-scan when app comes to foreground + check native bridge
    const subscription = AppState.addEventListener('change', async (nextState: AppStateStatus) => {
      if (appState.current.match(/inactive|background/) && nextState === 'active') {
        console.log('[useSMSTransactions] App came to foreground, checking for pending transactions...');
        
        // Check native bridge first (higher priority)
        await checkNativePendingTransaction();
        
        // Then start monitoring for new SMS
        transactionManager.startMonitoring();
      }
      appState.current = nextState;
    });

    return () => {
      subscription.remove();
      notifSubscription?.remove();
      transactionManager.stopMonitoring();
    };
  }, [checkNativePendingTransaction]);

  const requestPermissions = useCallback(async () => {
    const granted = await transactionManager.requestPermissions();
    setHasPermission(granted);

    if (granted) {
      const started = await transactionManager.startMonitoring();
      setIsMonitoring(started);
    }
  }, []);

  const dismissCategorization = useCallback(() => {
    setShowCategorizationModal(false);
    setPendingTransaction(null);
  }, []);

  const confirmCategorization = useCallback(async (transactionId: string, _category: string) => {
    // TODO: persist category to your backend/storage here
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
