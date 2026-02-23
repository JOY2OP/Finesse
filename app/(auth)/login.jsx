import GradientBackground from '@/components/GradientBackground';
import { colors, fontSizes, spacing } from '@/constants/theme';
import { useRouter } from 'expo-router';
import * as WebBrowser from 'expo-web-browser';
import { LogIn } from 'lucide-react-native';
import { useState } from 'react';
import {
  ActivityIndicator,
  Image,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import Animated, { FadeInUp } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { supabase } from '../lib/supabase';

WebBrowser.maybeCompleteAuthSession();

export default function LoginScreen() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const checkAndRedirect = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        router.replace('/(auth)/login');
        return;
      }

      // Check if user has preferences
      const response = await fetch(`http://10.159.6.229:3000/preferences/${user.id}`);
      const result = await response.json();

      if (result.success && result.exists) {
        // User has preferences, go to main app
        router.replace('/(tabs)');
      } else {
        // New user, go to preferences
        router.replace('/(onboarding)/preferences');
      }
    } catch (error) {
      console.error('Error checking preferences:', error);
      // On error, go to preferences to be safe
      router.replace('/(onboarding)/preferences');
    }
  };

  const handleGoogleLogin = async () => {
    try {
      setIsLoading(true);
      setError(null);

      const { data, error: authError } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          skipBrowserRedirect: true,
          redirectTo: 'finesseeas://auth-callback',
        },
      });

      console.log('sign in with auth: ', data);

      if (authError) throw authError;

      if (data?.url) {
        const result = await WebBrowser.openAuthSessionAsync(
          data.url,
          'finesseeas://auth-callback'
        );

        console.log('result: ', result);

        if (result.type === 'success' && result.url) {
          console.log('Success URL:', result.url);

          const url = result.url;
          let access_token, refresh_token, code;

          // Try parsing as hash fragment first (implicit flow)
          if (url.includes('#')) {
            const hashParams = new URLSearchParams(url.split('#')[1]);
            access_token = hashParams.get('access_token');
            refresh_token = hashParams.get('refresh_token');
          }

          // Try parsing as query params (PKCE flow)
          if (url.includes('?')) {
            const queryParams = new URLSearchParams(url.split('?')[1].split('#')[0]);
            code = queryParams.get('code');
          }

          console.log('Tokens:', { access_token, refresh_token, code });

          if (code) {
            console.log('Using PKCE flow with code');
            const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);
            if (exchangeError) throw exchangeError;
            
            // Check if user has completed preferences
            await checkAndRedirect();
          } else if (access_token) {
            console.log('Using implicit flow with tokens');
            const { error: sessionError } = await supabase.auth.setSession({
              access_token,
              refresh_token,
            });
            if (sessionError) throw sessionError;
            
            // Check if user has completed preferences
            await checkAndRedirect();
          } else {
            throw new Error('No authentication tokens received');
          }
        } else if (result.type === 'cancel') {
          setError('Login cancelled');
        } else {
          console.log('Result type:', result.type);
          setError('Authentication failed. Please try again.');
        }
      }
    } catch (err) {
      console.error('Login error:', err);
      setError(err.message || 'Failed to sign in with Google');
    } finally {
      setIsLoading(false);
    }
  };

  const handlePhoneLogin = () => {
    router.push('/phone');
  };

  return (
    <GradientBackground>
      <View style={[styles.container, { paddingBottom: insets.bottom + spacing.xl }]}>
        <Animated.View
          style={styles.content}
          entering={FadeInUp.duration(800).delay(200)}
        >
          {/* Logo Section */}
          <View style={styles.logoSection}>
            <View style={styles.logoContainer}>
              <LogIn size={40} color={colors.primary} />
            </View>
            <Text style={styles.title}>Finesse</Text>
            <Text style={styles.subtitle}>Smart tracking for your finances</Text>
          </View>

          {/* Login Section */}
          <View style={styles.loginSection}>
            {error && (
              <View style={styles.errorContainer}>
                <Text style={styles.errorText}>{error}</Text>
              </View>
            )}

            <TouchableOpacity
              style={styles.googleButton}
              onPress={handleGoogleLogin}
              disabled={isLoading}
              activeOpacity={0.9}
            >
              {isLoading ? (
                <ActivityIndicator color={colors.background.dark} />
              ) : (
                <>
                  <Image
                    source={{ uri: 'https://www.gstatic.com/images/branding/product/1x/gsa_512dp.png' }}
                    style={styles.googleIcon}
                  />
                  <Text style={styles.googleButtonText}>Continue with Google</Text>
                </>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.phoneButton}
              onPress={handlePhoneLogin}
              disabled={isLoading}
            >
              <Text style={styles.phoneButtonText}>Continue with Phone Number</Text>
            </TouchableOpacity>
          </View>

          {/* Footer */}
          <View style={styles.footer}>
            <Text style={styles.footerText}>
              By continuing, you agree to our Terms of Service and Privacy Policy.
            </Text>
          </View>
        </Animated.View>
      </View>
    </GradientBackground>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: spacing.xl,
  },
  content: {
    flex: 1,
    justifyContent: 'space-between',
    paddingVertical: spacing.xxl,
  },
  logoSection: {
    alignItems: 'center',
    marginTop: spacing.xxl,
  },
  logoContainer: {
    width: 80,
    height: 80,
    borderRadius: 24,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.lg,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  title: {
    fontSize: fontSizes.xxl,
    fontWeight: '800',
    color: colors.text.primary,
    letterSpacing: 1,
  },
  subtitle: {
    fontSize: fontSizes.md,
    color: colors.text.secondary,
    marginTop: spacing.xs,
  },
  loginSection: {
    width: '100%',
    gap: spacing.md,
  },
  googleButton: {
    backgroundColor: '#FFFFFF',
    height: 56,
    borderRadius: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.md,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  googleIcon: {
    width: 24,
    height: 24,
    marginRight: spacing.sm,
  },
  googleButtonText: {
    fontSize: fontSizes.md,
    fontWeight: '600',
    color: '#000000',
  },
  phoneButton: {
    height: 56,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
  },
  phoneButtonText: {
    fontSize: fontSizes.md,
    fontWeight: '500',
    color: colors.text.primary,
  },
  errorContainer: {
    backgroundColor: 'rgba(248, 113, 113, 0.1)',
    padding: spacing.md,
    borderRadius: 12,
    marginBottom: spacing.sm,
    borderWidth: 1,
    borderColor: 'rgba(248, 113, 113, 0.2)',
  },
  errorText: {
    color: colors.status.error,
    fontSize: fontSizes.sm,
    textAlign: 'center',
  },
  footer: {
    alignItems: 'center',
  },
  footerText: {
    fontSize: fontSizes.xs,
    color: colors.text.tertiary,
    textAlign: 'center',
    lineHeight: 18,
  },
});