import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import type { Database } from './database.types';

let client: SupabaseClient<Database> | null = null;

// Guests book without an account, exactly like the app: the first booking signs this browser
// in anonymously. Created on first use so pages that only browse never start a session.
export function guest() {
  client ??= createClient<Database>(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!, {
    auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: false, storageKey: 'vagago-guest-auth' },
  });
  return client;
}

export async function hasGuestSession() {
  const { data } = await guest().auth.getSession();
  return Boolean(data.session);
}

export async function ensureGuest() {
  if (await hasGuestSession()) return;
  const { error } = await guest().auth.signInAnonymously();
  if (error) throw new Error('Booking is unavailable right now. Please try again later.');
}

const friendly: Record<string, string> = {
  'Sold out for these dates': 'This stay is already booked for these dates. Try different dates.',
  'This stay is not available': 'This stay is no longer available.',
};

export function bookingError(message: string) {
  const known = Object.keys(friendly).find((text) => message.includes(text));
  if (known) return friendly[known];
  if (/unavailable right now|fits up to|past|one year ahead|1 to 30 nights/i.test(message)) return message;
  return 'Couldn’t confirm your booking. Check your connection and try again.';
}

export type Trip = Pick<Database['public']['Tables']['reservations']['Row'],
  'id' | 'reference' | 'property_id' | 'room_type_id' | 'check_in' | 'check_out' | 'nights' | 'guests' | 'total_paise' | 'status' | 'guest_name' | 'guest_phone' | 'created_at'>
  & { properties: { name: string; slug: string; area: string; property_photos: { storage_path: string; sort_order: number }[] } | null };

export const tripColumns = 'id, reference, property_id, room_type_id, check_in, check_out, nights, guests, total_paise, status, guest_name, guest_phone, created_at, properties (name, slug, area, property_photos (storage_path, sort_order))';
