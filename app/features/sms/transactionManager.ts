import * as Notifications from 'expo-notifications';
import { TypedStorage } from '../../lib/storage';
import { setupNotificationCategories } from './notifications';
import { ParsedTransaction, TransactionNotification } from './types';

const STORAGE_KEY = 'pending_transactions';

/**
 * Main transaction manager class - Simplified for Native Kotlin Bridge
 * JS-side monitoring and polling removed in favor of native implementation.
 */
class TransactionManager {
  private pendingTransactions: Map<string, TransactionNotification> = new Map();
  private loaded = false;

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
      return true;
    } catch (error) {
      console.error('Error initializing transaction manager:', error);
      return false;
    }
  }

  /**
   * Request native permissions
   */
  async requestPermissions(): Promise<boolean> {
    const { status } = await Notifications.requestPermissionsAsync();
    return status === 'granted';
  }

  /**
   * Check if permissions are granted
   */
  async hasPermissions(): Promise<boolean> {
    const { status } = await Notifications.getPermissionsAsync();
    return status === 'granted';
  }

  /**
   * Start monitoring (Stubbed - Native Kotlin handles this now)
   */
  async startMonitoring(): Promise<boolean> {
    console.log('[TM] Native Kotlin monitoring is active.');
    return true;
  }

  /**
   * Stop monitoring (Stubbed)
   */
  stopMonitoring(): void {
    console.log('[TM] Monitoring is managed by native OS.');
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
    // No-op - Native handles lifecycle
  }
}

// Singleton instance
export const transactionManager = new TransactionManager();
