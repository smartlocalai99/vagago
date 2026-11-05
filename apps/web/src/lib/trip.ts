import { todayInIndia } from './format';

type Point = { latitude: number; longitude: number };

// Centre of Vagamon town, used for distances on pages that are not about one stay.
export const vagamonTown: Point = { latitude: 9.6863, longitude: 76.9052 };

// Hill roads wind well beyond the straight-line distance (same estimate as the app).
const roadFactor = 1.4;
const averageHillSpeedKmh = 25;

function straightLineKm(from: Point, to: Point) {
  const radians = (value: number) => value * Math.PI / 180;
  const deltaLat = radians(to.latitude - from.latitude);
  const deltaLon = radians(to.longitude - from.longitude);
  const a = Math.sin(deltaLat / 2) ** 2 + Math.cos(radians(from.latitude)) * Math.cos(radians(to.latitude)) * Math.sin(deltaLon / 2) ** 2;
  return 6371 * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export function nearby<T extends Point>(from: Point, places: T[]) {
  return places.map((place) => {
    const roadKm = Math.max(0.5, Math.round(straightLineKm(from, place) * roadFactor * 2) / 2);
    return { ...place, roadKm, driveMinutes: Math.max(5, Math.round(roadKm / averageHillSpeedKmh * 60 / 5) * 5) };
  }).sort((a, b) => a.roadKm - b.roadKm);
}

export const formatKm = (km: number) => `${km.toLocaleString('en-IN', { maximumFractionDigits: 1 })} km`;

export function formatDrive(minutes: number) {
  if (minutes < 60) return `${minutes} min`;
  const hours = Math.floor(minutes / 60);
  const rest = minutes % 60;
  return rest ? `${hours} hr ${rest} min` : `${hours} hr`;
}

// ---------- Dates and guests from the URL ----------
export type TripQuery = { checkIn: string; checkOut: string; guests: number };

const isoDate = /^\d{4}-\d{2}-\d{2}$/;
const epochDay = (date: string) => Date.parse(`${date}T00:00:00Z`) / 86_400_000;
export const addDays = (date: string, days: number) => new Date((epochDay(date) + days) * 86_400_000).toISOString().slice(0, 10);
export const nightsBetween = (checkIn: string, checkOut: string) => epochDay(checkOut) - epochDay(checkIn);

export const defaultTrip = (): TripQuery => ({ checkIn: todayInIndia(1), checkOut: todayInIndia(3), guests: 2 });

export function readTrip(query: Record<string, string | string[] | undefined>): TripQuery {
  const fallback = defaultTrip();
  const pick = (name: string) => typeof query[name] === 'string' ? query[name] as string : '';
  const checkIn = isoDate.test(pick('in')) ? pick('in') : fallback.checkIn;
  const out = pick('out');
  const checkOut = isoDate.test(out) && nightsBetween(checkIn, out) > 0 ? out : addDays(checkIn, 2);
  const guests = Math.min(20, Math.max(1, Number.parseInt(pick('guests'), 10) || fallback.guests));
  return { checkIn, checkOut, guests };
}

export const tripParams = (trip: TripQuery) => `in=${trip.checkIn}&out=${trip.checkOut}&guests=${trip.guests}`;

// Mirrors the checks create_reservation runs, so mistakes show before the request.
export function tripProblem(trip: TripQuery): string | null {
  const today = todayInIndia();
  if (trip.checkIn < today) return 'Check-in can’t be in the past.';
  if (trip.checkIn > addDays(today, 365)) return 'Bookings open up to one year ahead.';
  const nights = nightsBetween(trip.checkIn, trip.checkOut);
  if (nights < 1 || nights > 30) return 'Choose a stay of 1 to 30 nights.';
  return null;
}
