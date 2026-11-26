import { createContext, use, useCallback, useEffect, useMemo, useState, type ReactNode } from 'react';
import * as LocalAuthentication from 'expo-local-authentication';
import * as SecureStore from 'expo-secure-store';
import { supabase } from '@/lib/supabase';
import { useEscape } from './escape-context';

export type Account = { name: string; mobile: string; lock: boolean; since: string };

type AccountState = {
  ready: boolean;
  account: Account | null;
  // False until Face ID or the screen lock has been passed in this app session (when the lock is on).
  unlocked: boolean;
  login: (details: { name: string; mobile: string; lock: boolean }) => Promise<string | null>;
  unlock: () => Promise<boolean>;
  logout: () => Promise<void>;
  canLock: boolean;
};

const AccountContext = createContext<AccountState | null>(null);
// Stored in the iOS Keychain / Android Keystore. It stays until the guest logs out.
const storageKey = 'vagago.account.v1';

export function validateAccount(name: string, mobile: string) {
  if (name.trim().length < 2 || !/\p{L}/u.test(name)) return 'Enter your full name.';
  if (!/^[6-9]\d{9}$/.test(mobile.replace(/[\s-]/g, ''))) return 'Enter a valid 10-digit Indian mobile number.';
  return null;
}

async function verifyOwner(reason: string) {
  const result = await LocalAuthentication.authenticateAsync({ promptMessage: reason, cancelLabel: 'Cancel', disableDeviceFallback: false });
  return result.success;
}

export function AccountProvider({ children }: { children: ReactNode }) {
  const { updateBookingGuest } = useEscape();
  const [ready, setReady] = useState(false);
  const [account, setAccount] = useState<Account | null>(null);
  const [unlocked, setUnlocked] = useState(false);
  const [canLock, setCanLock] = useState(false);

  useEffect(() => {
    void Promise.all([
      SecureStore.getItemAsync(storageKey).catch(() => null),
      Promise.all([LocalAuthentication.hasHardwareAsync(), LocalAuthentication.getEnrolledLevelAsync()])
        .then(([hardware, level]) => hardware || level !== LocalAuthentication.SecurityLevel.NONE).catch(() => false),
    ]).then(([saved, lockAvailable]) => {
      const parsed = saved ? JSON.parse(saved) as Account : null;
      setAccount(parsed);
      setUnlocked(!parsed?.lock);
      setCanLock(lockAvailable);
      if (parsed) updateBookingGuest({ fullName: parsed.name, mobile: parsed.mobile });
      setReady(true);
    });
  }, [updateBookingGuest]);

  const login = useCallback(async ({ name, mobile, lock }: { name: string; mobile: string; lock: boolean }) => {
    const problem = validateAccount(name, mobile);
    if (problem) return problem;
    if (lock && !await verifyOwner('Turn on Face ID or screen lock for VagaGo')) return 'Face ID or screen lock was not confirmed.';
    const next: Account = { name: name.trim(), mobile: mobile.replace(/[\s-]/g, ''), lock, since: new Date().toISOString() };
    await SecureStore.setItemAsync(storageKey, JSON.stringify(next));
    setAccount(next);
    setUnlocked(true);
    updateBookingGuest({ fullName: next.name, mobile: next.mobile });
    // Bookings belong to this phone's guest session; keep its profile in step (best effort).
    void (async () => {
      let { data } = await supabase.auth.getSession();
      if (!data.session) await supabase.auth.signInAnonymously().then(async () => { data = (await supabase.auth.getSession()).data; });
      const userId = data.session?.user.id;
      if (userId) await supabase.from('profiles').update({ full_name: next.name, phone: next.mobile }).eq('id', userId);
    })().catch(() => undefined);
    return null;
  }, [updateBookingGuest]);

  const unlock = useCallback(async () => {
    const ok = await verifyOwner('Unlock VagaGo');
    if (ok) setUnlocked(true);
    return ok;
  }, []);

  // Logging out forgets the profile on this phone. The phone's guest session is kept, so
  // bookings made here come back when the guest logs in again.
  const logout = useCallback(async () => {
    await SecureStore.deleteItemAsync(storageKey);
    setAccount(null);
    setUnlocked(false);
    updateBookingGuest({ fullName: '', mobile: '' });
  }, [updateBookingGuest]);

  const value = useMemo(() => ({ ready, account, unlocked, login, unlock, logout, canLock }), [ready, account, unlocked, login, unlock, logout, canLock]);
  return <AccountContext value={value}>{children}</AccountContext>;
}

export function useAccount() {
  const context = use(AccountContext);
  if (!context) throw new Error('useAccount must be used within AccountProvider.');
  return context;
}
