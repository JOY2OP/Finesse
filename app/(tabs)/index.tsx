import GradientBackground from '@/components/GradientBackground';
import LoadingBar from '@/components/Loading';
import AddTransactionModal from '@/components/transactions/AddTransactionModal';
import CategoryFilter from '@/components/transactions/CategoryFilter';
import TransactionGroup from '@/components/transactions/TransactionGroup';
import TransactionSummary from '@/components/transactions/TransactionSummary';
import { useTransactions } from '@/components/transactions/useTransactions';
import { colors } from '@/constants/theme';
import { useRouter } from 'expo-router';
import { Plus, Search as SearchIcon } from 'lucide-react-native';
import { useState } from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import Animated, { FadeIn } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

type Category = 'needs' | 'wants' | 'investing';

export default function HomeScreen() {
  const { expenses, isLoading, handleCategoryChange, addExpense } = useTransactions();
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedCategories, setSelectedCategories] = useState<Category[]>(['needs', 'wants', 'investing']);
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

  const handleToggleCategory = (category: Category) => {
    setSelectedCategories(prev => 
      prev.includes(category) 
        ? prev.filter(c => c !== category)
        : [...prev, category]
    );
  };

  if (isLoading) {
    return (
      <GradientBackground>
        <View style={[styles.container, styles.loadingContainer, { paddingBottom: insets.bottom }]}>
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

  // Group expenses by date
  const groupedExpenses = expenses.reduce((acc, expense) => {
    const date = new Date(expense.date);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    const monthShort = date.toLocaleDateString('en-US', { month: 'short' }).toUpperCase();
    const day = date.getDate();
    const year = String(date.getFullYear()).slice(-2);

    let groupKey: string;
    let displayTitle: string;
    if (date.toDateString() === today.toDateString()) {
      groupKey = expense.date;
      displayTitle = `TODAY, ${monthShort} ${day} '${year}`;
    } else if (date.toDateString() === yesterday.toDateString()) {
      groupKey = expense.date;
      displayTitle = `YESTERDAY, ${monthShort} ${day} '${year}`;
    } else {
      groupKey = expense.date;
      displayTitle = `${monthShort} ${day} '${year}`;
    }

    if (!acc[groupKey]) {
      acc[groupKey] = {
        title: displayTitle,
        date: expense.date,
        transactions: [],
        total: 0,
      };
    }

    acc[groupKey].transactions.push(expense);
    acc[groupKey].total += expense.amount;

    return acc;
  }, {} as Record<string, any>);

  // Sort groups by date (latest first)
  const sortedGroups = Object.values(groupedExpenses).sort(
    (a: any, b: any) => new Date(b.date).getTime() - new Date(a.date).getTime()
  );

  const router = useRouter();

  return (
    <GradientBackground>
      <View style={[styles.container, { paddingBottom: insets.bottom }]}>
        {/* Header */}
        <Animated.View 
          style={styles.header}
          entering={FadeIn.duration(600)}
        >
          <TouchableOpacity style={styles.profileButton}>
            <Text style={styles.profileIcon}>👤</Text>
          </TouchableOpacity>
          <Text style={styles.logo}>Finesse</Text>
          <TouchableOpacity style={styles.searchButton}>
            <SearchIcon size={20} color={colors.primary} />
          </TouchableOpacity>
        </Animated.View>
        
        <ScrollView 
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Transaction Summary */}
          <TransactionSummary expenseTotals={expenseTotals} />
          
          {/* Category Filters */}
          <CategoryFilter 
            selectedCategories={selectedCategories}
            onToggleCategory={handleToggleCategory}
          />
          
          {/* Transaction Groups */}
          <View style={styles.transactionsContainer}>
            {sortedGroups.map((group: any) => (
              <TransactionGroup
                key={group.date}
                title={group.title}
                date={group.date}
                transactions={group.transactions}
                totalAmount={group.total}
                onCategoryChange={handleCategoryChange}
              />
            ))}
          </View>
        </ScrollView>

        {/* Floating Add Button */}
        <TouchableOpacity
          style={styles.floatingButton}
          onPress={() => setModalVisible(true)}
          activeOpacity={0.8}
        >
          <Plus size={28} color="#FFFFFF" />
        </TouchableOpacity>

        {/* Add Transaction Modal */}
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
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 50,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 16,
    backgroundColor: 'rgba(248, 250, 252, 0.8)',
    backdropFilter: 'blur(10px)',
  },
  profileButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(43, 108, 238, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  profileIcon: {
    fontSize: 24,
  },
  logo: {
    fontSize: 18,
    fontWeight: '700',
    color: '#0F172A',
    letterSpacing: -0.5,
    flex: 1,
    textAlign: 'center',
  },
  searchButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(43, 108, 238, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  transactionsContainer: {
    paddingHorizontal: 16,
    marginTop: 8,
  },
  loadingContainer: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  floatingButton: {
    position: 'absolute',
    right: 24,
    bottom: 20,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#2B6CEE',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
});
