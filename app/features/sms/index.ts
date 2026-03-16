// Main export file for SMS transaction detection feature

export { deduplicator } from './deduplicator';
export {
  requestNotificationPermissions, sendTransactionNotification,
  setupNotificationCategories
} from './notifications';
export { isBankSMS, parseTransaction, parseTransactions } from './parser';
export {
  hasSMSPermission, readRecentSMS, readSMSMessages, requestSMSPermission
} from './smsReader';
export { transactionManager } from './transactionManager';
export { useSMSTransactions } from './useSMSTransactions';

export type {
  ParsedTransaction, SMSMessage,
  TransactionNotification, TransactionType
} from './types';

