import { ParsedTransaction } from './types';

const DEDUP_WINDOW = 5000;

class TransactionDeduplicator {
  private recentTransactions: Map<string, number> = new Map();
  private cleanupInterval: ReturnType<typeof setInterval> | null = null;

  private getSignature(transaction: ParsedTransaction): string {
    return `${transaction.amount}-${transaction.type}-${transaction.accountNumber || 'unknown'}`;
  }

  isDuplicate(transaction: ParsedTransaction): boolean {
    // Lazy-start cleanup on first use
    if (!this.cleanupInterval) {
      this.startCleanup();
    }

    const signature = this.getSignature(transaction);
    const now = Date.now();
    const lastSeen = this.recentTransactions.get(signature);

    if (lastSeen && now - lastSeen < DEDUP_WINDOW) {
      return true;
    }

    this.recentTransactions.set(signature, now);
    return false;
  }

  private startCleanup() {
    this.cleanupInterval = setInterval(() => {
      const now = Date.now();
      const cutoff = now - DEDUP_WINDOW;
      for (const [sig, ts] of this.recentTransactions.entries()) {
        if (ts < cutoff) this.recentTransactions.delete(sig);
      }
    }, DEDUP_WINDOW);
  }

  destroy() {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
      this.cleanupInterval = null;
    }
    this.recentTransactions.clear();
  }
}

export const deduplicator = new TransactionDeduplicator();
