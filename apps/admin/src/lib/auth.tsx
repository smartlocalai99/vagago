import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import type { Session } from '@supabase/supabase-js';
import { supabase } from './supabase';

// Admins sign in with a short username and a 4-digit PIN. Supabase needs an email and a
// longer password, so both are expanded the same way the accounts were created.
const adminDomain = 'admin.vagago.app';
const toEmail = (username: string) => `${username.trim().toLowerCase()}@${adminDomain}`;
const toPassword = (pin: string) => `vagago-admin-pin-${pin}`;
const adminCacheKey = 'vagago-admin-verified';

type AuthState = {
  status: 'loading' | 'signed-out' | 'signed-in';
  session: Session | null;
  username: string;
  signIn: (username: string, pin: string) => Promise<string | null>;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthState | null>(null);

async function isPlatformAdmin(userId: string) {
  // Checked once per account on this device instead of on every page load.
  if (typeof window !== 'undefined' && localStorage.getItem(adminCacheKey) === userId) return true;
  const { data } = await supabase.from('platform_admins').select('user_id').eq('user_id', userId).maybeSingle();
  if (data) localStorage.setItem(adminCacheKey, userId);
  return Boolean(data);
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [status, setStatus] = useState<AuthState['status']>('loading');

  useEffect(() => {
    void supabase.auth.getSession().then(async ({ data }) => {
      const current = data.session;
      if (current && await isPlatformAdmin(current.user.id)) {
        setSession(current);
        setStatus('signed-in');
      } else {
        setStatus('signed-out');
      }
    });
    const { data } = supabase.auth.onAuthStateChange((event, next) => {
      if (event === 'SIGNED_OUT') {
        setSession(null);
        setStatus('signed-out');
      } else if (event === 'TOKEN_REFRESHED' && next) {
        setSession(next);
      }
    });
    return () => data.subscription.unsubscribe();
  }, []);

  const signIn = useCallback(async (username: string, pin: string) => {
    if (!/^[a-z0-9._-]{2,32}$/i.test(username.trim())) return 'Enter your admin username.';
    if (!/^\d{4}$/.test(pin)) return 'Enter your 4-digit PIN.';
    const { data, error } = await supabase.auth.signInWithPassword({ email: toEmail(username), password: toPassword(pin) });
    if (error || !data.session) {
      return error?.status === 429 ? 'Too many attempts. Wait a few minutes and try again.' : 'Wrong username or PIN.';
    }
    if (!await isPlatformAdmin(data.session.user.id)) {
      await supabase.auth.signOut();
      return 'This account doesn’t have admin access.';
    }
    setSession(data.session);
    setStatus('signed-in');
    return null;
  }, []);

  const signOut = useCallback(async () => {
    localStorage.removeItem(adminCacheKey);
    await supabase.auth.signOut();
  }, []);

  const username = session?.user.email?.split('@')[0] ?? '';
  const value = useMemo(() => ({ status, session, username, signIn, signOut }), [status, session, username, signIn, signOut]);
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider.');
  return context;
}
