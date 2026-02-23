import { supabase } from '@/app/lib/supabase';
import { useCallback, useEffect, useState } from 'react';

interface Expense {
  id: string;
  description: string;
  amount: number;
  category: string | null;
  subcategory?: string | null;
  date: string;
  time?: string;
}

interface NewExpense {
  amount: string;
  category: 'needs' | 'wants' | 'investing';
  note: string;
  date: string;
}

const BACKEND_URL = 'http://10.159.6.229:3000';

export function useTransactions() {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadExpenses();
  }, []);

  const loadExpenses = async () => {
    try {
      // Check if supabase is initialized
      if (!supabase) {
        console.error('Supabase not initialized');
        setIsLoading(false);
        return;
      }

      // Get current user
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        console.log('No user logged in');
        setIsLoading(false);
        return;
      }

      console.log('Fetching transactions for user:', user.id);

      // Fetch transactions from backend
      const response = await fetch(`${BACKEND_URL}/transactions/${user.id}`);
      const result = await response.json();

      if (!response.ok || !result.success) {
        console.error('Backend error:', result);
        setIsLoading(false);
        return;
      }

      console.log(`Loaded ${result.data?.length || 0} transactions`);

      // Transform to match Expense interface
      const transformedExpenses: Expense[] = (result.data || []).map((transaction: any) => ({
        id: transaction.id,
        description: transaction.note || 'Transaction',
        amount: transaction.amount,
        category: transaction.category?.toLowerCase() || null,
        subcategory: transaction.subcategory || null,
        date: new Date(transaction.occured_at).toISOString().split('T')[0],
        time: new Date(transaction.occured_at).toLocaleTimeString('en-US', { 
          hour: '2-digit', 
          minute: '2-digit' 
        }),
      }));

      setExpenses(transformedExpenses);
    } catch (error) {
      console.error('Error loading expenses:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCategoryChange = useCallback(async (expenseId: string, newCategory: string, subcategory?: string) => {
    // Update local state immediately
    setExpenses(prevExpenses =>
      prevExpenses.map(expense =>
        expense.id === expenseId 
          ? { ...expense, category: newCategory, subcategory: subcategory || null } 
          : expense
      )
    );

    // Update in backend
    try {
      const response = await fetch(`${BACKEND_URL}/transactions/update-category`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          transaction_id: expenseId,
          category: newCategory.charAt(0).toUpperCase() + newCategory.slice(1),
          subcategory: subcategory || null,
        }),
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        console.error('Failed to update category:', result);
      }
    } catch (error) {
      console.error('Error updating category:', error);
    }
  }, []);

  const addExpense = async (newExpense: NewExpense): Promise<boolean> => {
    console.log('=== ADD EXPENSE CLICKED ===');
    console.log('newExpense:', newExpense);

    if (!newExpense.amount || parseFloat(newExpense.amount) <= 0) {
      alert('Please enter a valid amount');
      return false;
    }

    try {
      // Check if supabase is initialized
      if (!supabase) {
        alert('Supabase not initialized');
        return false;
      }

      // Get current user
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        alert('You must be logged in to add expenses');
        return false;
      }

      // Prepare transaction data
      const transaction = {
        user_id: user.id,
        amount: parseFloat(newExpense.amount),
        category: newExpense.category.charAt(0).toUpperCase() + newExpense.category.slice(1),
        note: newExpense.note || null,
        occured_at: new Date(newExpense.date).toISOString(),
      };

      console.log('Sending transaction to backend:', transaction);

      // Send to backend (bypasses RLS)
      const response = await fetch(`${BACKEND_URL}/transactions/add`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(transaction),
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        console.error('Backend error:', result);
        alert('Failed to add expense: ' + (result.error || 'Unknown error'));
        return false;
      }

      console.log('Transaction inserted:', result.data);

      // Add to local state
      const expense: Expense = {
        id: result.data.id,
        description: newExpense.note || 'Manual Entry',
        amount: parseFloat(newExpense.amount),
        category: newExpense.category,
        date: newExpense.date,
        time: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
      };

      setExpenses(prevExpenses => [expense, ...prevExpenses]);
      return true;
    } catch (err) {
      console.error('Exception:', err);
      alert('Failed to add expense');
      return false;
    }
  };

  return {
    expenses,
    isLoading,
    handleCategoryChange,
    addExpense,
    refreshExpenses: loadExpenses,
  };
}
