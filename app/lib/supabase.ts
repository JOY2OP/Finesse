//Basically a helper file that exports supabase client using project URL and Public anon key
import { createClient } from '@supabase/supabase-js';
import AsyncStorage from '@react-native-async-storage/async-storage'
import { AppState, Platform } from 'react-native'

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn('Supabase credentials not found in environment variables');
}

// Simple in-memory storage for web-first apps
const memoryStorage = {
  getItem: (key: string) => {
    if (typeof window !== 'undefined') {
      return window.localStorage?.getItem(key) || null;
    }
    return null;
  },
  setItem: (key: string, value: string) => {
    if (typeof window !== 'undefined') {
      window.localStorage?.setItem(key, value);
    }
  },
  removeItem: (key: string) => {
    if (typeof window !== 'undefined') {
      window.localStorage?.removeItem(key);
    }
  },
};

export const supabase = supabaseUrl && supabaseAnonKey &&  Platform.OS !== 'web'
  ? createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        storage: AsyncStorage,
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: false,
      },
    })
  : console.log("client is null");

if (Platform.OS !== "web") {
  AppState.addEventListener('change', (state) => {
    if (state === 'active') {
      supabase.auth.startAutoRefresh()
    } else {
      supabase.auth.stopAutoRefresh()
    }
  })
}
// Default export for Expo Router compatibility
export default function SupabaseConfig() {
  return null;
}