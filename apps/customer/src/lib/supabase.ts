import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from '@supabase/supabase-js';
import { AppState } from 'react-native';
import type { Database } from './database.types';

// Public client values (the publishable key is meant to ship in apps; RLS protects the data).
// The defaults keep every build and over-the-air update working even when no env file is loaded.
const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL || 'https://rjdnsyhvemywztlngqvs.supabase.co';
const supabasePublishableKey = process.env.EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY || 'sb_publishable_mg5VGqHTS1DW-_DkgdxpOQ_ZNdx3w6r';

export const supabase = createClient<Database>(supabaseUrl, supabasePublishableKey, {
  auth: {
    // AsyncStorage touches `window` during static web rendering; sessions only persist on device/browser.
    storage: typeof window === 'undefined' ? undefined : AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});

// Refresh sessions only while the app is in the foreground.
if (process.env.EXPO_OS !== 'web') {
  AppState.addEventListener('change', (state) => {
    if (state === 'active') supabase.auth.startAutoRefresh();
    else supabase.auth.stopAutoRefresh();
  });
}
