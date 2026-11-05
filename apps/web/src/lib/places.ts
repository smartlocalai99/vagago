import amenityPhotoCredits from '../../public/amenities/credits.json';
import credits from '../../public/places/credits.json';

export type PhotoCredit = { title: string; author: string; license: string; licenseUrl: string; source: string; note?: string; label?: string };

// Photos of public landmarks live in /public/places/<slug>.jpg (credits in credits.json).
// The app loads the same files from the website.
export const placeCredits = credits as Record<string, PhotoCredit>;
export const placePhoto = (slug: string) => placeCredits[slug] ? `/places/${slug}.jpg` : null;
export const amenityCredits = amenityPhotoCredits as Record<string, PhotoCredit>;

// Amenities with a real photo use it; the rest fall back to a drawn illustration.
const photoByName: [RegExp, string][] = [[/wi-?fi/i, 'wifi'], [/parking/i, 'parking'], [/balcony|deck|view/i, 'view'], [/breakfast/i, 'breakfast'], [/campfire|bonfire/i, 'campfire']];
const artByIcon: Record<string, string> = { wifi: 'wifi', car: 'parking', coffee: 'cup', flame: 'campfire', mountain: 'hills', leaf: 'plant', home: 'chair', heart: 'paw' };
export function amenityArt(name: string, icon: string | null): { src: string; photo: boolean } {
  const photo = photoByName.find(([pattern]) => pattern.test(name))?.[1];
  if (photo) return { src: `/amenities/${photo}.jpg`, photo: true };
  if (/hot water|shower/i.test(name)) return { src: '/amenities/water.svg', photo: false };
  if (/power/i.test(name)) return { src: '/amenities/bolt.svg', photo: false };
  return { src: `/amenities/${artByIcon[icon ?? ''] ?? 'chair'}.svg`, photo: false };
}

export type AmenityHighlight = { name: string; art: { src: string; photo: boolean }; stays: number };
