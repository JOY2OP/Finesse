import { ParsedTransaction, SMSMessage, TransactionType } from './types';

// Bank SMS patterns for Indian banks
const BANK_PATTERNS = {
  // Amount patterns - handles Rs., INR, with/without commas
  amount: /(?:Rs\.?|INR)\s*([\d,]+\.?\d*)/i,
  
  // Transaction type patterns
  debit: /(?:debited|paid|debit|spent|withdrawn|purchase)/i,
  credit: /(?:credited|credit|received|deposited)/i,
  
  // Account number pattern - last 4 digits
  account: /(?:A\/C|account|a\/c)[\s:]*(?:XX)?(\d{4})/i,
  
  // Merchant/payee pattern
  merchant: /(?:to|at|from)\s+([A-Za-z0-9\s&.-]+?)(?:\s*,|\s*UPI|\s*on|\s*\.|$)/i,
  
  // UPI reference
  upiRef: /UPI\s*Ref[:\s]*(\d+)/i,
  
  // Date pattern (DD-MM-YY or DD/MM/YYYY)
  date: /(?:on\s+)?(\d{1,2}[-/]\d{1,2}[-/]\d{2,4})/i,
};

// Known bank sender patterns
// const BANK_SENDERS = [
//   /HDFC/i,
//   /ICICI/i,
//   /SBI/i,
//   /AXIS/i,
//   /KOTAK/i,
//   /CANARA/i,
//   /PNB/i,
//   /BOB/i,
//   /UNION/i,
//   /IDBI/i,
//   /YES\s*BANK/i,
//   /INDUSIND/i,
//   /PAYTM/i,
//   /PHONEPE/i,
//   /GPAY/i,
//   /\d{6}/i, // 6-digit bank codes
// ];

/**
 * Check if SMS is from a bank
 */
export function isBankSMS(message: SMSMessage): boolean {
  const body = message.body.toUpperCase();

  // BANK_SENDERS check disabled for testing — accepting messages from any sender
  // const sender = message.address.toUpperCase();
  // const isBankSender = BANK_SENDERS.some(pattern => pattern.test(sender));

  // Check if message contains transaction keywords
  const hasTransactionKeywords =
    (BANK_PATTERNS.debit.test(body) || BANK_PATTERNS.credit.test(body)) &&
    BANK_PATTERNS.amount.test(body);

  return hasTransactionKeywords;
}

/**
 * Parse amount from SMS, handling commas
 */
function parseAmount(text: string): number | null {
  const match = text.match(BANK_PATTERNS.amount);
  if (!match) return null;
  
  // Remove commas and parse
  const amountStr = match[1].replace(/,/g, '');
  const amount = parseFloat(amountStr);
  
  return isNaN(amount) ? null : amount;
}

/**
 * Determine transaction type
 */
function getTransactionType(text: string): TransactionType | null {
  if (BANK_PATTERNS.debit.test(text)) return 'debit';
  if (BANK_PATTERNS.credit.test(text)) return 'credit';
  return null;
}

/**
 * Extract merchant name
 */
function extractMerchant(text: string): string | undefined {
  const match = text.match(BANK_PATTERNS.merchant);
  if (!match) return undefined;
  
  // Clean up merchant name
  return match[1].trim().replace(/\s+/g, ' ');
}

/**
 * Extract account number (last 4 digits)
 */
function extractAccountNumber(text: string): string | undefined {
  const match = text.match(BANK_PATTERNS.account);
  return match ? match[1] : undefined;
}

/**
 * Extract UPI reference
 */
function extractUpiRef(text: string): string | undefined {
  const match = text.match(BANK_PATTERNS.upiRef);
  return match ? match[1] : undefined;
}

/**
 * Normalize date string to YYYY-MM-DD
 * Handles: DD-MM-YY, DD-MM-YYYY, DD/MM/YY, DD/MM/YYYY
 */
function normalizeDate(raw: string): string {
  const parts = raw.split(/[-/]/);
  if (parts.length !== 3) return raw;

  let [day, month, year] = parts.map(Number);

  // If year is 2 digits, assume 2000s
  if (year < 100) year += 2000;

  return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
}

/**
 * Extract and normalize date from SMS to YYYY-MM-DD
 */
function extractDate(text: string): string | undefined {
  const match = text.match(BANK_PATTERNS.date);
  if (!match) return undefined;
  return normalizeDate(match[1]);
}

/**
 * Generate unique transaction ID
 */
function generateTransactionId(transaction: Partial<ParsedTransaction>): string {
  const parts = [
    transaction.amount,
    transaction.type,
    transaction.accountNumber,
    transaction.timestamp,
  ].filter(Boolean);
  
  return parts.join('-');
}

/**
 * Parse bank SMS into transaction object
 */
export function parseTransaction(message: SMSMessage): ParsedTransaction | null {
  const body = message.body;
  
  // Extract amount
  const amount = parseAmount(body);
  if (!amount) return null;
  
  // Extract transaction type
  const type = getTransactionType(body);
  if (!type) return null;
  
  // Build transaction object
  const transaction: Partial<ParsedTransaction> = {
    amount,
    type,
    merchant: extractMerchant(body),
    accountNumber: extractAccountNumber(body),
    timestamp: message.date,
    rawMessage: body,
    date: extractDate(body),
    upiRef: extractUpiRef(body),
  };
  
  // Generate ID
  const id = generateTransactionId(transaction);
  
  return {
    ...transaction,
    id,
  } as ParsedTransaction;
}

/**
 * Parse multiple SMS messages
 */
export function parseTransactions(messages: SMSMessage[]): ParsedTransaction[] {
  return messages
    .filter(isBankSMS)
    .map(parseTransaction)
    .filter((t): t is ParsedTransaction => t !== null);
}
