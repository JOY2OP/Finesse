// Transaction types and interfaces

export type TransactionType = 'debit' | 'credit';

export interface ParsedTransaction {
  id: string;
  amount: number;
  type: TransactionType;
  merchant?: string;
  accountNumber?: string;
  timestamp: number;
  rawMessage: string;
  date?: string;
  upiRef?: string;
}

export interface SMSMessage {
  _id: string;
  address: string;
  body: string;
  date: number;
  read: number;
}

export interface TransactionNotification {
  transactionId: string;
  transaction: ParsedTransaction;
  notificationId: string;
}
