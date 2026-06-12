import { useSMSTransactions } from '@/app/features/sms/useSMSTransactions';
import { supabase } from '@/app/lib/supabase';
import GradientBackground from '@/components/GradientBackground';
import LoadingBar from '@/components/Loading';
import AddTransactionModal, { NewExpense } from '@/components/transactions/AddTransactionModal';
import CategoryFilter from '@/components/transactions/CategoryFilter';
import TransactionGroup from '@/components/transactions/TransactionGroup';
import TransactionSummary from '@/components/transactions/TransactionSummary';
import { useTransactions } from '@/components/transactions/useTransactions';
import * as Notifications from 'expo-notifications';
import { useRouter } from 'expo-router';
import { Plus } from 'lucide-react-native';
import { useEffect, useMemo, useState } from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import Animated, { FadeIn } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

type Category = 'needs' | 'wants' | 'investing';

export default function HomeScreen() {
  const { expenses, isLoading, handleCategoryChange, addExpense, updateExpense, deleteExpense } = useTransactions();
  const {
    pendingTransaction,
    showCategorizationModal,
    dismissCategorization,
    confirmCategorization,
  } = useSMSTransactions();

  const [modalVisible, setModalVisible] = useState(false);
  const [modalMode, setModalMode] = useState<'add' | 'edit'>('add');
  const [editingTransactionId, setEditingTransactionId] = useState<string | null>(null);
  const [selectedCategories, setSelectedCategories] = useState<Category[]>(['needs', 'wants', 'investing']);
  const [newExpense, setNewExpense] = useState<{
    amount: string;
    category: 'needs' | 'wants' | 'investing';
    note: string;
    date: string;
    subcategory?: string;
  }>({
    amount: '',
    category: 'needs',
    note: '',
    date: new Date().toISOString().split('T')[0],
  });
  const insets = useSafeAreaInsets();

  const handleAddExpense = async (expense?: NewExpense) => {
    const success = await addExpense(expense ?? newExpense);
    if (success) closeModal();
  };

  const handleEditSubmit = async (expense?: NewExpense) => {
    if (!editingTransactionId) return;
    const success = await updateExpense(editingTransactionId, expense ?? newExpense);
    if (success) closeModal();
  };

  // SMS transaction initial values
  const smsInitialExpense = pendingTransaction ? {
    amount: String(pendingTransaction.amount),
    category: 'needs' as const,
    note: pendingTransaction.merchant ?? '',
    date: pendingTransaction.date ?? new Date().toISOString().split('T')[0],
    subcategory: '',
  } : null;

  const handleSMSExpenseSubmit = async (expense?: NewExpense) => {
    if (!expense) return;
    const success = await addExpense(expense);
    if (success && pendingTransaction) {
      confirmCategorization(pendingTransaction.id, expense.subcategory ?? 'other');
    }
  };

  // Log when modal visibility changes
  useEffect(() => {
    if (showCategorizationModal) {
      console.log('🔔 [HomeScreen] SMS Modal opening with data:', smsInitialExpense);
    }
  }, [showCategorizationModal, smsInitialExpense]);

  const handleEditTransaction = (transaction: { id: string; description: string; category: string; subcategory?: string; amount: number; date: string }) => {
    setNewExpense({
      amount: String(transaction.amount),
      category: (transaction.category as Category) || 'needs',
      note: transaction.description || '',
      date: transaction.date,
      subcategory: transaction.subcategory,
    });
    setEditingTransactionId(transaction.id);
    setModalMode('edit');
    setModalVisible(true);
  };

  const closeModal = () => {
    setModalVisible(false);
    setModalMode('add');
    setEditingTransactionId(null);
    setNewExpense({
      amount: '',
      category: 'needs',
      note: '',
      date: new Date().toISOString().split('T')[0],
    });
  };

  const handleToggleCategory = (category: Category) => {
    setSelectedCategories(prev => 
      prev.includes(category) 
        ? prev.filter(c => c !== category)
        : [...prev, category]
    );
  };

  // ── Derived data (must be above any early returns) ──────────────────────────

  // Total per category — always from full expenses for the summary card
  const expenseTotals = useMemo(() => expenses.reduce((acc, expense) => {
    const { category, amount } = expense;
    if (category) acc[category] = (acc[category] || 0) + amount;
    return acc;
  }, {} as Record<string, number>), [expenses]);

  // Filtered list — only selected categories, no re-fetch
  const filteredExpenses = useMemo(
    () => expenses.filter(e => e.category && selectedCategories.includes(e.category as Category)),
    [expenses, selectedCategories]
  );

  const handleTestNotification = async () => {
    try {
      // Simulate native Kotlin notification system
      // This mimics what SMSBroadcastReceiver.kt would send
      
      const testTransaction = {
        amount: 500.00,
        type: 'debit' as const,
        merchant: 'Swiggy',
        accountNumber: '1234',
        rawMessage: 'Your A/C XX1234 debited by Rs. 500.00 at Swiggy on 20-Apr-26',
        timestamp: Date.now(),
      };

      console.log('🧪 Test: Simulating native SMS notification...');
      console.log('📱 Transaction:', testTransaction);

      // Configure notification handler
      Notifications.setNotificationHandler({
        handleNotification: async () => ({
          shouldShowAlert: true,
          shouldPlaySound: true,
          shouldSetBadge: false,
          shouldShowBanner: true,
          shouldShowList: true,
        }),
      });

      // Request permissions
      const { status } = await Notifications.requestPermissionsAsync();
      if (status !== 'granted') {
        console.log('❌ Notification permission not granted');
        return;
      }

      // Setup notification categories with action buttons (like native)
      await Notifications.setNotificationCategoryAsync('transaction', [
        {
          identifier: 'categorize',
          buttonTitle: 'Categorize',
          options: {
            opensAppToForeground: true,
          },
        },
        {
          identifier: 'ignore',
          buttonTitle: 'Ignore',
          options: {
            opensAppToForeground: false,
          },
        },
      ]);

      // Send notification with action buttons (mimics native notification)
      await Notifications.scheduleNotificationAsync({
        content: {
          title: `💸 Spent ₹${testTransaction.amount.toFixed(2)}`,
          body: `at ${testTransaction.merchant} • A/C XX${testTransaction.accountNumber}`,
          data: {
            type: 'bank_transaction',
            transactionId: `test-${testTransaction.timestamp}`,
            transaction: JSON.stringify({
              id: `test-${testTransaction.timestamp}`,
              amount: testTransaction.amount,
              type: testTransaction.type,
              merchant: testTransaction.merchant,
              accountNumber: testTransaction.accountNumber,
              timestamp: testTransaction.timestamp,
              rawMessage: testTransaction.rawMessage,
            }),
          },
          categoryIdentifier: 'transaction',
          sound: true,
        },
        trigger: null,
      });

      console.log('✅ Test notification sent with action buttons!');
      console.log('💡 Tap "Categorize" to test the modal flow');
    } catch (error) {
      console.error('❌ Failed to send test notification:', error);
    }
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

  // Group filtered expenses by date
  const groupedExpenses = filteredExpenses.reduce((acc, expense) => {
    if (!expense.date) return acc;

    const date = new Date(expense.date);
    if (isNaN(date.getTime())) {
      console.warn('Invalid date for expense:', expense);
      return acc;
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    const expenseDate = new Date(date);
    expenseDate.setHours(0, 0, 0, 0);

    const monthShort = date.toLocaleDateString('en-US', { month: 'short' }).toUpperCase();
    const day = date.getDate();

    let groupKey: string;
    let displayTitle: string;

    if (expenseDate.getTime() === today.getTime()) {
      groupKey = expense.date;
      displayTitle = `TODAY, ${monthShort} ${day}`;
    } else if (expenseDate.getTime() === yesterday.getTime()) {
      groupKey = expense.date;
      displayTitle = `YESTERDAY, ${monthShort} ${day}`;
    } else {
      groupKey = expense.date;
      displayTitle = `${monthShort} ${day}, ${date.getFullYear()}`;
    }

    if (!acc[groupKey]) {
      acc[groupKey] = { title: displayTitle, date: expense.date, transactions: [], total: 0 };
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
      <View style={styles.container}>
        {/* Header */}
        <Animated.View 
          style={styles.header}
          entering={FadeIn.duration(600)}
        >
          <TouchableOpacity style={styles.profileButton}>
            <Text style={styles.profileIcon}>👤</Text>
          </TouchableOpacity>
          <Text style={styles.logo}>Finesse</Text>
          {/* ---------TEST NOTIFICATION---------  */}
          {/* <TouchableOpacity 
            style={styles.testButton}
            onPress={handleTestNotification}
          >
            <Text style={styles.testButtonText}>🔔</Text>
          </TouchableOpacity> */}
          {/* ------------------------------------ */}
          {/* <TouchableOpacity style={styles.searchButton}>
            <SearchIcon size={20} color={colors.primary} />
          </TouchableOpacity> */}
            <TouchableOpacity 
              style={styles.logout}
              onPress={() => supabase?.auth.signOut()}
            >
              <Text style={styles.logoutText}>Logout</Text>
            </TouchableOpacity>
        </Animated.View>
        
        <ScrollView 
          style={styles.scrollView}
          contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 50 }]}
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
            {sortedGroups.map((group: any, groupIndex: number) => (
              <TransactionGroup
                key={group.date}
                title={group.title}
                date={group.date}
                transactions={group.transactions}
                totalAmount={group.total}
                isFirstGroup={groupIndex === 0}
                onCategoryChange={handleCategoryChange}
                onEditTransaction={handleEditTransaction}
                onDelete={deleteExpense}
              />
            ))}
          </View>
        </ScrollView>

        {/* Floating Add Button */}
        <TouchableOpacity
          style={[styles.floatingButton, { bottom: insets.bottom }]}
          onPress={() => {
            setModalMode('add');
            setModalVisible(true);
          }}
          activeOpacity={0.8}
        >
          <Plus size={28} color="#FFFFFF" />
        </TouchableOpacity>

        {/* Add/Edit Transaction Modal */}
        <AddTransactionModal
          visible={modalVisible}
          newExpense={newExpense}
          onClose={closeModal}
          onExpenseChange={setNewExpense}
          onSubmit={modalMode === 'edit' ? handleEditSubmit : handleAddExpense}
          mode={modalMode}
        />

        {/* SMS auto-detected transaction modal */}
        {pendingTransaction && smsInitialExpense && (
          <AddTransactionModal
            key={pendingTransaction.id}
            visible={showCategorizationModal}
            newExpense={smsInitialExpense}
            onClose={dismissCategorization}
            onExpenseChange={() => {}}
            onSubmit={handleSMSExpenseSubmit}
          />
        )}
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
    paddingBottom: 0,
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
  testButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 193, 7, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  testButtonText: {
    fontSize: 20,
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
    // bottom: 200,
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
  logout: {
    backgroundColor: '#FFEBEE',
    paddingVertical: 10,
    paddingHorizontal: 15,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoutText: {
    color: '#D32F2F',
    fontSize: 14,
    fontWeight: '600',
  },
});
