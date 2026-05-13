import { useSMSTransactions } from '@/app/features/sms';
import { colors } from '@/constants/theme';
import { Tabs } from 'expo-router';
import { BarChart3, Home, Receipt, User } from 'lucide-react-native';
import { useEffect } from 'react';
import { Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function TabLayout() {
  const insets = useSafeAreaInsets();
  const { hasPermission, requestPermissions } = useSMSTransactions();

  // Request permissions on first load (after login)
  useEffect(() => {
    if (Platform.OS !== 'android') return;
    // Trigger when null (not yet checked) or false (denied)
    if (hasPermission === true) return;

    const timer = setTimeout(() => {
      console.log('[TabLayout] Requesting SMS and notification permissions...');
      requestPermissions();
    }, 1000);

    return () => clearTimeout(timer);
  }, [hasPermission, requestPermissions]);
  
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: 'rgba(255, 255, 255, 0.95)',
          borderTopWidth: 1,
          borderTopColor: '#E2E8F0',
          height: 65 + insets.bottom,
          paddingBottom: insets.bottom,
          paddingTop: 12,
          elevation: 0,
          shadowOpacity: 0,
        },
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: '#94A3B8',
        tabBarLabelStyle: {
          fontSize: 10,
          fontWeight: '700',
          marginTop: 4,
          textTransform: 'uppercase',
          letterSpacing: 0.5,
        },
      }}>
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
          tabBarIcon: ({ color, size }) => (
            <Home size={20} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="activity"
        options={{
          title: 'Activity',
          tabBarIcon: ({ color, size }) => (
            <Receipt size={20} color={color} />
          ),
          href: null,
        }}
      />
      <Tabs.Screen
        name="budget"
        options={{
          title: 'Budget',
          tabBarIcon: ({ color, size }) => (
            <BarChart3 size={20} color={color} />
          ),
          href: null,
        }}
      />
      <Tabs.Screen
        name="coach"
        options={{
          title: 'Coach',
          tabBarIcon: ({ color, size }) => (
            <BarChart3 size={20} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          tabBarIcon: ({ color, size }) => (
            <User size={20} color={color} />
          ),
          href: null,
        }}
      />
      <Tabs.Screen
        name="chat"
        options={{
          href: null,
        }}
      />
    </Tabs>
  );
}
