import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

interface Transaction {
  id: string;
  description: string;
  category: string;
  subcategory?: string;
  amount: number;
  date: string;
  time?: string;
  created_at?: string;
}

interface TransactionItemProps {
  transaction: Transaction;
  isLast: boolean;
  onCategoryChange: (id: string, category: string, subcategory?: string) => void;
  onEditTransaction: (transaction: Transaction) => void;
}

export default function TransactionItem({ transaction, isLast, onCategoryChange, onEditTransaction }: TransactionItemProps) {

  const getCategoryConfig = (category: string) => {
    switch (category) {
      case 'needs':
        return { 
          color: '#2563EB', 
          bg: '#DBEAFE', 
          icon: '🛒',
          label: 'Needs'
        };
      case 'wants':
        return { 
          color: '#10B981', 
          bg: '#D1FAE5', 
          icon: '🛍️',
          label: 'Wants'
        };
      case 'investing':
        return { 
          color: '#9333EA', 
          bg: '#F3E8FF', 
          icon: '📈',
          label: 'Investing'
        };
      default:
        return { 
          color: '#64748B', 
          bg: '#F1F5F9', 
          icon: '📊',
          label: 'Categorize'
        };
    }
  };

  const getSubcategoryLabel = () => {
    if (!transaction.subcategory) {
      return transaction.description.split(' ')[0];
    }
    return transaction.subcategory.replace(/_/g, ' ');
  };

  const getTimeFromDate = () => {
    if (transaction.time) return transaction.time;
    if (transaction.created_at) {
      const date = new Date(transaction.created_at);
      return date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
    }
    return '12:00 PM';
  };

  const config = getCategoryConfig(transaction.category);

  const formatCurrency = (amount: number) => {
    return '₹' + amount.toLocaleString('en-IN', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    });
  };

  return (
    <View style={[styles.container, !isLast && styles.borderBottom]}>
      <View style={[styles.iconContainer, { backgroundColor: config.bg }]}>
        <Text style={styles.icon}>{config.icon}</Text>
      </View>
      
      <View style={styles.infoContainer}>
        <Text style={styles.description}>{transaction.description}</Text>
        <Text style={styles.subcategory}>
          {getSubcategoryLabel()} • {getTimeFromDate()}
        </Text>
      </View>
      
      <View style={styles.rightContainer}>
        <Text style={styles.amount}>-{formatCurrency(transaction.amount)}</Text>
        <TouchableOpacity 
          style={[styles.categoryButton, { backgroundColor: config.bg }]}
          onPress={() => onEditTransaction(transaction)}
        >
          <Text style={[styles.categoryText, { color: config.color }]}>
            {config.label.toUpperCase()}
          </Text>
          <Text style={[styles.chevron, { color: config.color }]}>▼</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 16,
    gap: 16,
  },
  borderBottom: {
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  iconContainer: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  icon: {
    fontSize: 20,
  },
  infoContainer: {
    flex: 1,
  },
  description: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0F172A',
    marginBottom: 2,
  },
  subcategory: {
    fontSize: 11,
    color: '#64748B',
  },
  rightContainer: {
    alignItems: 'flex-end',
    gap: 4,
  },
  amount: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0F172A',
    marginBottom: 4,
  },
  categoryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
    gap: 4,
  },
  categoryText: {
    fontSize: 9,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  chevron: {
    fontSize: 10,
  },
});
