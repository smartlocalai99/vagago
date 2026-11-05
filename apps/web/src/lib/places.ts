import credits from '../../public/places/credits.json';

export type PhotoCredit = { title: string; author: string; license: string; licenseUrl: string; source: string };

// Photos of public landmarks live in /public/places/<slug>.jpg (credits in credits.json).
// The app loads the same files from the website.
export const placeCredits = credits as Record<string, PhotoCredit>;
export const placePhoto = (slug: string) => placeCredits[slug] ? `/places/${slug}.jpg` : null;

// Amenity illustrations in /public/amenities, picked by the amenity's icon or name.
const artByIcon: Record<string, string> = { wifi: 'wifi', car: 'parking', coffee: 'cup', flame: 'campfire', mountain: 'hills', leaf: 'plant', home: 'chair', heart: 'paw' };
export function amenityArt(name: string, icon: string | null) {
  if (/hot water|shower/i.test(name)) return '/amenities/water.svg';
  if (/power/i.test(name)) return '/amenities/bolt.svg';
  return `/amenities/${artByIcon[icon ?? ''] ?? 'chair'}.svg`;
}

export type AmenityHighlight = { name: string; art: string; stays: number };
