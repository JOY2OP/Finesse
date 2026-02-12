import GradientBackground from '@/components/GradientBackground';
import { colors, fontSizes, spacing } from '@/constants/theme';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { ArrowLeft, CircleCheck as CheckCircle, Shield } from 'lucide-react-native';
import { useEffect, useRef, useState } from 'react';
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
// import { useLocalSearchParams } from 'expo-router';
import { supabase } from '../lib/supabase';
// import { useRouter } from 'expo-router';

const BACKEND_URL = 'http://192.168.31.76:3000';

export default function VerifyScreen() {
  const { phone } = useLocalSearchParams();
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [resendCooldown, setResendCooldown] = useState(0);
  const insets = useSafeAreaInsets();
  const router = useRouter();

  const inputRefs = useRef([]);
  const buttonScale = useSharedValue(1);
  const errorOpacity = useSharedValue(0);
  const successScale = useSharedValue(0);
  
  // Cooldown timer for resend
  useEffect(() => {
    if (resendCooldown > 0) {
      const timer = setTimeout(() => {
        setResendCooldown(resendCooldown - 1);
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [resendCooldown]);
  
  const formatPhoneDisplay = (phoneNumber) => {
    if (!phoneNumber) return '';
    const cleaned = phoneNumber.replace(/\D/g, '');
    if (cleaned.length === 12 && cleaned.startsWith('91')) {
      const number = cleaned.slice(2); // Remove 91
      return `${number.slice(0, 5)} ${number.slice(5)}`;
    }
    return phoneNumber;
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
  
  const handleOtpChange = (value, index) => {
    if (value.length > 1) return; // Prevent multiple characters
    
    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);
    
    // Auto-focus next input
    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
    
    // Auto-verify when all digits are entered
    if (newOtp.every(digit => digit !== '') && newOtp.join('').length === 6) {
      verifyOTP(newOtp.join(''));
    }
  };
  
  const handleKeyPress = (key, index) => {
    if (key === 'Backspace' && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };
  
  const verifyOTP = async (otpCode) => {
    const code = otpCode || otp.join('');
    
    // if (code.length !== 6) {
    //   showError('Please enter the complete 6-digit code');
    //   return;
    // }
    
    setIsLoading(true);
    setError('');
    
    // Animate button
    buttonScale.value = withSequence(
      withTiming(0.95, { duration: 100 }),
      withSpring(1)
    );
    
    try {
      console.log('Verifying OTP:', code, 'for phone:', phone);
      
      //Verify OTP
        const response = await supabase.auth.verifyOtp({
            phone,
            token: code,
            // token: otp,
            type: 'sms',
        })
        console.log(response)

        if (error) {
            // setError('Invalid OTP. Please try again.');
            console.log(error)
            return;
        } else {
            //TODO:generate setu sesssion here
            openwebview(phone);
            
            //Route the user to tabs
            router.replace('/(tabs)');
        }
      
    } catch (error) {
      console.error('OTP verification error:', error);
      showError(error.message || 'Invalid verification code. Please try again.');
      
      // Clear OTP on error
      setOtp(['', '', '', '', '', '']);
      inputRefs.current[0]?.focus();
    } finally {
      setIsLoading(false);
    }
  };
  
  const openwebview = async(phone) => { 
    try{
       console.log("trying sending to backend")
      const response = await fetch(`${BACKEND_URL}/aa`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ phone }),
      });
      const data = await response.json();
      console.log("data: ", data)


    }catch(err){
      console.log("ERROR IN OPENING WEBVIEW: ", err)
    }
  }

  const resendOTP = async () => {
    if (resendCooldown > 0) return;
    
    setIsLoading(true);
    setError('');
    
    try {
      // For demo purposes, we'll simulate resending OTP
      console.log('Resending OTP to:', phone);
      
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      setResendCooldown(60); // 60 second cooldown
      
    } catch (error) {
      console.error('Resend OTP error:', error);
      showError(error.message || 'Failed to resend code. Please try again.');
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
  
  const successAnimatedStyle = useAnimatedStyle(() => {
    return {
      transform: [{ scale: successScale.value }],
      opacity: successScale.value,
    };
  });
  
  const isComplete = otp.every(digit => digit !== '');
  
  return (
    <GradientBackground>
      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <KeyboardAvoidingView
          style={{ flex: 1 }}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
          <View style={[styles.container, { paddingBottom: insets.bottom }]}>
            {/* Success Overlay */}
            <Animated.View style={[styles.successOverlay, successAnimatedStyle]}>
              <CheckCircle size={64} color={colors.status.success} />
              <Text style={styles.successText}>Verified!</Text>
            </Animated.View>
            
            <Animated.View 
              style={styles.content}
              entering={FadeIn.duration(600)}
            >
              {/* Back Button */}
              <TouchableOpacity 
                style={styles.backButton}
                onPress={() => router.back()}
                disabled={isLoading}
              >
                <ArrowLeft size={24} color={colors.text.primary} />
              </TouchableOpacity>
              
              {/* Header */}
              <View style={styles.header}>
                <View style={styles.iconContainer}>
                  <Shield size={32} color={colors.primary} />
                </View>
                <Text style={styles.title}>Enter verification code</Text>
                <Text style={styles.subtitle}>
                  We sent a 6-digit code to{'\n'}
                  <Text style={styles.phoneNumber}>+91 {formatPhoneDisplay(phone || '')}</Text>
                </Text>
              </View>
              
              {/* Error Message */}
              {error ? (
                <Animated.View style={[styles.errorContainer, errorAnimatedStyle]}>
                  <Text style={styles.errorText}>{error}</Text>
                </Animated.View>
              ) : null}
              
              {/* OTP Input */}
              <View style={styles.otpContainer}>
                {otp.map((digit, index) => (
                  <TextInput
                    key={index}
                    ref={(ref) => (inputRefs.current[index] = ref)}
                    style={[
                      styles.otpInput,
                      digit && styles.otpInputFilled,
                      error && styles.otpInputError,
                    ]}
                    value={digit}
                    onChangeText={(value) => handleOtpChange(value, index)}
                    onKeyPress={({ nativeEvent }) => handleKeyPress(nativeEvent.key, index)}
                    keyboardType="number-pad"
                    maxLength={1}
                    editable={!isLoading}
                    selectTextOnFocus
                    autoFocus={index === 0}
                  />
                ))}
              </View>
              
              {/* Verify Button */}
              <Animated.View style={buttonAnimatedStyle}>
                <TouchableOpacity
                  style={[
                    styles.verifyButton,
                    (!isComplete || isLoading) && styles.verifyButtonDisabled,
                  ]}
                  onPress={() => verifyOTP()}
                  // disabled={!isComplete || isLoading}
                  activeOpacity={0.8}
                >
                  {isLoading ? (
                    <View style={styles.loadingContainer}>
                      <View style={styles.loadingDot} />
                      <View style={[styles.loadingDot, styles.loadingDotDelay1]} />
                      <View style={[styles.loadingDot, styles.loadingDotDelay2]} />
                    </View>
                  ) : (
                    <Text style={styles.verifyButtonText}>Verify Code</Text>
                  )}
                </TouchableOpacity>
              </Animated.View>
              
              {/* Resend */}
              <View style={styles.resendContainer}>
                <Text style={styles.resendText}>Didn't receive the code? </Text>
                <TouchableOpacity
                  onPress={resendOTP}
                  disabled={resendCooldown > 0 || isLoading}
                >
                  <Text style={[
                    styles.resendLink,
                    (resendCooldown > 0 || isLoading) && styles.resendLinkDisabled,
                  ]}>
                    {resendCooldown > 0 ? `Resend in ${resendCooldown}s` : 'Resend'}
                  </Text>
                </TouchableOpacity>
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
    paddingVertical: spacing.xl,
  },
  successOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: colors.background.dark,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
  successText: {
    fontSize: fontSizes.xl,
    fontWeight: '700',
    color: colors.status.success,
    marginTop: spacing.md,
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.background.card,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.lg,
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
  },
  phoneNumber: {
    color: colors.text.primary,
    fontWeight: '600',
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
  otpContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: spacing.xl,
    paddingHorizontal: spacing.sm,
  },
  otpInput: {
    width: 48,
    height: 56,
    backgroundColor: colors.background.input,
    borderRadius: 12,
    textAlign: 'center',
    fontSize: fontSizes.lg,
    fontWeight: '600',
    color: colors.text.primary,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  otpInputFilled: {
    borderColor: colors.primary,
    backgroundColor: `${colors.primary}10`,
  },
  otpInputError: {
    borderColor: colors.status.error,
    backgroundColor: `${colors.status.error}10`,
  },
  verifyButton: {
    backgroundColor: colors.primary,
    borderRadius: 16,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
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
    marginBottom: spacing.lg,
  },
  verifyButtonDisabled: {
    backgroundColor: `${colors.primary}40`,
    shadowOpacity: 0,
    elevation: 0,
  },
  verifyButtonText: {
    color: '#fff',
    fontSize: fontSizes.md,
    fontWeight: '600',
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
  resendContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  resendText: {
    fontSize: fontSizes.sm,
    color: colors.text.secondary,
  },
  resendLink: {
    fontSize: fontSizes.sm,
    color: colors.primary,
    fontWeight: '600',
  },
  resendLinkDisabled: {
    color: colors.text.tertiary,
  },
});