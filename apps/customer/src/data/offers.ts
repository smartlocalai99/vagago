import { getTodayInKolkata } from '@vagago/domain';
import type { Booking } from '@/state/bookings-context';

export type Offer = { code: string; percent: number; title: string; line: string; kind: 'welcome' | 'month' };

// The database accepts WELCOME12 on a guest's first booking and <MON>10 during that month.
export const welcomeOffer: Offer = {
  code: 'WELCOME12', percent: 12, kind: 'welcome',
  title: 'First stay, 12% off', line: 'New to VagaGo? Your first booking comes with 12% off.',
};

const monthly: [string, string, string][] = [
  ['JAN', 'Brrr-illiant January', 'Mist, blankets and hot chai. Beat the cold for less.'],
  ['FEB', 'Fab-ruary Getaway', 'Short month, sweet escape. Bring someone special.'],
  ['MAR', 'March Mist-ery', 'The hills keep their secrets. You keep the savings.'],
  ['APR', 'April Cool-ing Off', 'Swap the city heat for pine-scented breezes.'],
  ['MAY', 'May-cation Mode', 'Summer holidays, sorted. The meadows are waiting.'],
  ['JUN', 'Monsoon June Swoon', 'First rains, green everything, cosy evenings in.'],
  ['JUL', 'Jul-ly Good Rains', 'Waterfalls at full roar. Umbrellas optional.'],
  ['AUG', 'Aug-some August', 'Onam season, festive hills and more to explore.'],
  ['SEP', 'Sept-ember Snooze', 'Slow mornings, quiet trails, zero alarms.'],
  ['OCT', 'Oct-ober Cosy Fest', 'Clear skies, crisp air and bonfire nights.'],
  ['NOV', 'Snooze-vember', 'Sleep in, wake up to mist. Hibernation, but scenic.'],
  ['DEC', 'Dec the Hills', 'Holiday season in the hills, with a little less on the bill.'],
];

export function monthOffer(today = getTodayInKolkata()): Offer {
  const [month, title, line] = monthly[Number(today.slice(5, 7)) - 1];
  return { code: `${month}10`, percent: 10, kind: 'month', title, line };
}

// First-stay offer only while the guest has no active or past (non-cancelled) booking.
export const isFirstStay = (bookings: Booking[]) => !bookings.some((booking) => booking.status !== 'cancelled');

export function availableOffers(bookings: Booking[]): Offer[] {
  return isFirstStay(bookings) ? [welcomeOffer, monthOffer()] : [monthOffer()];
}

export const discountFor = (amount: number, offer: Offer | null) => offer ? Math.round(amount * offer.percent / 100) : 0;

// Flat fee the database adds to every booking (create_reservation), in rupees.
export const bookingFee = 100;
