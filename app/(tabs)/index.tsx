import ExpenseItem from '@/components/ExpenseItem';
import GradientBackground from '@/components/GradientBackground';
import LoadingBar from '@/components/Loading';
import AddTransactionModal from '@/components/transactions/AddTransactionModal';
import TransactionSummary from '@/components/transactions/TransactionSummary';
import { useTransactions } from '@/components/transactions/useTransactions';
import { colors, fontSizes, spacing } from '@/constants/theme';
import { Plus, Search as SearchIcon } from 'lucide-react-native';
import { useRef, useState } from 'react';
import { FlatList, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import Animated, { FadeIn } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function HomeScreen() {
  const { expenses, isLoading, handleCategoryChange, addExpense } = useTransactions();
  const [modalVisible, setModalVisible] = useState(false);
  const [newExpense, setNewExpense] = useState<{
    amount: string;
    category: 'needs' | 'wants' | 'investing';
    note: string;
    date: string;
  }>({
    amount: '',
    category: 'needs',
    note: '',
    date: new Date().toISOString().split('T')[0],
  });
  const insets = useSafeAreaInsets();
  const flatListRef = useRef<FlatList>(null);

  const handleAddExpense = async () => {
    const success = await addExpense(newExpense);
    if (success) {
      setModalVisible(false);
      setNewExpense({
        amount: '',
        category: 'needs',
        note: '',
        date: new Date().toISOString().split('T')[0],
      });
    }
  };

  if (isLoading) {
    return (
      <GradientBackground>
        <View style={[styles.container, styles.loadingContainer, { paddingBottom: insets.bottom }]}>
          {/* <Text style={styles.loadingText}>Loading...</Text> */}
          <LoadingBar />
        </View>
      </GradientBackground>
    );
  }

  // Calculate total expenses by category
  const expenseTotals = expenses.reduce((acc, expense) => {
    const { category, amount } = expense;
    if (category) {
      acc[category] = (acc[category] || 0) + amount;
    }
    return acc;
  }, {} as Record<string, number>);

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
        
        <TransactionSummary expenseTotals={expenseTotals} />
        
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

        <TouchableOpacity
          style={styles.floatingButton}
          onPress={() => setModalVisible(true)}
          activeOpacity={0.8}
        >
          <Plus size={28} color="#FFFFFF" />
        </TouchableOpacity>

        <AddTransactionModal
          visible={modalVisible}
          newExpense={newExpense}
          onClose={() => setModalVisible(false)}
          onExpenseChange={setNewExpense}
          onSubmit={handleAddExpense}
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
  sectionTitle: {
    fontSize: fontSizes.md,
    fontWeight: '600',
    color: colors.text.primary,
    marginBottom: spacing.md,
  },
  expensesList: {
    paddingBottom: spacing.xl + 60,
  },
  loadingContainer: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: fontSizes.md,
    color: colors.text.secondary,
  },
  floatingButton: {
    position: 'absolute',
    right: spacing.md,
    bottom: spacing.xl,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
});
