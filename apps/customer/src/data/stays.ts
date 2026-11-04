import type { Mood, Stay } from '@/types';

export const hillscape = require('../../assets/images/hillscape.jpg');
export const forest = require('../../assets/images/forest.jpg');
const cottage = require('../../assets/images/cottage.jpg');
const homestay = require('../../assets/images/cabin.jpg');
const villa = require('../../assets/images/villa.jpg');

export const moods: { id: Mood; label: string; short: string; icon: 'sun' | 'mountain' | 'heart' | 'leaf'; line: string }[] = [
  { id: 'peaceful', label: 'A little peace', short: 'Peaceful', icon: 'sun', line: 'Slow mornings. Nothing on the clock.' },
  { id: 'adventurous', label: 'A little adventure', short: 'Adventurous', icon: 'mountain', line: 'New paths. A different point of view.' },
  { id: 'romantic', label: 'Just the two of us', short: 'Romantic', icon: 'heart', line: 'More time together. Less of everything else.' },
  { id: 'nature', label: 'Closer to nature', short: 'Nature', icon: 'leaf', line: 'A softer soundtrack. A greener outlook.' },
];

// Fictional preview concepts. These are neither onboarded hotels nor bookable inventory.
// Comparison prices are illustrative sample amounts, not historical selling rates.
export const stays: Stay[] = [
  {
    id: 'fern-house', name: 'The Fern House', tagline: 'For mornings that take their time.',
    setting: 'Forest-edge cottage', stayStyle: 'cottage', capacity: 4, bedrooms: 2, nightlyRate: 6400, compareAtRate: 8000,
    moods: ['peaceful', 'nature'], image: cottage, gallery: [cottage, forest],
    description: 'Imagine a small cottage at the edge of the trees. A warm cup in your hands, an open book, and a whole afternoon with nowhere else to be. This is our idea of a slower escape.',
    highlights: [
      { title: 'A greener outlook', description: 'A forest-facing place to pause, designed around unhurried days.', icon: 'leaf' },
      { title: 'Your morning ritual', description: 'Room for coffee, conversation, and a little extra quiet.', icon: 'coffee' },
    ], amenities: ['Two bedrooms', 'Private sit-out', 'Kitchenette', 'Wi-Fi'],
    area: 'Near Pine Forest', address: 'Pine Valley Road, near Vagamon Pine Forest, Vagamon, Kerala 685503',
    coordinates: { latitude: 9.6762, longitude: 76.9018 },
  },
  {
    id: 'cloudline-cabin', name: 'Cloudline Homestay', tagline: 'A little above the everyday.',
    setting: 'Hillside homestay', stayStyle: 'homestay', capacity: 2, bedrooms: 1, nightlyRate: 8200, compareAtRate: 10000,
    moods: ['romantic', 'adventurous', 'nature'], image: homestay, gallery: [homestay, hillscape],
    description: 'A homestay for two, imagined around the simple pleasure of looking out. Leave a little space in the day for the scenery, and a little more for each other.',
    highlights: [
      { title: 'A wider horizon', description: 'A hillside setting is the inspiration for this escape concept.', icon: 'mountain' },
      { title: 'Just your kind of evening', description: 'A cosy space to return to after a day of exploring.', icon: 'moon' },
    ], amenities: ['One bedroom', 'Private deck', 'Coffee corner', 'Wi-Fi'],
    area: 'Near Murugan Mala', address: 'Murugan Mala Road, Vagamon, Kerala 685503',
    coordinates: { latitude: 9.6951, longitude: 76.9128 },
  },
  {
    id: 'meadow-villa', name: 'Meadow & Stone', tagline: 'Bring your favourite people.',
    setting: 'Private garden villa', stayStyle: 'villa', capacity: 6, bedrooms: 3, nightlyRate: 12800, compareAtRate: 16000,
    moods: ['peaceful', 'romantic'], image: villa, gallery: [villa, hillscape],
    description: 'Long lunches, open doors, and space for everyone. A villa concept built around time together, with quiet corners whenever you need a moment of your own.',
    highlights: [
      { title: 'Room to reconnect', description: 'Shared spaces for a small group and bedrooms to retreat to.', icon: 'home' },
      { title: 'Days in the garden', description: 'An outdoor setting for conversations that carry on.', icon: 'sun' },
    ], amenities: ['Three bedrooms', 'Private garden', 'Kitchen', 'Dining space'],
    area: 'Near Vagamon Meadows', address: 'Kolahalamedu Road, near Vagamon Meadows, Vagamon, Kerala 685503',
    coordinates: { latitude: 9.6878, longitude: 76.9061 },
  },
];

export const money = (amount: number) => new Intl.NumberFormat('en-IN', {
  style: 'currency', currency: 'INR', maximumFractionDigits: 0,
}).format(amount);
