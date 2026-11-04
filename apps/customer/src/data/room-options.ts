import type { Stay } from '@/types';

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

// The preview collection contains entire properties, not hotel room inventory.
// Keep one accommodation option per property until an operator adds real units.
export function getRoomOptions(stay: Stay): RoomOption[] {
  const bedrooms = `${stay.bedrooms} ${stay.bedrooms === 1 ? 'bedroom' : 'bedrooms'}`;
  return [{
    id: `${stay.id}-standard`,
    name: `Entire ${stay.stayStyle}`,
    description: `${bedrooms} for up to ${stay.capacity} guests. One whole property for your group.`,
    capacity: stay.capacity,
    nightlyRate: stay.nightlyRate,
    compareAtRate: stay.compareAtRate,
    beds: bedrooms,
    features: stay.amenities.filter((amenity) => !/bedroom/i.test(amenity)),
  }];
}
