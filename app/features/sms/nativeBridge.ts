import { NativeModules, Platform } from 'react-native';

interface PendingTransaction {
  amount: number;
  type: 'debit' | 'credit';
  merchant: string;
  accountNumber: string;
  rawMessage: string;
  timestamp: number;
  notificationId: number;
}

interface TransactionModuleInterface {
  getPendingTransaction(): Promise<PendingTransaction | null>;
  clearPendingTransaction(): Promise<boolean>;
}

const { TransactionModule } = NativeModules;

/**
 * Native bridge to communicate with Android TransactionModule
 */
export const NativeTransactionBridge = {
  /**
   * Check if the native module is available
   */
  isAvailable(): boolean {
    return Platform.OS === 'android' && !!TransactionModule;
  },

  /**
   * Get pending transaction from native intent
   * Returns null if no pending transaction
   */
  async getPendingTransaction(): Promise<PendingTransaction | null> {
    if (!this.isAvailable()) {
      console.warn('[NativeBridge] TransactionModule not available');
      return null;
    }

    try {
      const transaction = await TransactionModule.getPendingTransaction();
      
      if (transaction) {
        console.log('[NativeBridge] ✅ Got pending transaction:', {
          amount: transaction.amount,
          type: transaction.type,
          merchant: transaction.merchant,
        });
      } else {
        console.log('[NativeBridge] No pending transaction');
      }
      
      return transaction;
    } catch (error) {
      console.error('[NativeBridge] Error getting pending transaction:', error);
      return null;
    }
  },

  /**
   * Clear pending transaction
   */
  async clearPendingTransaction(): Promise<boolean> {
    if (!this.isAvailable()) {
      return false;
    }

    try {
      await TransactionModule.clearPendingTransaction();
      console.log('[NativeBridge] Pending transaction cleared');
      return true;
    } catch (error) {
      console.error('[NativeBridge] Error clearing pending transaction:', error);
      return false;
    }
  },
};
