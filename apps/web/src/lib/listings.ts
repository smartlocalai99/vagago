import { createClient } from '@supabase/supabase-js';
import type { Database } from './database.types';
import { amenityArt } from './places';

type StayStyle = Database['public']['Enums']['stay_style'];

export type Photo = { full: string; thumb: string };
export type Room = {
  id: string; name: string; description: string; capacity: number; bedrooms: number; beds: string;
  rate: number; compareAt: number | null; // paise
};
export type Listing = {
  id: string; slug: string; name: string; tagline: string; description: string; style: StayStyle; area: string;
  // Rounded public position (about 100 m); the exact address is released with a booking.
  latitude: number; longitude: number;
  checkIn: string; checkOut: string; houseRules: string | null; cancellationPolicy: string | null;
  photos: Photo[]; amenities: string[]; rooms: Room[];
  rate: number; compareAt: number | null; capacity: number; bedrooms: number;
};
export type Place = { id: string; name: string; kind: string; latitude: number; longitude: number };

const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!;

// Server-side reads for pre-rendered pages: no session, public data only.
const db = () => createClient<Database>(url, key, { auth: { persistSession: false, autoRefreshToken: false } });

export const photoUrl = (path: string) => `${url}/storage/v1/object/public/property-photos/${path}`;
// Uploads store a 480px thumbnail beside each photo: <id>.webp -> <id>.thumb.webp
export const thumbUrl = (path: string) => photoUrl(path.replace(/\.(\w+)$/, '.thumb.$1'));

export const listingColumns = `id, slug, name, tagline, description, stay_style, area, approx_latitude, approx_longitude,
  check_in_time, check_out_time, house_rules, cancellation_policy,
  room_types (id, name, description, max_guests, bedrooms, beds, base_rate_paise, compare_at_paise, is_active, sort_order),
  property_photos (storage_path, sort_order),
  property_amenities (amenities (name))`;

type Row = {
  id: string; slug: string; name: string; tagline: string | null; description: string | null; stay_style: StayStyle; area: string;
  approx_latitude: number | null; approx_longitude: number | null; check_in_time: string; check_out_time: string;
  house_rules: string | null; cancellation_policy: string | null;
  room_types: { id: string; name: string; description: string | null; max_guests: number; bedrooms: number; beds: string | null;
    base_rate_paise: number; compare_at_paise: number | null; is_active: boolean; sort_order: number }[];
  property_photos: { storage_path: string; sort_order: number }[];
  property_amenities: { amenities: { name: string } | null }[];
};

const plural = (count: number, word: string) => `${count} ${word}${count === 1 ? '' : 's'}`;

export function toListing(row: Row): Listing | null {
  const rooms = row.room_types.filter((room) => room.is_active).sort((a, b) => a.sort_order - b.sort_order);
  if (!rooms.length) return null;
  const cheapest = rooms.reduce((low, room) => room.base_rate_paise < low.base_rate_paise ? room : low, rooms[0]);
  return {
    id: row.id, slug: row.slug, name: row.name, tagline: row.tagline ?? '', description: row.description ?? '',
    style: row.stay_style, area: row.area,
    latitude: Number(row.approx_latitude ?? 9.69), longitude: Number(row.approx_longitude ?? 76.91),
    checkIn: row.check_in_time.slice(0, 5), checkOut: row.check_out_time.slice(0, 5),
    houseRules: row.house_rules, cancellationPolicy: row.cancellation_policy,
    photos: [...row.property_photos].sort((a, b) => a.sort_order - b.sort_order)
      .map((photo) => ({ full: photoUrl(photo.storage_path), thumb: thumbUrl(photo.storage_path) })),
    amenities: row.property_amenities.flatMap((item) => item.amenities ? [item.amenities.name] : []),
    rooms: rooms.map((room) => ({
      id: room.id, name: room.name, capacity: room.max_guests, bedrooms: room.bedrooms,
      description: room.description ?? `${plural(room.bedrooms, 'bedroom')} for up to ${room.max_guests} guests.`,
      beds: room.beds ?? plural(room.bedrooms, 'bedroom'), rate: room.base_rate_paise, compareAt: room.compare_at_paise,
    })),
    rate: cheapest.base_rate_paise, compareAt: cheapest.compare_at_paise,
    capacity: Math.max(...rooms.map((room) => room.max_guests)), bedrooms: Math.max(...rooms.map((room) => room.bedrooms)),
  };
}

export async function fetchListings(): Promise<Listing[]> {
  const { data, error } = await db().from('properties').select(listingColumns).eq('status', 'published').order('published_at', { ascending: false });
  if (error) throw new Error(error.message);
  return (data as unknown as Row[]).flatMap((row) => toListing(row) ?? []);
}

export async function fetchListing(slug: string): Promise<Listing | null> {
  const { data, error } = await db().from('properties').select(listingColumns).eq('status', 'published').eq('slug', slug).maybeSingle();
  if (error) throw new Error(error.message);
  return data ? toListing(data as unknown as Row) : null;
}

export async function fetchSlugs(): Promise<string[]> {
  const { data, error } = await db().from('properties').select('slug').eq('status', 'published');
  if (error) throw new Error(error.message);
  return data.map((row) => row.slug);
}

export async function fetchPlaces(): Promise<Place[]> {
  const { data, error } = await db().from('attractions').select('slug, name, kind, latitude, longitude').eq('is_active', true).order('sort_order');
  if (error) throw new Error(error.message);
  return data.map((row) => ({ id: row.slug, name: row.name, kind: row.kind, latitude: Number(row.latitude), longitude: Number(row.longitude) }));
}

export const styleLabel: Record<StayStyle, string> = { villa: 'Villa', cottage: 'Cottage', homestay: 'Homestay', resort: 'Resort', hotel: 'Hotel' };

export function discountPercent(rate: number, compareAt: number | null) {
  return compareAt && compareAt > rate ? Math.round((1 - rate / compareAt) * 100) : 0;
}

// The amenities most often found at live stays, with how many stays offer each.
export async function fetchAmenityHighlights(listings: Listing[], limit = 5) {
  const { data, error } = await db().from('amenities').select('name, icon');
  if (error) throw new Error(error.message);
  return data.map((row) => ({ name: row.name, art: amenityArt(row.name, row.icon), stays: listings.filter((stay) => stay.amenities.includes(row.name)).length }))
    .filter((row) => row.stays > 0).sort((a, b) => b.stays - a.stays || a.name.localeCompare(b.name)).slice(0, limit);
}

export type GuestReview = {
  id: string; comment: string; author: string; stay: string | null;
  accommodation: number | null; connectivity: number | null; cleanliness: number | null; rating: number;
};

// The latest reviews an admin has published (guests write them after a completed stay).
export async function fetchPublishedReviews(limit = 8): Promise<GuestReview[]> {
  const { data, error } = await db().from('reviews')
    .select('id, rating, comment, author_name, accommodation_rating, connectivity_rating, cleanliness_rating, properties (name)')
    .eq('status', 'published').not('comment', 'is', null).order('created_at', { ascending: false }).limit(limit);
  if (error) throw new Error(error.message);
  return (data as unknown as { id: string; rating: number; comment: string; author_name: string | null; accommodation_rating: number | null; connectivity_rating: number | null; cleanliness_rating: number | null; properties: { name: string } | null }[])
    .map((row) => ({ id: row.id, comment: row.comment, author: row.author_name ?? 'VagaGo guest', stay: row.properties?.name ?? null,
      accommodation: row.accommodation_rating, connectivity: row.connectivity_rating, cleanliness: row.cleanliness_rating, rating: row.rating }));
}

// Flat fee the database adds to every booking (create_reservation), in paise.
export const bookingFeePaise = 24900;
