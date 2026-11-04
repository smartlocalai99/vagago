import { ImageSource } from 'expo-image';

export type Mood = 'peaceful' | 'adventurous' | 'romantic' | 'nature';
export type StayStyle = 'all' | 'villa' | 'cottage' | 'homestay';
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
  gallery: ImageSource[];
  highlights: { title: string; description: string; icon: 'sun' | 'leaf' | 'mountain' | 'coffee' | 'moon' | 'home' }[];
  amenities: string[];
  area: string;
  address: string;
  coordinates: Coordinates;
};
export type Coordinates = { latitude: number; longitude: number };
