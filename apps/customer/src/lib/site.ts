// Place photos and amenity illustrations are served by the website, so the app and the
// site always show the same images; expo-image keeps them in its disk cache.
export const siteUrl = 'https://vagago.vercel.app';

const photographed = new Set(['vagamon-meadows', 'vagamon-pine-forest', 'vagamon-lake', 'murugan-mala', 'kurisumala', 'thangalpara',
  'marmala-waterfalls', 'illikkal-kallu', 'ilaveezhapoonchira']);
export const placePhotoUrl = (slug: string) => photographed.has(slug) ? `${siteUrl}/places/${slug}.jpg` : null;

const artByName: [RegExp, string][] = [
  [/wi-?fi/i, 'wifi'], [/parking/i, 'parking'], [/breakfast|kitchen|coffee/i, 'cup'], [/campfire|bonfire/i, 'campfire'],
  [/hot water|shower/i, 'water'], [/balcony|deck|view/i, 'hills'], [/garden/i, 'plant'], [/pet/i, 'paw'], [/power/i, 'bolt'],
];
export function amenityArtUrl(name: string) {
  return `${siteUrl}/amenities/${artByName.find(([pattern]) => pattern.test(name))?.[1] ?? 'chair'}.svg`;
}
