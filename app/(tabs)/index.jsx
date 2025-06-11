import ExpenseItem from '@/components/ExpenseItem';
import GradientBackground from '@/components/GradientBackground';
import { initialExpenses } from '@/constants/mockData';
import { colors, fontSizes, spacing } from '@/constants/theme';
import { Search as SearchIcon } from 'lucide-react-native';
import React, { useCallback, useRef, useState } from 'react';
import { FlatList, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import Animated, { FadeIn } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function HomeScreen() {
  const [expenses, setExpenses] = useState(initialExpenses);
  const insets = useSafeAreaInsets();
  const flatListRef = useRef(null);
  
  const handleCategoryChange = useCallback((expenseId, newCategory) => {
    setExpenses(prevExpenses => 
      prevExpenses.map(expense => 
        expense.id === expenseId ? { ...expense, category: newCategory } : expense
      )
    );
  }, []);

  // Calculate total expenses by category
  const expenseTotals = expenses.reduce((acc, expense) => {
    const { category, amount } = expense;
    if (category) {
      acc[category] = (acc[category] || 0) + amount;
    }
    return acc;
  }, {});
  
  // Format currency
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };
  
  return (
    <GradientBackground>
      <View style={[styles.container, { paddingBottom: insets.bottom }]}>
        <Animated.View 
          style={styles.header}
          entering={FadeIn.duration(600)}
        >
          <Text style={styles.logo}>finesse</Text>
          <TouchableOpacity style={styles.searchButton}>
            <SearchIcon size={20} color={colors.text.primary} />
          </TouchableOpacity>
        </Animated.View>
        
        {/* Transactions overview */}
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
        
        <Text style={styles.sectionTitle}>Recent Expenses</Text>
        
        <FlatList
          ref={flatListRef}
          data={expenses}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <ExpenseItem 
              expense={item} 
              onCategoryChange={handleCategoryChange}
            />
          )}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.expensesList}
        />
      </View>
    </GradientBackground>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: spacing.md,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.md,
  },
  logo: {
    fontSize: fontSizes.xl,
    fontWeight: '700',
    color: colors.text.primary,
  },
  searchButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.background.card,
    justifyContent: 'center',
    alignItems: 'center',
  },
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
  sectionTitle: {
    fontSize: fontSizes.md,
    fontWeight: '600',
    color: colors.text.primary,
    marginBottom: spacing.md,
  },
  expensesList: {
    paddingBottom: spacing.xl,
  },
});