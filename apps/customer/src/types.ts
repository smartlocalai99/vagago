import { ImageSource } from 'expo-image';

export type Mood = 'peaceful' | 'adventurous' | 'romantic' | 'nature';
export type StayStyle = 'all' | 'villa' | 'cottage' | 'homestay' | 'resort' | 'hotel';
export type EscapeDraft = {
  checkIn: string;
  checkOut: string;
  guests: number;
  nightlyBudget: number;
  mood: Mood | null;
  stayStyle: StayStyle;
  query: string;
  stayId: string | null;
  roomOptionId?: string | null;
  roomCount?: number;
};
export type RoomOption = {
  id: string;
  name: string;
  description: string;
  capacity: number;
  nightlyRate: number;
  compareAtRate?: number;
  beds: string;
  features: string[];
};
export type Stay = {
  id: string;
  name: string;
  description: string;
  tagline: string;
  setting: string;
  capacity: number;
  bedrooms: number;
  nightlyRate: number;
  compareAtRate?: number;
  moods: Mood[];
  stayStyle: Exclude<StayStyle, 'all'>;
  image: ImageSource;
  // Small copy of the cover photo for lists.
  thumbnail: ImageSource;
  gallery: ImageSource[];
  amenities: string[];
  area: string;
  // Rounded public position; the exact address is released with a booking.
  coordinates: Coordinates;
  rooms: RoomOption[];
  // 'HH:MM' times, the yes/no house rules the property has stated, and its own extra rules.
  checkIn: string;
  checkOut: string;
  rules: { key: string; allowed: boolean; label: string }[];
  houseRules: string;
  cancellationPolicy: string;
};
export type Coordinates = { latitude: number; longitude: number };
