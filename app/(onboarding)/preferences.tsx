import { supabase } from '@/app/lib/supabase';
import GradientBackground from '@/components/GradientBackground';
import { colors, fontSizes, spacing } from '@/constants/theme';
import { useRouter } from 'expo-router';
import { ArrowRight } from 'lucide-react-native';
import { useState } from 'react';
import {
    ActivityIndicator,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';
import Animated, { FadeInUp } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const BACKEND_URL = 'http://10.159.6.229:3000';

export default function PreferencesScreen() {
  const [monthlyIncome, setMonthlyIncome] = useState('');
  const [savingsTarget, setSavingsTarget] = useState('');
  const [emergencyFund, setEmergencyFund] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const handleIncomeChange = (value: string) => {
    setMonthlyIncome(value);
    
    const income = parseFloat(value);
    if (!isNaN(income) && income > 0) {
      // Auto-calculate: 20% for savings, 3x for emergency fund
      setSavingsTarget((income * 0.2).toFixed(2));
      setEmergencyFund((income * 3).toFixed(2));
    } else {
      setSavingsTarget('');
      setEmergencyFund('');
    }
  };

  const handleSubmit = async () => {
    // Validate inputs
    const income = parseFloat(monthlyIncome);
    const savings = parseFloat(savingsTarget);
    const emergency = parseFloat(emergencyFund);

    if (!monthlyIncome || isNaN(income) || income <= 0) {
      setError('Please enter a valid monthly income');
      return;
    }

    if (!savingsTarget || isNaN(savings) || savings < 0) {
      setError('Please enter a valid savings target');
      return;
    }

    if (!emergencyFund || isNaN(emergency) || emergency < 0) {
      setError('Please enter a valid emergency fund target');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      // Get current user
      if (!supabase) {
        throw new Error('Supabase not initialized');
      }

      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        throw new Error('No user logged in');
      }

      // Save preferences to backend
      const response = await fetch(`${BACKEND_URL}/preferences/save`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          user_id: user.id,
          monthly_income: income,
          savings_target: savings,
          emergency_fund: emergency,
        }),
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.error || 'Failed to save preferences');
      }

      console.log('Preferences saved successfully');

      // Navigate to main app
      router.replace('/(tabs)');
    } catch (err: any) {
      console.error('Error saving preferences:', err);
      setError(err.message || 'Failed to save preferences. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <GradientBackground>
      <View style={[styles.container, { paddingTop: insets.top, paddingBottom: insets.bottom }]}>
        <Animated.View 
          style={styles.content}
          entering={FadeInUp.duration(800).delay(200)}
        >
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.title}>Set Your Financial Goals</Text>
            <Text style={styles.subtitle}>
              Help us personalize your experience by setting your financial targets
            </Text>
          </View>

          {/* Form */}
          <View style={styles.form}>
            {/* Monthly Income */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Monthly Income</Text>
              <View style={styles.inputContainer}>
                <Text style={styles.currencySymbol}>₹</Text>
                <TextInput
                  style={styles.input}
                  placeholder="0"
                  placeholderTextColor={colors.text.tertiary}
                  keyboardType="numeric"
                  value={monthlyIncome}
                  onChangeText={handleIncomeChange}
                  editable={!isLoading}
                />
              </View>
              <Text style={styles.hint}>Your total monthly income</Text>
            </View>

            {/* Savings Target */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Monthly Savings Target</Text>
              <View style={styles.inputContainer}>
                <Text style={styles.currencySymbol}>₹</Text>
                <TextInput
                  style={styles.input}
                  placeholder="0"
                  placeholderTextColor={colors.text.tertiary}
                  keyboardType="numeric"
                  value={savingsTarget}
                  onChangeText={setSavingsTarget}
                  editable={!isLoading}
                />
              </View>
              <Text style={styles.hint}>Recommended: 20% of income</Text>
            </View>

            {/* Emergency Fund */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Emergency Fund Target</Text>
              <View style={styles.inputContainer}>
                <Text style={styles.currencySymbol}>₹</Text>
                <TextInput
                  style={styles.input}
                  placeholder="0"
                  placeholderTextColor={colors.text.tertiary}
                  keyboardType="numeric"
                  value={emergencyFund}
                  onChangeText={setEmergencyFund}
                  editable={!isLoading}
                />
              </View>
              <Text style={styles.hint}>Recommended: 3 months of income</Text>
            </View>

            {/* Error Message */}
            {error ? (
              <View style={styles.errorContainer}>
                <Text style={styles.errorText}>{error}</Text>
              </View>
            ) : null}

            {/* Submit Button */}
            <TouchableOpacity
              style={[styles.submitButton, isLoading && styles.submitButtonDisabled]}
              onPress={handleSubmit}
              disabled={isLoading}
              activeOpacity={0.8}
            >
              {isLoading ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <>
                  <Text style={styles.submitButtonText}>Continue</Text>
                  <ArrowRight size={20} color="#FFFFFF" />
                </>
              )}
            </TouchableOpacity>
          </View>

          {/* Skip Option */}
          <TouchableOpacity
            style={styles.skipButton}
            onPress={() => router.replace('/(tabs)')}
            disabled={isLoading}
          >
            <Text style={styles.skipButtonText}>Skip for now</Text>
          </TouchableOpacity>
        </Animated.View>
      </View>
    </GradientBackground>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: spacing.md,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    paddingVertical: spacing.md,
  },
  header: {
    marginBottom: spacing.lg,
    marginTop: spacing.md,
  },
  title: {
    fontSize: fontSizes.xxl,
    fontWeight: '800',
    color: colors.text.primary,
    marginBottom: spacing.sm,
  },
  subtitle: {
    fontSize: fontSizes.md,
    color: colors.text.secondary,
    lineHeight: 22,
  },
  form: {
    gap: spacing.lg,
  },
  inputGroup: {
    gap: spacing.xs,
  },
  label: {
    fontSize: fontSizes.md,
    fontWeight: '600',
    color: colors.text.primary,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    paddingHorizontal: spacing.md,
    height: 56,
  },
  currencySymbol: {
    fontSize: fontSizes.lg,
    fontWeight: '600',
    color: colors.text.secondary,
    marginRight: spacing.xs,
  },
  input: {
    flex: 1,
    fontSize: fontSizes.lg,
    fontWeight: '600',
    color: colors.text.primary,
  },
  hint: {
    fontSize: fontSizes.xs,
    color: colors.text.tertiary,
    marginTop: spacing.xs,
  },
  errorContainer: {
    backgroundColor: 'rgba(248, 113, 113, 0.1)',
    padding: spacing.md,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(248, 113, 113, 0.2)',
  },
  errorText: {
    color: colors.status.error,
    fontSize: fontSizes.sm,
    textAlign: 'center',
  },
  submitButton: {
    backgroundColor: colors.primary,
    height: 56,
    borderRadius: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
    marginTop: spacing.md,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  submitButtonDisabled: {
    opacity: 0.6,
  },
  submitButtonText: {
    fontSize: fontSizes.md,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  skipButton: {
    alignItems: 'center',
    paddingVertical: spacing.md,
    marginTop: spacing.sm,
  },
  skipButtonText: {
    fontSize: fontSizes.sm,
    color: colors.text.secondary,
    textDecorationLine: 'underline',
  },
});
