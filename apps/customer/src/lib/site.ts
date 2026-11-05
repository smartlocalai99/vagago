// Place photos and amenity illustrations are served by the website, so the app and the
// site always show the same images; expo-image keeps them in its disk cache.
export const siteUrl = 'https://vagago.vercel.app';

const photographed = new Set(['vagamon-meadows', 'vagamon-pine-forest', 'vagamon-lake', 'murugan-mala', 'kurisumala', 'thangalpara',
  'marmala-waterfalls', 'illikkal-kallu', 'ilaveezhapoonchira', 'paragliding-point']);
export const placePhotoUrl = (slug: string) => photographed.has(slug) ? `${siteUrl}/places/${slug}.jpg` : null;

// Amenities with a real photo use it; the rest fall back to a drawn illustration.
const photoByName: [RegExp, string][] = [[/wi-?fi/i, 'wifi'], [/parking/i, 'parking'], [/balcony|deck|view/i, 'view'], [/breakfast/i, 'breakfast'], [/campfire|bonfire/i, 'campfire']];
const artByName: [RegExp, string][] = [
  [/kitchen|coffee/i, 'cup'], [/hot water|shower/i, 'water'], [/garden/i, 'plant'], [/pet/i, 'paw'], [/power/i, 'bolt'],
];
export function amenityArt(name: string): { uri: string; photo: boolean } {
  const photo = photoByName.find(([pattern]) => pattern.test(name))?.[1];
  if (photo) return { uri: `${siteUrl}/amenities/${photo}.jpg`, photo: true };
  return { uri: `${siteUrl}/amenities/${artByName.find(([pattern]) => pattern.test(name))?.[1] ?? 'chair'}.svg`, photo: false };
}
