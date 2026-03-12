import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import TransactionItem from './TransactionItem';

interface Transaction {
  id: string;
  description: string;
  category: string;
  subcategory?: string;
  amount: number;
  date: string;
  time?: string;
}

interface TransactionGroupProps {
  title: string;
  date: string;
  transactions: Transaction[];
  totalAmount: number;
  onCategoryChange: (id: string, category: string, subcategory?: string) => void;
  onEditTransaction: (transaction: Transaction) => void;
}

export default function TransactionGroup({ 
  title, 
  date, 
  transactions, 
  totalAmount,
  onCategoryChange,
  onEditTransaction,
}: TransactionGroupProps) {
  const formatCurrency = (amount: number) => {
    return '₹' + amount.toLocaleString('en-IN', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    });
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>{title}</Text>
        <View style={styles.headerRight}>
          <Text style={styles.itemCount}>{transactions.length} ITEM{transactions.length !== 1 ? 'S' : ''}</Text>
          <Text style={styles.totalAmount}>{formatCurrency(totalAmount)}</Text>
        </View>
      </View>
      
      <View style={styles.transactionsList}>
        {transactions.map((transaction, index) => (
          <TransactionItem
            key={transaction.id}
            transaction={transaction}
            isLast={index === transactions.length - 1}
            onCategoryChange={onCategoryChange}
            onEditTransaction={onEditTransaction}
          />
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    overflow: 'hidden',
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#F8FAFC',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  title: {
    fontSize: 12,
    fontWeight: '700',
    color: '#0F172A',
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  itemCount: {
    fontSize: 10,
    fontWeight: '500',
    color: '#94A3B8',
    textTransform: 'uppercase',
  },
  totalAmount: {
    fontSize: 12,
    fontWeight: '700',
    color: '#0F172A',
  },
  transactionsList: {
    backgroundColor: '#FFFFFF',
  },
});
