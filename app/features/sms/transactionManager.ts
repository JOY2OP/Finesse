import * as Notifications from 'expo-notifications';
import { TypedStorage } from '../../lib/storage';
import { deduplicator } from './deduplicator';
import {
  addNotificationResponseListener,
  removeNotificationResponseListener,
  requestNotificationPermissions,
  sendTransactionNotification,
  setupNotificationCategories
} from './notifications';
import { parseTransactions } from './parser';
import {
  hasSMSPermission,
  requestSMSPermission,
  startSMSMonitoring,
  stopSMSMonitoring
} from './smsReader';
import { ParsedTransaction, SMSMessage, TransactionNotification } from './types';

const STORAGE_KEY = 'pending_transactions';

/**
 * Main transaction manager class
 */
class TransactionManager {
  private monitoringInterval: ReturnType<typeof setInterval> | null = null;
  private notificationListener: Notifications.Subscription | null = null;
  private pendingTransactions: Map<string, TransactionNotification> = new Map();
  private loaded = false;

  // No constructor side-effects — everything is lazy

  /**
   * Initialize the transaction manager
   */
  async initialize(): Promise<boolean> {
    try {
      // Load persisted pending transactions (lazy, first time only)
      if (!this.loaded) {
        await this.loadPendingTransactions();
        this.loaded = true;
      }

      await setupNotificationCategories();

      const notifPermission = await requestNotificationPermissions();
      if (!notifPermission) {
        console.warn('Notification permission not granted');
        return false;
      }

      this.setupNotificationListener();
      return true;
    } catch (error) {
      console.error('Error initializing transaction manager:', error);
      return false;
    }
  }

  /**
   * Request SMS permission
   */
  async requestPermissions(): Promise<boolean> {
    return await requestSMSPermission();
  }

  /**
   * Check if SMS permission is granted
   */
  async hasPermissions(): Promise<boolean> {
    return await hasSMSPermission();
  }

  private async processMessages(messages: SMSMessage[]): Promise<void> {
    console.log('[TM] Processing', messages.length, 'messages');
    const transactions = parseTransactions(messages);
    console.log('[TM] Parsed', transactions.length, 'transactions from messages');
    for (const transaction of transactions) {
      await this.processTransaction(transaction);
    }
  }

  private async processTransaction(transaction: ParsedTransaction): Promise<void> {
    console.log('[TM] Checking transaction:', transaction.id, transaction.amount, transaction.type);
    if (deduplicator.isDuplicate(transaction)) {
      console.log('[TM] Duplicate, skipping:', transaction.id);
      return;
    }

    try {
      const notificationId = await sendTransactionNotification(transaction);
      const pending: TransactionNotification = {
        transactionId: transaction.id,
        transaction,
        notificationId,
      };
      this.pendingTransactions.set(transaction.id, pending);
      await this.savePendingTransactions();
      console.log('[TM] Notification sent for:', transaction.id);
    } catch (error) {
      console.error('[TM] Error sending notification:', error);
    }
  }

  async startMonitoring(intervalMs: number = 15000): Promise<boolean> {
    const hasPermission = await this.hasPermissions();
    if (!hasPermission) {
      console.warn('[TM] SMS permission not granted, cannot start monitoring');
      return false;
    }

    if (this.monitoringInterval) {
      console.log('[TM] Monitoring already running');
      return true;
    }

    // Initial scan of last 24h to catch anything already in inbox
    console.log('[TM] Running initial SMS scan...');
    try {
      const { readRecentSMS } = await import('./smsReader');
      const initial = await readRecentSMS();
      console.log('[TM] Initial scan found', initial.length, 'messages');
      await this.processMessages(initial);
    } catch (e) {
      console.error('[TM] Initial scan error:', e);
    }

    // Poll for new messages — pass them directly to processMessages
    this.monitoringInterval = startSMSMonitoring(
      async (newMessages) => {
        console.log('[TM] Poll callback received', newMessages.length, 'new messages');
        await this.processMessages(newMessages);
      },
      intervalMs
    );

    console.log('[TM] Monitoring started, interval:', intervalMs, 'ms');
    return true;
  }

  /**
   * Stop monitoring SMS
   */
  stopMonitoring(): void {
    if (this.monitoringInterval) {
      stopSMSMonitoring(this.monitoringInterval);
      this.monitoringInterval = null;
      console.log('SMS monitoring stopped');
    }
  }

  /**
   * Setup notification response listener
   */
  private setupNotificationListener(): void {
    // Don't register twice
    if (this.notificationListener) return;

    this.notificationListener = addNotificationResponseListener((response) => {
      const { actionIdentifier, notification } = response;
      const data = notification.request.content.data;

      if (data.type !== 'bank_transaction') return;

      const transactionId = data.transactionId as string;

      if (actionIdentifier === 'categorize') {
        // Handle categorize action
        this.handleCategorizeAction(transactionId);
      } else if (actionIdentifier === 'ignore') {
        // Handle ignore action
        this.handleIgnoreAction(transactionId);
      }
    });
  }

  /**
   * Handle categorize action
   */
  private handleCategorizeAction(transactionId: string): void {
    const pending = this.pendingTransactions.get(transactionId);
    if (!pending) return;

    // Emit event or navigate to categorization modal
    // This should be handled by the app's navigation system
    console.log('Categorize transaction:', transactionId);
    
    // For now, just log - the app should listen to this event
    // and open the categorization modal
  }

  /**
   * Handle ignore action
   */
  private async handleIgnoreAction(transactionId: string): Promise<void> {
    const pending = this.pendingTransactions.get(transactionId);
    if (!pending) return;

    // Remove from pending
    this.pendingTransactions.delete(transactionId);
    await this.savePendingTransactions();

    console.log('Transaction ignored:', transactionId);
  }

  /**
   * Get pending transaction by ID
   */
  getPendingTransaction(transactionId: string): TransactionNotification | undefined {
    return this.pendingTransactions.get(transactionId);
  }

  /**
   * Get all pending transactions
   */
  getAllPendingTransactions(): TransactionNotification[] {
    return Array.from(this.pendingTransactions.values());
  }

  /**
   * Remove pending transaction
   */
  async removePendingTransaction(transactionId: string): Promise<void> {
    this.pendingTransactions.delete(transactionId);
    await this.savePendingTransactions();
  }

  /**
   * Load pending transactions from storage
   */
  private async loadPendingTransactions(): Promise<void> {
    try {
      const data = await TypedStorage.getObject<Record<string, TransactionNotification>>(STORAGE_KEY);
      if (data) {
        this.pendingTransactions = new Map(Object.entries(data));
      }
    } catch (error) {
      console.error('Error loading pending transactions:', error);
    }
  }

  /**
   * Save pending transactions to storage
   */
  private async savePendingTransactions(): Promise<void> {
    try {
      const data = Object.fromEntries(this.pendingTransactions);
      await TypedStorage.setObject(STORAGE_KEY, data);
    } catch (error) {
      console.error('Error saving pending transactions:', error);
    }
  }

  /**
   * Cleanup resources
   */
  destroy(): void {
    this.stopMonitoring();
    
    if (this.notificationListener) {
      removeNotificationResponseListener(this.notificationListener);
      this.notificationListener = null;
    }
    
    deduplicator.destroy();
  }
}

// Singleton instance
export const transactionManager = new TransactionManager();
