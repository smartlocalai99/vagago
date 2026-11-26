import { createContext, use, useCallback, useEffect, useMemo, useState, type ReactNode } from 'react';
import * as LocalAuthentication from 'expo-local-authentication';
import * as SecureStore from 'expo-secure-store';
import { supabase } from '@/lib/supabase';
import { useEscape } from './escape-context';

// lock: the guest chose Face ID, fingerprint or the screen lock as their way to log back in.
export type Account = { name: string; mobile: string; lock: boolean; since: string; signedIn: boolean };

type AccountState = {
  ready: boolean;
  // The signed-in guest, or null.
  account: Account | null;
  // Details kept after logging out with a lock, so the guest can log back in with one tap.
  saved: Account | null;
  canLock: boolean;
  signUp: (details: { name: string; mobile: string; lock: boolean }) => Promise<string | null>;
  // True when this mobile number is the account saved on this phone.
  isSavedNumber: (mobile: string) => boolean;
  logInSaved: () => Promise<string | null>;
  setLock: (lock: boolean) => Promise<void>;
  forgetSaved: () => Promise<void>;
  logout: () => Promise<void>;
  deleteAccount: () => Promise<string | null>;
};

const AccountContext = createContext<AccountState | null>(null);
// Stored in the iOS Keychain / Android Keystore. Signed in until the guest logs out.
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

const persist = (account: Account) => SecureStore.setItemAsync(storageKey, JSON.stringify(account));

export function AccountProvider({ children }: { children: ReactNode }) {
  const { updateBookingGuest } = useEscape();
  const [ready, setReady] = useState(false);
  const [stored, setStored] = useState<Account | null>(null);
  const [canLock, setCanLock] = useState(false);

  useEffect(() => {
    void Promise.all([
      SecureStore.getItemAsync(storageKey).catch(() => null),
      Promise.all([LocalAuthentication.hasHardwareAsync(), LocalAuthentication.getEnrolledLevelAsync()])
        .then(([hardware, level]) => hardware || level !== LocalAuthentication.SecurityLevel.NONE).catch(() => false),
    ]).then(([raw, lockAvailable]) => {
      const parsed = raw ? { signedIn: true, ...JSON.parse(raw) } as Account : null;
      setStored(parsed);
      setCanLock(lockAvailable);
      if (parsed?.signedIn) updateBookingGuest({ fullName: parsed.name, mobile: parsed.mobile });
      setReady(true);
    });
  }, [updateBookingGuest]);

  const signIn = useCallback(async (next: Account) => {
    await persist(next);
    setStored(next);
    updateBookingGuest({ fullName: next.name, mobile: next.mobile });
    // Bookings belong to this phone's guest session; keep its profile in step (best effort).
    void (async () => {
      let { data } = await supabase.auth.getSession();
      if (!data.session) {
        await supabase.auth.signInAnonymously();
        data = (await supabase.auth.getSession()).data;
      }
      const userId = data.session?.user.id;
      if (userId) await supabase.from('profiles').update({ full_name: next.name, phone: next.mobile }).eq('id', userId);
    })().catch(() => undefined);
  }, [updateBookingGuest]);

  const signUp = useCallback(async ({ name, mobile, lock }: { name: string; mobile: string; lock: boolean }) => {
    const problem = validateAccount(name, mobile);
    if (problem) return problem;
    // Confirm once that the owner can unlock, since this becomes their way back in.
    if (lock && !await verifyOwner('Use Face ID or your screen lock to log in to VagaGo')) return 'Face ID or screen lock was not confirmed.';
    await signIn({ name: name.trim(), mobile: mobile.replace(/[\s-]/g, ''), lock, since: new Date().toISOString(), signedIn: true });
    return null;
  }, [signIn]);

  const isSavedNumber = useCallback((mobile: string) => Boolean(stored && stored.mobile === mobile.replace(/[\s-]/g, '')), [stored]);

  // Returning guest: Face ID, fingerprint or the screen lock confirms it is them.
  const logInSaved = useCallback(async () => {
    if (!stored) return 'No saved account on this phone.';
    if (stored.lock && !await verifyOwner(`Log in as ${stored.name}`)) return 'Face ID or screen lock was not confirmed.';
    await signIn({ ...stored, signedIn: true });
    return null;
  }, [signIn, stored]);

  const setLock = useCallback(async (lock: boolean) => {
    if (!stored) return;
    if (lock && !await verifyOwner('Use Face ID or your screen lock to log in to VagaGo')) return;
    const next = { ...stored, lock };
    await persist(next);
    setStored(next);
  }, [stored]);

  const forgetSaved = useCallback(async () => {
    await SecureStore.deleteItemAsync(storageKey);
    setStored(null);
  }, []);

  // The account stays saved on this phone, so entering the same number logs straight back in.
  // The phone's guest session is kept, so bookings made here come back too.
  const logout = useCallback(async () => {
    if (!stored) return;
    const next = { ...stored, signedIn: false };
    await persist(next);
    setStored(next);
    updateBookingGuest({ fullName: '', mobile: '' });
  }, [stored, updateBookingGuest]);

  const deleteAccount = useCallback(async () => {
    const { data } = await supabase.auth.getSession();
    if (data.session) {
      const { error } = await supabase.rpc('delete_my_account');
      if (error) return 'Couldn’t delete your account. Check your connection and try again.';
      await supabase.auth.signOut();
    }
    await forgetSaved();
    updateBookingGuest({ fullName: '', mobile: '', email: '' });
    return null;
  }, [forgetSaved, updateBookingGuest]);

  const account = stored?.signedIn ? stored : null;
  const saved = stored && !stored.signedIn ? stored : null;
  const value = useMemo(() => ({ ready, account, saved, canLock, signUp, isSavedNumber, logInSaved, setLock, forgetSaved, logout, deleteAccount }),
    [ready, account, saved, canLock, signUp, isSavedNumber, logInSaved, setLock, forgetSaved, logout, deleteAccount]);
  return <AccountContext value={value}>{children}</AccountContext>;
}

export function useAccount() {
  const context = use(AccountContext);
  if (!context) throw new Error('useAccount must be used within AccountProvider.');
  return context;
}
