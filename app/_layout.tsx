import { useFrameworkReady } from '@/hooks/useFrameworkReady';
import 'expo-dev-client';
import { Redirect, Stack, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useState } from 'react';
import { supabase } from './lib/supabase';
import { Session } from '@supabase/supabase-js';

export default function RootLayout() {
  useFrameworkReady();
  const [session, setSession] = useState<Session | null>(null);
  const [initialized, setInitialized] = useState(false);
  const segments = useSegments();

  useEffect(() => {
    if (!supabase) return;

    supabase.auth.getSession().then(({ data: { session: s } }) => {
      setSession(s);
      setInitialized(true);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, s) => {
      setSession(s);
    });

    return () => subscription.unsubscribe();
  }, []);

  if (!initialized) {
    return null;
  }

  const inAuthGroup = segments[0] === '(auth)';

  return (
    <>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="(auth)" options={{ headerShown: false }} />
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="+not-found" />
      </Stack>
      {!session && !inAuthGroup && <Redirect href="/login" />}
      {session && inAuthGroup && <Redirect href="/" />}
      <StatusBar style="light" />
    </>
  );
}