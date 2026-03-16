import * as Notifications from 'expo-notifications';
import { useCallback, useEffect, useRef, useState } from 'react';
import { AppState, AppStateStatus, Platform } from 'react-native';
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

      // Listen for notification responses (Categorize tap)
      notifSubscription = Notifications.addNotificationResponseReceivedListener((response) => {
        const { actionIdentifier, notification } = response;
        const data = notification.request.content.data;

        if (data?.type !== 'bank_transaction') return;

        if (actionIdentifier === 'categorize') {
          const transaction = JSON.parse(data.transaction as string) as ParsedTransaction;
          setPendingTransaction(transaction);
          setShowCategorizationModal(true);
        } else if (actionIdentifier === 'ignore') {
          transactionManager.removePendingTransaction(data.transactionId as string);
        }
      });
    };

    init();

    // Re-scan when app comes to foreground
    const subscription = AppState.addEventListener('change', (nextState: AppStateStatus) => {
      if (appState.current.match(/inactive|background/) && nextState === 'active') {
        transactionManager.startMonitoring();
      }
      appState.current = nextState;
    });

    return () => {
      subscription.remove();
      notifSubscription?.remove();
      transactionManager.stopMonitoring();
    };
  }, []);

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
