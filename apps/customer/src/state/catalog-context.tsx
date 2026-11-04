import { createContext, use, useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { readCache, writeCache } from '@/lib/cache';
import { supabase } from '@/lib/supabase';
import type { Stay } from '@/types';

type CatalogState = {
  ready: boolean;
  stays: Stay[];
  refreshing: boolean;
  error: string | null;
  refresh: () => Promise<void>;
};

const CatalogContext = createContext<CatalogState | null>(null);
const cacheKey = '@vagago/catalog:v2';
// Listings change rarely; one request per ten minutes keeps the app current without repeat hits.
const maxAgeMs = 10 * 60 * 1000;

// One request returns every published listing with its rooms, photos and amenities.
const listingQuery = `id, name, tagline, description, stay_style, area, approx_latitude, approx_longitude,
  room_types (id, name, description, max_guests, bedrooms, beds, base_rate_paise, compare_at_paise, is_active, sort_order),
  property_photos (storage_path, sort_order),
  property_amenities (amenities (name))`;

type ListingRow = {
  id: string; name: string; tagline: string | null; description: string | null; stay_style: Stay['stayStyle'];
  area: string; approx_latitude: number | null; approx_longitude: number | null;
  room_types: { id: string; name: string; description: string | null; max_guests: number; bedrooms: number; beds: string | null;
    base_rate_paise: number; compare_at_paise: number | null; is_active: boolean; sort_order: number }[];
  property_photos: { storage_path: string; sort_order: number }[];
  property_amenities: { amenities: { name: string } | null }[];
};

function photoUrl(path: string) {
  return supabase.storage.from('property-photos').getPublicUrl(path).data.publicUrl;
}

// Uploads store a 480px thumbnail beside each photo: <id>.webp -> <id>.thumb.webp
const thumbUrl = (path: string) => photoUrl(path.replace(/\.(\w+)$/, '.thumb.$1'));

function toStay(row: ListingRow): Stay | null {
  const rooms = row.room_types.filter((room) => room.is_active).sort((a, b) => a.sort_order - b.sort_order);
  if (!rooms.length) return null;
  const ordered = [...row.property_photos].sort((a, b) => a.sort_order - b.sort_order);
  const photos = ordered.map((photo) => ({ uri: photoUrl(photo.storage_path) }));
  const amenities = row.property_amenities.flatMap((item) => item.amenities ? [item.amenities.name] : []);
  const cheapest = rooms.reduce((low, room) => room.base_rate_paise < low.base_rate_paise ? room : low, rooms[0]);
  return {
    id: row.id,
    name: row.name,
    tagline: row.tagline ?? '',
    description: row.description ?? '',
    setting: row.area,
    area: row.area,
    stayStyle: row.stay_style,
    capacity: Math.max(...rooms.map((room) => room.max_guests)),
    bedrooms: Math.max(...rooms.map((room) => room.bedrooms)),
    nightlyRate: cheapest.base_rate_paise / 100,
    compareAtRate: cheapest.compare_at_paise ? cheapest.compare_at_paise / 100 : undefined,
    moods: [],
    image: photos[0] ?? { uri: '' },
    thumbnail: ordered[0] ? { uri: thumbUrl(ordered[0].storage_path) } : { uri: '' },
    gallery: photos,
    amenities,
    coordinates: { latitude: Number(row.approx_latitude ?? 9.69), longitude: Number(row.approx_longitude ?? 76.91) },
    rooms: rooms.map((room) => ({
      id: room.id,
      name: room.name,
      description: room.description ?? `${room.bedrooms} ${room.bedrooms === 1 ? 'bedroom' : 'bedrooms'} for up to ${room.max_guests} guests.`,
      capacity: room.max_guests,
      nightlyRate: room.base_rate_paise / 100,
      compareAtRate: room.compare_at_paise ? room.compare_at_paise / 100 : undefined,
      beds: room.beds ?? `${room.bedrooms} ${room.bedrooms === 1 ? 'bedroom' : 'bedrooms'}`,
      features: amenities,
    })),
  };
}

export function CatalogProvider({ children }: { children: ReactNode }) {
  const [ready, setReady] = useState(false);
  const [stays, setStays] = useState<Stay[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inFlight = useRef<Promise<void> | null>(null);

  const load = useCallback(() => {
    // Concurrent callers share one request.
    inFlight.current ??= (async () => {
      setRefreshing(true);
      const { data, error: queryError } = await supabase.from('properties').select(listingQuery).eq('status', 'published').order('published_at', { ascending: false });
      if (queryError) {
        setError('Couldn’t load stays. Pull down to try again.');
      } else {
        const next = (data as unknown as ListingRow[]).flatMap((row) => toStay(row) ?? []);
        setStays(next);
        setError(null);
        writeCache(cacheKey, next);
      }
      setRefreshing(false);
      setReady(true);
    })().finally(() => { inFlight.current = null; });
    return inFlight.current;
  }, []);

  useEffect(() => {
    void readCache<Stay[]>(cacheKey).then((cached) => {
      if (cached?.value.length) {
        setStays(cached.value);
        setReady(true);
      }
      if (!cached || Date.now() - cached.savedAt > maxAgeMs) void load();
    });
  }, [load]);

  const value = useMemo(() => ({ ready, stays, refreshing, error, refresh: load }), [ready, stays, refreshing, error, load]);
  return <CatalogContext value={value}>{children}</CatalogContext>;
}

export function useCatalog(): CatalogState {
  const context = use(CatalogContext);
  if (!context) throw new Error('useCatalog must be used within CatalogProvider.');
  return context;
}

export function useStays() {
  return useCatalog().stays;
}
