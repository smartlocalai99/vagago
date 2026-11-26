import { createContext, use, useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { readCache, writeCache } from '@/lib/cache';
import { supabase } from '@/lib/supabase';
import type { BookingGuest } from './escape-context';

export type BookingStatus = 'confirmed' | 'checked_in' | 'completed' | 'cancelled' | 'no_show';
export type Booking = {
  id: string;
  reference: string;
  stayId: string;
  roomOptionId: string;
  checkIn: string;
  checkOut: string;
  guests: number;
  nights: number;
  total: number;
  discount: number;
  offerCode: string | null;
  guest: BookingGuest;
  status: BookingStatus;
  createdAt: string;
};
export type NewBooking = {
  roomOptionId: string;
  checkIn: string;
  checkOut: string;
  guests: number;
  guest: BookingGuest;
  offerCode?: string | null;
};
export type ExactAddress = {
  addressLine: string;
  city: string;
  state: string;
  postalCode: string;
  latitude: number;
  longitude: number;
  arrivalInstructions: string | null;
  contactPhone: string | null;
};

type BookingsState = {
  ready: boolean;
  bookings: Booking[];
  createBooking: (booking: NewBooking) => Promise<Booking>;
  cancelBooking: (id: string) => Promise<void>;
  refresh: () => Promise<void>;
  getAddress: (id: string) => Promise<ExactAddress | null>;
};

const BookingsContext = createContext<BookingsState | null>(null);
const cacheKey = '@vagago/reservations:v2';
const addressKey = '@vagago/addresses:v1';
// Bookings only change when the guest or the property acts, so refetch at most once a minute.
const minRefreshMs = 60 * 1000;
const columns = 'id, reference, property_id, room_type_id, check_in, check_out, guests, nights, total_paise, discount_paise, offer_code, guest_name, guest_phone, guest_email, status, created_at';

type ReservationRow = {
  id: string; reference: string; property_id: string; room_type_id: string; check_in: string; check_out: string;
  guests: number; nights: number | null; total_paise: number; discount_paise: number | null; offer_code: string | null; guest_name: string; guest_phone: string; guest_email: string | null;
  status: BookingStatus; created_at: string;
};

function toBooking(row: ReservationRow): Booking {
  return {
    id: row.id, reference: row.reference, stayId: row.property_id, roomOptionId: row.room_type_id,
    checkIn: row.check_in, checkOut: row.check_out, guests: row.guests, nights: row.nights ?? 0, total: row.total_paise / 100,
    discount: (row.discount_paise ?? 0) / 100, offerCode: row.offer_code ?? null,
    guest: { fullName: row.guest_name, mobile: row.guest_phone, email: row.guest_email ?? '' },
    status: row.status, createdAt: row.created_at,
  };
}

const friendlyErrors: Record<string, string> = {
  'Sold out for these dates': 'This stay is already booked for these dates. Try different dates.',
  'This stay is not available': 'This stay is no longer available.',
};

function bookingError(message: string) {
  const known = Object.keys(friendlyErrors).find((key) => message.includes(key));
  if (known) return friendlyErrors[known];
  if (/fits up to|past|one year ahead|1 to 30 nights|offer/i.test(message)) return message;
  return 'Couldn’t confirm your booking. Check your connection and try again.';
}

// Guests book without creating an account: the first booking signs this device in anonymously.
async function ensureSession() {
  const { data } = await supabase.auth.getSession();
  if (data.session) return data.session.user.id;
  const { data: signIn, error } = await supabase.auth.signInAnonymously();
  if (error || !signIn.user) throw new Error('Booking is unavailable right now. Please try again later.');
  return signIn.user.id;
}

export function BookingsProvider({ children }: { children: ReactNode }) {
  const [ready, setReady] = useState(false);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const fetchedAt = useRef(0);
  const inFlight = useRef<Promise<void> | null>(null);
  const addresses = useRef<Record<string, ExactAddress>>({});

  const save = useCallback((next: Booking[]) => {
    setBookings(next);
    writeCache(cacheKey, next);
  }, []);

  const fetchBookings = useCallback(async (force = false) => {
    if (!force && Date.now() - fetchedAt.current < minRefreshMs) return;
    inFlight.current ??= (async () => {
      const { data: session } = await supabase.auth.getSession();
      // No session means this device has never booked: nothing to fetch.
      if (!session.session) return;
      const { data, error } = await supabase.from('reservations').select(columns).order('check_in', { ascending: true });
      if (!error && data) {
        fetchedAt.current = Date.now();
        save((data as ReservationRow[]).map(toBooking));
      }
    })().finally(() => { inFlight.current = null; });
    return inFlight.current;
  }, [save]);

  useEffect(() => {
    void Promise.all([readCache<Booking[]>(cacheKey), readCache<Record<string, ExactAddress>>(addressKey)]).then(([cached, cachedAddresses]) => {
      if (cached) setBookings(cached.value);
      if (cachedAddresses) addresses.current = cachedAddresses.value;
      setReady(true);
      void fetchBookings(true);
    });
  }, [fetchBookings]);

  const createBooking = useCallback(async (input: NewBooking) => {
    await ensureSession();
    const { data, error } = await supabase.rpc('create_reservation', {
      p_room_type_id: input.roomOptionId, p_check_in: input.checkIn, p_check_out: input.checkOut, p_guests: input.guests,
      p_guest_name: input.guest.fullName, p_guest_phone: input.guest.mobile, p_guest_email: input.guest.email || undefined,
      p_offer_code: input.offerCode ?? undefined,
    });
    if (error || !data) throw new Error(bookingError(error?.message ?? ''));
    const booking = toBooking(data as unknown as ReservationRow);
    setBookings((previous) => {
      const next = [...previous, booking].sort((a, b) => a.checkIn.localeCompare(b.checkIn));
      writeCache(cacheKey, next);
      return next;
    });
    return booking;
  }, []);

  const cancelBooking = useCallback(async (id: string) => {
    const { data, error } = await supabase.rpc('cancel_reservation', { p_reservation_id: id });
    if (error || !data) throw new Error('Couldn’t cancel this booking. Please try again.');
    const updated = toBooking(data as unknown as ReservationRow);
    setBookings((previous) => {
      const next = previous.map((booking) => booking.id === id ? updated : booking);
      writeCache(cacheKey, next);
      return next;
    });
  }, []);

  // Exact addresses rarely change, so each is fetched once and kept on the device.
  const getAddress = useCallback(async (id: string) => {
    if (addresses.current[id]) return addresses.current[id];
    const { data, error } = await supabase.rpc('reservation_location', { p_reservation_id: id });
    const row = !error && Array.isArray(data) ? data[0] : null;
    if (!row) return null;
    const address: ExactAddress = {
      addressLine: row.address_line, city: row.city, state: row.state, postalCode: row.postal_code,
      latitude: Number(row.latitude), longitude: Number(row.longitude),
      arrivalInstructions: row.arrival_instructions, contactPhone: row.contact_phone,
    };
    addresses.current = { ...addresses.current, [id]: address };
    writeCache(addressKey, addresses.current);
    return address;
  }, []);

  const refresh = useCallback(() => fetchBookings(false), [fetchBookings]);
  const value = useMemo(() => ({ ready, bookings, createBooking, cancelBooking, refresh, getAddress }),
    [ready, bookings, createBooking, cancelBooking, refresh, getAddress]);
  return <BookingsContext value={value}>{children}</BookingsContext>;
}

export function useBookings(): BookingsState {
  const context = use(BookingsContext);
  if (!context) throw new Error('useBookings must be used within BookingsProvider.');
  return context;
}
