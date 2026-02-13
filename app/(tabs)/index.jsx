import { TypedStorage } from '@/app/lib/storage';
import ExpenseItem from '@/components/ExpenseItem';
import GradientBackground from '@/components/GradientBackground';
import { initialExpenses } from '@/constants/mockData';
import { colors, fontSizes, spacing } from '@/constants/theme';
import { useRouter } from 'expo-router';
import { Plus, Search as SearchIcon, X } from 'lucide-react-native';
import { useCallback, useEffect, useRef, useState } from 'react';
import { FlatList, Modal, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import Animated, { FadeIn } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function HomeScreen() {
  const [expenses, setExpenses] = useState(initialExpenses);
  const [isLoading, setIsLoading] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);
  const [newExpense, setNewExpense] = useState({
    amount: '',
    category: 'needs',
    note: '',
    date: new Date().toISOString().split('T')[0],
  });
  const insets = useSafeAreaInsets();
  const flatListRef = useRef(null);
  
  const router = useRouter();
  
  // Load expenses from storage on component mount
  useEffect(() => {
    loadExpenses();
  }, []);
  
  // Save expenses to storage whenever expenses change
  useEffect(() => {
    if (!isLoading) {
      saveExpenses();
    }
  }, [expenses, isLoading]);
  
  const loadExpenses = async () => {
    try {
      const storedExpenses = await TypedStorage.getObject('expenses');
      if (storedExpenses && Array.isArray(storedExpenses)) {
        setExpenses(storedExpenses);
      }
    } catch (error) {
      console.error('Error loading expenses:', error);
    } finally {
      setIsLoading(false);
    }
  };
  
  const saveExpenses = async () => {
    try {
      await TypedStorage.setObject('expenses', expenses);
    } catch (error) {
      console.error('Error saving expenses:', error);
    }
  };
  
  const handleCategoryChange = useCallback((expenseId, newCategory) => {
    setExpenses(prevExpenses => 
      prevExpenses.map(expense => 
        expense.id === expenseId ? { ...expense, category: newCategory } : expense
      )
    );
  }, []);

  const handleAddExpense = () => {
    if (!newExpense.amount || parseFloat(newExpense.amount) <= 0) {
      alert('Please enter a valid amount');
      return;
    }

    const expense = {
      id: Date.now().toString(),
      description: newExpense.note || 'Manual Entry',
      amount: parseFloat(newExpense.amount),
      category: newExpense.category,
      date: newExpense.date,
      time: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
    };

    setExpenses(prevExpenses => [expense, ...prevExpenses]);
    setModalVisible(false);
    setNewExpense({
      amount: '',
      category: 'needs',
      note: '',
      date: new Date().toISOString().split('T')[0],
    });
  };

  if (isLoading) {
    return (
      <GradientBackground>
        <View style={[styles.container, styles.loadingContainer, { paddingBottom: insets.bottom }]}>
          <Text style={styles.loadingText}>Loading...</Text>
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

        {/* Floating Add Button */}
        <TouchableOpacity
          style={styles.floatingButton}
          onPress={() => setModalVisible(true)}
          activeOpacity={0.8}
        >
          <Plus size={28} color="#FFFFFF" />
        </TouchableOpacity>

        {/* Add Expense Modal */}
        <Modal
          animationType="slide"
          transparent={true}
          visible={modalVisible}
          onRequestClose={() => setModalVisible(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Add Transaction</Text>
                <TouchableOpacity onPress={() => setModalVisible(false)}>
                  <X size={24} color={colors.text.dark} />
                </TouchableOpacity>
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Amount</Text>
                <TextInput
                  style={styles.input}
                  placeholder="0"
                  placeholderTextColor={colors.text.tertiary}
                  keyboardType="numeric"
                  value={newExpense.amount}
                  onChangeText={(text) => setNewExpense({ ...newExpense, amount: text })}
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Category</Text>
                <View style={styles.categoryButtons}>
                  <TouchableOpacity
                    style={[
                      styles.categoryButton,
                      { 
                        backgroundColor: newExpense.category === 'needs' 
                          ? colors.category.needs 
                          : `${colors.category.needs}20`,
                        borderColor: colors.category.needs,
                      },
                    ]}
                    onPress={() => setNewExpense({ ...newExpense, category: 'needs' })}
                  >
                    <Text
                      style={[
                        styles.categoryButtonText,
                        { 
                          color: newExpense.category === 'needs' ? '#FFFFFF' : colors.category.needs,
                          fontWeight: newExpense.category === 'needs' ? '700' : '600',
                        },
                      ]}
                    >
                      Needs
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[
                      styles.categoryButton,
                      { 
                        backgroundColor: newExpense.category === 'wants' 
                          ? colors.category.wants 
                          : `${colors.category.wants}20`,
                        borderColor: colors.category.wants,
                      },
                    ]}
                    onPress={() => setNewExpense({ ...newExpense, category: 'wants' })}
                  >
                    <Text
                      style={[
                        styles.categoryButtonText,
                        { 
                          color: newExpense.category === 'wants' ? '#FFFFFF' : colors.category.wants,
                          fontWeight: newExpense.category === 'wants' ? '700' : '600',
                        },
                      ]}
                    >
                      Wants
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[
                      styles.categoryButton,
                      { 
                        backgroundColor: newExpense.category === 'investing' 
                          ? colors.category.investing 
                          : `${colors.category.investing}20`,
                        borderColor: colors.category.investing,
                      },
                    ]}
                    onPress={() => setNewExpense({ ...newExpense, category: 'investing' })}
                  >
                    <Text
                      style={[
                        styles.categoryButtonText,
                        { 
                          color: newExpense.category === 'investing' ? '#FFFFFF' : colors.category.investing,
                          fontWeight: newExpense.category === 'investing' ? '700' : '600',
                        },
                      ]}
                    >
                      Investing
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Note (optional)</Text>
                <TextInput
                  style={styles.input}
                  placeholder="e.g., Grocery shopping"
                  placeholderTextColor={colors.text.tertiary}
                  value={newExpense.note}
                  onChangeText={(text) => setNewExpense({ ...newExpense, note: text })}
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Date</Text>
                <TextInput
                  style={styles.input}
                  placeholder="YYYY-MM-DD"
                  placeholderTextColor={colors.text.tertiary}
                  value={newExpense.date}
                  onChangeText={(text) => setNewExpense({ ...newExpense, date: text })}
                />
              </View>

              <TouchableOpacity
                style={styles.addButton}
                onPress={handleAddExpense}
                activeOpacity={0.8}
              >
                <Text style={styles.addButtonText}>Add Expense</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
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
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: spacing.lg,
    paddingBottom: spacing.xl,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  modalTitle: {
    fontSize: fontSizes.xl,
    fontWeight: '700',
    color: '#111827',
  },
  inputGroup: {
    marginBottom: spacing.md,
  },
  inputLabel: {
    fontSize: fontSizes.sm,
    fontWeight: '600',
    color: '#374151',
    marginBottom: spacing.xs,
  },
  input: {
    backgroundColor: '#F3F4F6',
    borderRadius: 12,
    padding: spacing.md,
    fontSize: fontSizes.md,
    color: '#111827',
  },
  categoryButtons: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  categoryButton: {
    flex: 1,
    paddingVertical: spacing.sm,
    borderRadius: 12,
    borderWidth: 2,
    alignItems: 'center',
  },
  categoryButtonText: {
    fontSize: fontSizes.sm,
  },
  addButton: {
    backgroundColor: '#1A1E2E',
    borderRadius: 12,
    paddingVertical: spacing.md,
    alignItems: 'center',
    marginTop: spacing.md,
  },
  addButtonText: {
    fontSize: fontSizes.md,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});
