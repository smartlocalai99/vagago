import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import type { Coordinates } from '@/types';

export type Attraction = { id: string; name: string; kind: string; coordinates: Coordinates };

// Approximate public landmark positions around Vagamon (ids match the database slugs).
export const attractions: Attraction[] = [
  { id: 'vagamon-meadows', name: 'Vagamon Meadows', kind: 'Rolling grass hills', coordinates: { latitude: 9.6835, longitude: 76.9091 } },
  { id: 'vagamon-pine-forest', name: 'Vagamon Pine Forest', kind: 'Forest walk', coordinates: { latitude: 9.6731, longitude: 76.9046 } },
  { id: 'vagamon-lake', name: 'Vagamon Lake', kind: 'Lake and boating', coordinates: { latitude: 9.6905, longitude: 76.9195 } },
  { id: 'murugan-mala', name: 'Murugan Mala', kind: 'Rock-cut temple hill', coordinates: { latitude: 9.6966, longitude: 76.9097 } },
  { id: 'kurisumala', name: 'Kurisumala', kind: 'Pilgrim hilltop', coordinates: { latitude: 9.7057, longitude: 76.8897 } },
  { id: 'thangalpara', name: 'Thangalpara', kind: 'Rock viewpoint', coordinates: { latitude: 9.7139, longitude: 76.9207 } },
  { id: 'paragliding-point', name: 'Paragliding point', kind: 'Adventure sports', coordinates: { latitude: 9.6818, longitude: 76.9131 } },
  { id: 'marmala-waterfalls', name: 'Marmala Waterfalls', kind: 'Waterfall', coordinates: { latitude: 9.7143, longitude: 76.8306 } },
  { id: 'illikkal-kallu', name: 'Illikkal Kallu', kind: 'Trek and viewpoint', coordinates: { latitude: 9.7838, longitude: 76.8256 } },
  { id: 'ilaveezhapoonchira', name: 'Ilaveezhapoonchira', kind: 'Hill valley viewpoint', coordinates: { latitude: 9.8016, longitude: 76.8150 } },
];

// Hill roads wind well beyond the straight-line distance.
const roadFactor = 1.4;
const averageHillSpeedKmh = 25;

function straightLineKm(from: Coordinates, to: Coordinates) {
  const radians = (value: number) => value * Math.PI / 180;
  const deltaLat = radians(to.latitude - from.latitude);
  const deltaLon = radians(to.longitude - from.longitude);
  const a = Math.sin(deltaLat / 2) ** 2 + Math.cos(radians(from.latitude)) * Math.cos(radians(to.latitude)) * Math.sin(deltaLon / 2) ** 2;
  return 6371 * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export type NearbyAttraction = Attraction & { roadKm: number; driveMinutes: number };

let remoteAttractions: Promise<Attraction[] | null> | null = null;

// Loads the admin-managed list once per launch; the bundled list covers offline use.
export function useAttractions() {
  const [list, setList] = useState(attractions);
  useEffect(() => {
    let mounted = true;
    remoteAttractions ??= Promise.resolve(supabase.from('attractions').select('slug, name, kind, latitude, longitude').order('sort_order'))
      .then(({ data, error }) => error || !data?.length ? null : data.map((row) => ({
        id: row.slug, name: row.name, kind: row.kind, coordinates: { latitude: Number(row.latitude), longitude: Number(row.longitude) },
      })))
      .catch(() => null);
    void remoteAttractions.then((rows) => { if (mounted && rows) setList(rows); });
    return () => { mounted = false; };
  }, []);
  return list;
}

export function nearbyAttractions(from: Coordinates, list: Attraction[] = attractions): NearbyAttraction[] {
  return list.map((attraction) => {
    const roadKm = Math.max(0.5, Math.round(straightLineKm(from, attraction.coordinates) * roadFactor * 2) / 2);
    return { ...attraction, roadKm, driveMinutes: Math.max(5, Math.round(roadKm / averageHillSpeedKmh * 60 / 5) * 5) };
  }).sort((a, b) => a.roadKm - b.roadKm);
}

export function formatKm(km: number) {
  return `${km.toLocaleString('en-IN', { maximumFractionDigits: 1 })} km`;
}

export function formatDrive(minutes: number) {
  if (minutes < 60) return `${minutes} min`;
  const hours = Math.floor(minutes / 60);
  const rest = minutes % 60;
  return rest ? `${hours} hr ${rest} min` : `${hours} hr`;
}
