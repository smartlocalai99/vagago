import AsyncStorage from '@react-native-async-storage/async-storage';
import { createContext, use, useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import type { BookingGuest } from './escape-context';

export type Booking = {
  id: string;
  reference: string;
  stayId: string;
  roomOptionId: string;
  checkIn: string;
  checkOut: string;
  guests: number;
  nights: number;
  subtotal: number;
  guest: BookingGuest;
  status: 'confirmed' | 'cancelled';
  createdAt: string;
};
export type NewBooking = Omit<Booking, 'id' | 'reference' | 'status' | 'createdAt'>;

type BookingsState = {
  ready: boolean;
  bookings: Booking[];
  createBooking: (booking: NewBooking) => Booking;
  cancelBooking: (id: string) => void;
};

const BookingsContext = createContext<BookingsState | null>(null);
const bookingsKey = '@vagago/bookings:v1';

function isBooking(value: unknown): value is Booking {
  const record = value as Booking | null;
  return Boolean(record && typeof record.id === 'string' && typeof record.stayId === 'string'
    && typeof record.checkIn === 'string' && typeof record.checkOut === 'string'
    && (record.status === 'confirmed' || record.status === 'cancelled'));
}

function makeReference() {
  const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  return `VG-${Array.from({ length: 6 }, () => alphabet[Math.floor(Math.random() * alphabet.length)]).join('')}`;
}

export function BookingsProvider({ children }: { children: ReactNode }) {
  const [ready, setReady] = useState(false);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const loaded = useRef(false);

  useEffect(() => {
    let mounted = true;
    AsyncStorage.getItem(bookingsKey).then((raw) => {
      const parsed: unknown = raw ? JSON.parse(raw) : [];
      if (mounted && Array.isArray(parsed)) setBookings(parsed.filter(isBooking));
    }).catch(() => {
      // Start with an empty list if saved bookings cannot be read.
    }).finally(() => {
      loaded.current = true;
      if (mounted) setReady(true);
    });
    return () => { mounted = false; };
  }, []);

  useEffect(() => {
    if (!loaded.current) return;
    void AsyncStorage.setItem(bookingsKey, JSON.stringify(bookings)).catch(() => undefined);
  }, [bookings]);

  const createBooking = useCallback((input: NewBooking) => {
    const booking: Booking = {
      ...input,
      id: `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`,
      reference: makeReference(),
      status: 'confirmed',
      createdAt: new Date().toISOString(),
    };
    setBookings((previous) => [booking, ...previous]);
    return booking;
  }, []);

  const cancelBooking = useCallback((id: string) => {
    setBookings((previous) => previous.map((booking) => booking.id === id ? { ...booking, status: 'cancelled' } : booking));
  }, []);

  const value = useMemo(() => ({ ready, bookings, createBooking, cancelBooking }), [ready, bookings, createBooking, cancelBooking]);
  return <BookingsContext value={value}>{children}</BookingsContext>;
}

export function useBookings(): BookingsState {
  const context = use(BookingsContext);
  if (!context) throw new Error('useBookings must be used within BookingsProvider.');
  return context;
}
