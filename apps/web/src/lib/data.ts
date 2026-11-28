import useSWR, { mutate, type SWRConfiguration } from 'swr';
import type { Database } from './database.types';
import { compressPhoto, thumbPath } from './image';
import { supabase } from './supabase';
import { todayInIndia } from './format';

type Tables = Database['public']['Tables'];
export type PropertyRow = Tables['properties']['Row'];
export type LocationRow = Tables['property_locations']['Row'];
export type RoomRow = Tables['room_types']['Row'];
export type PhotoRow = Tables['property_photos']['Row'];
export type AmenityRow = Tables['amenities']['Row'];
export type ReservationRow = Tables['reservations']['Row'];
export type PropertyStatus = Database['public']['Enums']['property_status'];
export type ReservationStatus = Database['public']['Enums']['reservation_status'];

// Data is only refetched when something tells us it changed (a save here, or a realtime
// event), never on focus or on a timer. Each list is one request.
export const swrConfig: SWRConfiguration = {
  revalidateOnFocus: false,
  revalidateIfStale: false,
  revalidateOnReconnect: true,
  dedupingInterval: 60_000,
  shouldRetryOnError: false,
};

function unwrap<T>({ data, error }: { data: T; error: { message: string } | null }): NonNullable<T> {
  if (error) throw new Error(error.message);
  return data as NonNullable<T>;
}

// ---------- Hotels ----------
export type PropertySummary = Pick<PropertyRow, 'id' | 'name' | 'status' | 'stay_style' | 'area' | 'created_at'> & {
  property_photos: Pick<PhotoRow, 'storage_path'>[];
  room_types: { count: number }[];
};

export function useProperties() {
  return useSWR('properties', async () => unwrap(await supabase.from('properties')
    .select('id, name, status, stay_style, area, created_at, property_photos(storage_path), room_types(count)')
    .order('sort_order', { referencedTable: 'property_photos' })
    .limit(1, { referencedTable: 'property_photos' })
    .order('created_at', { ascending: false })) as unknown as PropertySummary[]);
}

export type PropertyDetail = PropertyRow & {
  property_locations: LocationRow | null;
  room_types: RoomRow[];
  property_photos: PhotoRow[];
  property_amenities: { amenity_id: string }[];
};

export function useProperty(id: string | undefined) {
  return useSWR(id ? ['property', id] : null, async () => {
    const row = unwrap(await supabase.from('properties')
      .select('*, property_locations(*), room_types(*), property_photos(*), property_amenities(amenity_id)')
      .eq('id', id!).single()) as unknown as PropertyDetail;
    row.room_types.sort((a, b) => a.sort_order - b.sort_order || a.created_at.localeCompare(b.created_at));
    row.property_photos.sort((a, b) => a.sort_order - b.sort_order);
    return row;
  });
}

export function useAmenities() {
  return useSWR('amenities', async () => unwrap(await supabase.from('amenities').select('*').order('name')), { dedupingInterval: 3_600_000 });
}

// Apply a change to the cached hotel without refetching it.
function patchProperty(id: string, change: (current: PropertyDetail) => PropertyDetail) {
  return mutate<PropertyDetail>(['property', id], (current) => current ? change(current) : current, { revalidate: false });
}

function patchSummary(id: string, change: Partial<PropertySummary>) {
  return mutate<PropertySummary[]>('properties', (list) => list?.map((item) => item.id === id ? { ...item, ...change } : item), { revalidate: false });
}

// Removes a hotel with its rooms, photos and amenities. Hotels with bookings are kept (the
// database refuses), so booking history survives; suspend those instead.
export async function deleteProperty(id: string) {
  const { count } = await supabase.from('reservations').select('id', { count: 'exact', head: true }).eq('property_id', id);
  if (count) throw new Error(`This hotel has ${count} ${count === 1 ? 'booking' : 'bookings'}, so it can’t be deleted. Suspend it to hide it from guests.`);
  const bucket = supabase.storage.from('property-photos');
  const { data: files } = await bucket.list(id, { limit: 1000 });
  if (files?.length) await bucket.remove(files.map((file) => `${id}/${file.name}`));
  const { error } = await supabase.from('properties').delete().eq('id', id);
  if (error) throw new Error(error.code === '23503' ? 'This hotel has bookings, so it can’t be deleted. Suspend it instead.' : error.message);
  await mutate<PropertySummary[]>('properties', (list) => list?.filter((item) => item.id !== id), { revalidate: false });
  await mutate(['property', id], undefined, { revalidate: false });
}

export async function createProperty(values: Tables['properties']['Insert']) {
  const row = unwrap(await supabase.from('properties').insert(values).select('id, name, status, stay_style, area, created_at').single());
  await mutate<PropertySummary[]>('properties', (list) => list ? [{ ...row, property_photos: [], room_types: [{ count: 0 }] }, ...list] : list, { revalidate: false });
  return row.id;
}

export async function updateProperty(id: string, values: Tables['properties']['Update']) {
  const row = unwrap(await supabase.from('properties').update(values).eq('id', id).select('*').single());
  await patchProperty(id, (current) => ({ ...current, ...row }));
  await patchSummary(id, { name: row.name, status: row.status, stay_style: row.stay_style, area: row.area });
}

export async function saveLocation(id: string, values: Omit<Tables['property_locations']['Insert'], 'property_id'>) {
  const location = unwrap(await supabase.from('property_locations').upsert({ property_id: id, ...values }).select('*').single());
  // Public listings only get a rounded position (about 100 m) for distance estimates.
  await updateProperty(id, {
    approx_latitude: Math.round(Number(values.latitude) * 1000) / 1000,
    approx_longitude: Math.round(Number(values.longitude) * 1000) / 1000,
  });
  await patchProperty(id, (current) => ({ ...current, property_locations: location }));
}

export async function saveRoom(propertyId: string, room: Tables['room_types']['Insert'] & { id?: string }) {
  const { id, ...values } = room;
  const saved = unwrap(id
    ? await supabase.from('room_types').update(values).eq('id', id).select('*').single()
    : await supabase.from('room_types').insert({ ...values, property_id: propertyId }).select('*').single());
  await patchProperty(propertyId, (current) => ({
    ...current,
    room_types: id ? current.room_types.map((item) => item.id === id ? saved : item) : [...current.room_types, saved],
  }));
  if (!id) await mutate<PropertySummary[]>('properties', (list) => list?.map((item) => item.id === propertyId
    ? { ...item, room_types: [{ count: (item.room_types[0]?.count ?? 0) + 1 }] } : item), { revalidate: false });
}

export async function deleteRoom(propertyId: string, roomId: string) {
  unwrap(await supabase.from('room_types').delete().eq('id', roomId));
  await patchProperty(propertyId, (current) => ({ ...current, room_types: current.room_types.filter((item) => item.id !== roomId) }));
  await mutate<PropertySummary[]>('properties', (list) => list?.map((item) => item.id === propertyId
    ? { ...item, room_types: [{ count: Math.max(0, (item.room_types[0]?.count ?? 1) - 1) }] } : item), { revalidate: false });
}

export async function uploadPhotos(propertyId: string, files: File[], startOrder: number, onProgress: (done: number) => void) {
  const added: PhotoRow[] = [];
  for (const [index, file] of files.entries()) {
    const { full, thumb, extension } = await compressPhoto(file);
    const path = `${propertyId}/${crypto.randomUUID()}.${extension}`;
    const bucket = supabase.storage.from('property-photos');
    const options = { contentType: full.type, cacheControl: '31536000' };
    const [fullUpload, thumbUpload] = await Promise.all([bucket.upload(path, full, options), bucket.upload(thumbPath(path), thumb, options)]);
    unwrap(fullUpload);
    unwrap(thumbUpload);
    added.push(unwrap(await supabase.from('property_photos').insert({ property_id: propertyId, storage_path: path, sort_order: startOrder + index }).select('*').single()));
    onProgress(index + 1);
  }
  await patchProperty(propertyId, (current) => ({ ...current, property_photos: [...current.property_photos, ...added] }));
  const cover = [...(await getCachedPhotos(propertyId))][0];
  if (cover) await patchSummary(propertyId, { property_photos: [{ storage_path: cover.storage_path }] });
}

async function getCachedPhotos(propertyId: string) {
  const current = await mutate<PropertyDetail>(['property', propertyId], (value) => value, { revalidate: false });
  return current?.property_photos ?? [];
}

export async function deletePhoto(propertyId: string, photo: PhotoRow) {
  unwrap(await supabase.from('property_photos').delete().eq('id', photo.id));
  await supabase.storage.from('property-photos').remove([photo.storage_path, thumbPath(photo.storage_path)]);
  await patchProperty(propertyId, (current) => ({ ...current, property_photos: current.property_photos.filter((item) => item.id !== photo.id) }));
  const cover = (await getCachedPhotos(propertyId))[0];
  await patchSummary(propertyId, { property_photos: cover ? [{ storage_path: cover.storage_path }] : [] });
}

export async function makeCover(propertyId: string, photos: PhotoRow[], coverId: string) {
  const ordered = [photos.find((photo) => photo.id === coverId)!, ...photos.filter((photo) => photo.id !== coverId)];
  const changed = ordered.flatMap((photo, index) => photo.sort_order === index ? [] : [{ id: photo.id, sort_order: index }]);
  await Promise.all(changed.map((item) => supabase.from('property_photos').update({ sort_order: item.sort_order }).eq('id', item.id).then(unwrap)));
  await patchProperty(propertyId, (current) => ({ ...current, property_photos: ordered.map((photo, index) => ({ ...photo, sort_order: index })) }));
  await patchSummary(propertyId, { property_photos: [{ storage_path: ordered[0].storage_path }] });
}

export async function saveAmenities(propertyId: string, previous: string[], next: string[]) {
  const removed = previous.filter((id) => !next.includes(id));
  const added = next.filter((id) => !previous.includes(id));
  if (removed.length) unwrap(await supabase.from('property_amenities').delete().eq('property_id', propertyId).in('amenity_id', removed));
  if (added.length) unwrap(await supabase.from('property_amenities').insert(added.map((amenity_id) => ({ property_id: propertyId, amenity_id }))));
  await patchProperty(propertyId, (current) => ({ ...current, property_amenities: next.map((amenity_id) => ({ amenity_id })) }));
}

// ---------- Bookings ----------
export const reservationColumns = 'id, reference, property_id, room_type_id, check_in, check_out, nights, guests, total_paise, status, payment_status, guest_name, guest_phone, guest_email, special_requests, created_at, cancelled_at, cancellation_reason';
export type Reservation = Pick<ReservationRow, 'id' | 'reference' | 'property_id' | 'room_type_id' | 'check_in' | 'check_out' | 'nights' | 'guests'
  | 'total_paise' | 'status' | 'payment_status' | 'guest_name' | 'guest_phone' | 'guest_email' | 'special_requests' | 'created_at' | 'cancelled_at' | 'cancellation_reason'>;

// Everything from two months back onward, in one request. Realtime keeps it current after that.
export function useReservations() {
  return useSWR('reservations', async () => unwrap(await supabase.from('reservations').select(reservationColumns)
    .gte('check_out', todayInIndia(-60)).order('check_in', { ascending: true }).limit(1000)) as Reservation[]);
}

export function upsertReservation(row: Reservation) {
  return mutate<Reservation[]>('reservations', (list) => {
    if (!list) return list;
    const exists = list.some((item) => item.id === row.id);
    const next = exists ? list.map((item) => item.id === row.id ? { ...item, ...row } : item) : [...list, row];
    return next.sort((a, b) => a.check_in.localeCompare(b.check_in));
  }, { revalidate: false });
}

export async function setReservationStatus(id: string, status: ReservationStatus) {
  upsertReservation(unwrap(await supabase.rpc('update_reservation_status', { p_reservation_id: id, p_status: status })) as Reservation);
}

export async function cancelReservation(id: string, reason: string) {
  upsertReservation(unwrap(await supabase.rpc('cancel_reservation', { p_reservation_id: id, p_reason: reason })) as Reservation);
}

// ---------- Reviews ----------
export type ReviewRow = Pick<Tables['reviews']['Row'], 'id' | 'status' | 'rating' | 'comment' | 'author_name' | 'accommodation_rating' | 'connectivity_rating' | 'cleanliness_rating' | 'created_at'>
  & { properties: { name: string } | null };

export function useReviews() {
  return useSWR('reviews', async () => unwrap(await supabase.from('reviews')
    .select('id, status, rating, comment, author_name, accommodation_rating, connectivity_rating, cleanliness_rating, created_at, properties (name)')
    .order('created_at', { ascending: false }).limit(200)) as unknown as ReviewRow[]);
}

export async function setReviewStatus(id: string, status: Tables['reviews']['Row']['status']) {
  unwrap(await supabase.from('reviews').update({ status }).eq('id', id));
  await mutate<ReviewRow[]>('reviews', (list) => list?.map((item) => item.id === id ? { ...item, status } : item), { revalidate: false });
}
