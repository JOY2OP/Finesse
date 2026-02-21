import { colors, fontSizes, spacing } from '@/constants/theme';
import { StyleSheet, Text, View } from 'react-native';
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
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  return (
    <Animated.View 
      style={styles.summaryContainer}
      entering={FadeIn.duration(800).delay(200)}
    >
      <View style={styles.categoryTotals}>
        <View style={styles.categoryTotal}>
          <Text style={styles.categoryTotalLabel}>Needs</Text>
          <Text style={[styles.categoryTotalAmount, { color: colors.category.needs }]}>
            {formatCurrency(expenseTotals.needs || 0)}
          </Text>
        </View>
        
        <View style={styles.categoryTotal}>
          <Text style={styles.categoryTotalLabel}>Wants</Text>
          <Text style={[styles.categoryTotalAmount, { color: colors.category.wants }]}>
            {formatCurrency(expenseTotals.wants || 0)}
          </Text>
        </View>
        
        <View style={styles.categoryTotal}>
          <Text style={styles.categoryTotalLabel}>Investing</Text>
          <Text style={[styles.categoryTotalAmount, { color: colors.category.investing }]}>
            {formatCurrency(expenseTotals.investing || 0)}
          </Text>
        </View>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  summaryContainer: {
    backgroundColor: colors.background.card,
    borderRadius: 16,
    padding: spacing.md,
    marginBottom: spacing.lg,
  },
  categoryTotals: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  categoryTotal: {
    alignItems: 'center',
  },
  categoryTotalLabel: {
    fontSize: fontSizes.xs,
    color: colors.text.secondary,
    marginBottom: spacing.xs,
  },
  categoryTotalAmount: {
    fontSize: fontSizes.lg,
    fontWeight: '700',
  },
});
