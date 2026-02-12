import { TypedStorage } from '@/app/lib/storage';
import ExpenseItem from '@/components/ExpenseItem';
import GradientBackground from '@/components/GradientBackground';
import { initialExpenses } from '@/constants/mockData';
import { colors, fontSizes, spacing } from '@/constants/theme';
import { useRouter } from 'expo-router';
import { Search as SearchIcon } from 'lucide-react-native';
import { useCallback, useEffect, useRef, useState } from 'react';
import { FlatList, Platform, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import Animated, { FadeIn } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
const BACKEND_URLS = {
  android: 'http://10.84.85.229:3000',
  ios: 'http://152.58.122.26:3000',
  web: 'http://localhost:3000',
};

const BACKEND_URL = BACKEND_URLS[Platform.OS] || 'http://localhost:3000';

export default function HomeScreen() {
  const [expenses, setExpenses] = useState(initialExpenses);
  const [isLoading, setIsLoading] = useState(true);
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
  
  const openwebview = async() => { 
    try{
      console.log("trying sending to backend");
      console.log(`${BACKEND_URL}/aa`);
      const response = await fetch(`${BACKEND_URL}/aa`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        // body: JSON.stringify({ phone: '9999999999' }),
        body: JSON.stringify({ phone: '9315151857' }),
      });
      const data = await response.json();
      console.log("data: ", data)
      console.log(data.consentData.url);

      if(data.consentData.url){
        router.push({
          pathname: '/(aa)/setu',
          params: { url: data.consentData.url },
        });
      }


    }catch(err){
      console.error("ERROR IN OPENING WEBVIEW: ", err)
    }
  }

  return (
    <GradientBackground>
      <View style={[styles.container, { paddingBottom: insets.bottom }]}>
         {/* <Button title="Go to Phone" onPress={() => router.push('/phone')} />
         <Button title="Go to Verify" onPress={() => router.push('/verify')} />
         <Button title="setu" onPress={() => openwebview()} /> */}
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
  loadingContainer: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: fontSizes.md,
    color: colors.text.secondary,
  },
});