import GradientBackground from '@/components/GradientBackground';
import { colors, fontSizes, spacing } from '@/constants/theme';
import { router } from 'expo-router';
import { ArrowRight, Phone } from 'lucide-react-native';
import { useState } from 'react';
import {
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View
} from 'react-native';
import Animated, {
  FadeIn,
  useAnimatedStyle,
  useSharedValue,
  withSequence,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const BACKEND_URL = 'http://localhost:3000';

export default function PhoneAuthScreen() {
  const [phoneNumber, setPhoneNumber] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const insets = useSafeAreaInsets();
  
  const buttonScale = useSharedValue(1);
  const errorOpacity = useSharedValue(0);
  
  const formatPhoneNumber = (text) => {
    // Remove all non-numeric characters
    const cleaned = text.replace(/\D/g, '');
    
    // Format as (XXX) XXX-XXXX
    if (cleaned.length >= 6) {
      return `(${cleaned.slice(0, 3)}) ${cleaned.slice(3, 6)}-${cleaned.slice(6, 10)}`;
    } else if (cleaned.length >= 3) {
      return `(${cleaned.slice(0, 3)}) ${cleaned.slice(3)}`;
    } else {
      return cleaned;
    }
  };
  
  const getCleanPhoneNumber = (formatted) => {
    return formatted.replace(/\D/g, '');
  };
  
  const validatePhoneNumber = (phone) => {
    const cleaned = getCleanPhoneNumber(phone);
    return cleaned.length === 10;
  };
  
  const showError = (message) => {
    setError(message);
    errorOpacity.value = withTiming(1, { duration: 300 });
    
    // Auto-hide error after 5 seconds
    setTimeout(() => {
      errorOpacity.value = withTiming(0, { duration: 300 });
      setTimeout(() => setError(''), 300);
    }, 5000);
  };
  
  const sendOTP = async () => {
    if (!validatePhoneNumber(phoneNumber)) {
      showError('Please enter a valid 10-digit phone number');
      return;
    }
    
    setIsLoading(true);
    setError('');
    
    // Animate button
    buttonScale.value = withSequence(
      withTiming(0.95, { duration: 100 }),
      withSpring(1)
    );
    
    try {
      const cleanPhone = getCleanPhoneNumber(phoneNumber);
      const formattedPhone = `+1${cleanPhone}`; // US numbers
      
      const response = await fetch(`${BACKEND_URL}/auth/send-otp`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ phone: formattedPhone }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to send verification code');
      }
      
      // Navigate to verification screen
      router.push({
        pathname: '/(auth)/verify',
        params: { phone: formattedPhone }
      });
      
    } catch (error) {
      console.error('OTP send error:', error);
      showError(error.message || 'Failed to send verification code. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };
  
  const buttonAnimatedStyle = useAnimatedStyle(() => {
    return {
      transform: [{ scale: buttonScale.value }],
    };
  });
  
  const errorAnimatedStyle = useAnimatedStyle(() => {
    return {
      opacity: errorOpacity.value,
      transform: [
        {
          translateY: errorOpacity.value === 0 ? -10 : 0,
        },
      ],
    };
  });
  
  const isValidPhone = validatePhoneNumber(phoneNumber);
  
  return (
    <GradientBackground>
      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <KeyboardAvoidingView
          style={{ flex: 1 }}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
          <View style={[styles.container, { paddingBottom: insets.bottom }]}>
            <Animated.View 
              style={styles.content}
              entering={FadeIn.duration(600)}
            >
              {/* Header */}
              <View style={styles.header}>
                <View style={styles.iconContainer}>
                  <Phone size={32} color={colors.primary} />
                </View>
                <Text style={styles.title}>Enter your phone number</Text>
                <Text style={styles.subtitle}>
                  We'll send you a verification code to confirm your number
                </Text>
              </View>
              
              {/* Error Message */}
              {error ? (
                <Animated.View style={[styles.errorContainer, errorAnimatedStyle]}>
                  <Text style={styles.errorText}>{error}</Text>
                </Animated.View>
              ) : null}
              
              {/* Phone Input */}
              <View style={styles.inputSection}>
                <Text style={styles.inputLabel}>Phone Number</Text>
                <View style={styles.phoneInputContainer}>
                  <View style={styles.countryCode}>
                    <Text style={styles.countryCodeText}>+1</Text>
                  </View>
                  <TextInput
                    style={[
                      styles.phoneInput,
                      isValidPhone && styles.phoneInputValid,
                      error && styles.phoneInputError,
                    ]}
                    placeholder="(555) 123-4567"
                    placeholderTextColor={colors.text.tertiary}
                    value={phoneNumber}
                    onChangeText={(text) => setPhoneNumber(formatPhoneNumber(text))}
                    keyboardType="phone-pad"
                    maxLength={14} // (XXX) XXX-XXXX
                    editable={!isLoading}
                    autoFocus
                  />
                </View>
              </View>
              
              {/* Send Button */}
              <Animated.View style={buttonAnimatedStyle}>
                <TouchableOpacity
                  style={[
                    styles.sendButton,
                    (!isValidPhone || isLoading) && styles.sendButtonDisabled,
                  ]}
                  onPress={sendOTP}
                  disabled={!isValidPhone || isLoading}
                  activeOpacity={0.8}
                >
                  {isLoading ? (
                    <View style={styles.loadingContainer}>
                      <View style={styles.loadingDot} />
                      <View style={[styles.loadingDot, styles.loadingDotDelay1]} />
                      <View style={[styles.loadingDot, styles.loadingDotDelay2]} />
                    </View>
                  ) : (
                    <>
                      <Text style={styles.sendButtonText}>Send Verification Code</Text>
                      <ArrowRight size={20} color="#fff" />
                    </>
                  )}
                </TouchableOpacity>
              </Animated.View>
              
              {/* Footer */}
              <View style={styles.footer}>
                <Text style={styles.footerText}>
                  By continuing, you agree to receive SMS messages from Finesse.
                  Message and data rates may apply.
                </Text>
              </View>
            </Animated.View>
          </View>
        </KeyboardAvoidingView>
      </TouchableWithoutFeedback>
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
    paddingVertical: spacing.xl,
  },
  header: {
    alignItems: 'center',
    marginBottom: spacing.xl,
  },
  iconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: `${colors.primary}20`,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  title: {
    fontSize: fontSizes.xl,
    fontWeight: '700',
    color: colors.text.primary,
    textAlign: 'center',
    marginBottom: spacing.sm,
  },
  subtitle: {
    fontSize: fontSizes.md,
    color: colors.text.secondary,
    textAlign: 'center',
    lineHeight: 22,
    paddingHorizontal: spacing.md,
  },
  errorContainer: {
    backgroundColor: `${colors.status.error}20`,
    borderColor: colors.status.error,
    borderWidth: 1,
    borderRadius: 12,
    padding: spacing.md,
    marginBottom: spacing.lg,
  },
  errorText: {
    color: colors.status.error,
    fontSize: fontSizes.sm,
    textAlign: 'center',
    fontWeight: '500',
  },
  inputSection: {
    marginBottom: spacing.xl,
  },
  inputLabel: {
    fontSize: fontSizes.sm,
    fontWeight: '600',
    color: colors.text.primary,
    marginBottom: spacing.sm,
  },
  phoneInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  countryCode: {
    backgroundColor: colors.background.card,
    borderRadius: 12,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    marginRight: spacing.sm,
    borderWidth: 2,
    borderColor: colors.background.input,
  },
  countryCodeText: {
    fontSize: fontSizes.md,
    fontWeight: '600',
    color: colors.text.primary,
  },
  phoneInput: {
    flex: 1,
    backgroundColor: colors.background.input,
    borderRadius: 12,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    fontSize: fontSizes.md,
    color: colors.text.primary,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  phoneInputValid: {
    borderColor: colors.status.success,
  },
  phoneInputError: {
    borderColor: colors.status.error,
  },
  sendButton: {
    backgroundColor: colors.primary,
    borderRadius: 16,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: colors.primary,
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  sendButtonDisabled: {
    backgroundColor: `${colors.primary}40`,
    shadowOpacity: 0,
    elevation: 0,
  },
  sendButtonText: {
    color: '#fff',
    fontSize: fontSizes.md,
    fontWeight: '600',
    marginRight: spacing.sm,
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#fff',
    marginHorizontal: 2,
    opacity: 0.4,
  },
  loadingDotDelay1: {
    opacity: 0.7,
  },
  loadingDotDelay2: {
    opacity: 1,
  },
  footer: {
    marginTop: spacing.xl,
    paddingHorizontal: spacing.md,
  },
  footerText: {
    fontSize: fontSizes.xs,
    color: colors.text.tertiary,
    textAlign: 'center',
    lineHeight: 18,
  },
});