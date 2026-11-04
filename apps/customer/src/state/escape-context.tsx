import { createContext, use, useCallback, useMemo, useState, type ReactNode } from 'react';
import type { EscapeDraft } from '@/types';
import { createDefaultDraft, mergeEscapeDraft } from './storage-records';

export type BookingGuest = { fullName: string; mobile: string; email: string };
export type GuestErrors = Partial<Record<keyof BookingGuest, string>>;

export function validateBookingGuest(guest: BookingGuest): GuestErrors {
  const errors: GuestErrors = {};
  const name = guest.fullName.trim();
  if (name.length < 2 || name.length > 100 || !/\p{L}/u.test(name) || !/^[\p{L}\p{M} .’'-]+$/u.test(name)) errors.fullName = 'Enter the guest’s full name.';
  if (!/^[6-9]\d{9}$/.test(guest.mobile.replace(/[\s-]/g, ''))) errors.mobile = 'Enter a valid 10-digit Indian mobile number.';
  if (guest.email.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(guest.email.trim())) errors.email = 'Enter a valid email address or leave it blank.';
  return errors;
}

type EscapeState = {
  ready: boolean;
  draft: EscapeDraft;
  updateDraft: (patch: Partial<EscapeDraft>) => void;
  bookingGuest: BookingGuest;
  updateBookingGuest: (patch: Partial<BookingGuest>) => void;
  storageError: string | null;
  dismissStorageError: () => void;
};

const EscapeContext = createContext<EscapeState | null>(null);

export function EscapeProvider({ children }: { children: ReactNode }) {
  const [draft, setDraft] = useState<EscapeDraft>(() => createDefaultDraft());
  const [bookingGuest, setBookingGuest] = useState<BookingGuest>({ fullName: '', mobile: '', email: '' });
  // Booking details live only in this session. Legacy wishlist and plan records
  // remain untouched on disk, but are no longer loaded or written by the app.
  const updateDraft = useCallback((patch: Partial<EscapeDraft>) => {
    setDraft((previous) => mergeEscapeDraft(previous, patch));
  }, []);
  const updateBookingGuest = useCallback((patch: Partial<BookingGuest>) => {
    setBookingGuest((previous) => ({ ...previous, ...patch }));
  }, []);
  const dismissStorageError = useCallback(() => undefined, []);
  const value = useMemo(() => ({
    ready: true, draft, updateDraft, bookingGuest, updateBookingGuest,
    storageError: null, dismissStorageError,
  }), [draft, updateDraft, bookingGuest, updateBookingGuest, dismissStorageError]);
  return <EscapeContext value={value}>{children}</EscapeContext>;
}

export function useEscape(): EscapeState {
  const context = use(EscapeContext);
  if (!context) throw new Error('useEscape must be used within EscapeProvider.');
  return context;
}
