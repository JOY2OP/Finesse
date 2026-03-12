import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import Animated, { FadeIn } from 'react-native-reanimated';

interface TransactionSummaryProps {
  expenseTotals: {
    needs?: number;
    wants?: number;
    investing?: number;
  };
}

export default function TransactionSummary({ expenseTotals }: TransactionSummaryProps) {
  const formatCurrency = (amount: number) => {
    return '₹' + amount.toLocaleString('en-IN', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    });
  };

  const totalSpend = (expenseTotals.needs || 0) + (expenseTotals.wants || 0) + (expenseTotals.investing || 0);

  return (
    <Animated.View 
      style={styles.summaryContainer}
      entering={FadeIn.duration(800).delay(200)}
    >
      <View style={styles.backgroundIcon}>
        <Text style={styles.backgroundIconText}>📊</Text>
      </View>
      
      <View style={styles.contentContainer}>
        <Text style={styles.label}>TOTAL SPEND SUMMARY</Text>
        <Text style={styles.totalAmount}>{formatCurrency(totalSpend)}</Text>
        
        <View style={styles.changeRow}>
          <View style={styles.changeBadge}>
            <Text style={styles.changeIcon}>↗</Text>
            <Text style={styles.changeText}>12%</Text>
          </View>
          <Text style={styles.changeLabel}>vs last month</Text>
        </View>

        <TouchableOpacity style={styles.insightsButton}>
          <Text style={styles.insightsButtonText}>View Deep Insights</Text>
        </TouchableOpacity>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  summaryContainer: {
    position: 'relative',
    backgroundColor: '#2B6CEE',
    borderRadius: 30,
    padding: 24,
    marginBottom: 16,
    marginHorizontal: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
  },
  backgroundIcon: {
    position: 'absolute',
    top: 16,
    right: 16,
    opacity: 0.2,
  },
  backgroundIconText: {
    fontSize: 80,
    transform: [{ scale: 1.5 }],
    opacity:0.4,
  },
  contentContainer: {
    position: 'relative',
    zIndex: 10,
  },
  label: {
    fontSize: 12,
    fontWeight: '500',
    color: 'rgba(255, 255, 255, 0.8)',
    letterSpacing: 1.2,
    marginBottom: 4,
  },
  totalAmount: {
    fontSize: 32,
    fontWeight: '700',
    color: '#FFFFFF',
    marginTop: 4,
  },
  changeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 8,
  },
  changeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
    gap: 2,
  },
  changeIcon: {
    fontSize: 12,
    color: '#FFFFFF',
    fontWeight: '700',
  },
  changeText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  changeLabel: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.7)',
  },
  insightsButton: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    paddingVertical: 10,
    alignItems: 'center',
    marginTop: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  insightsButtonText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#2B6CEE',
  },
});
