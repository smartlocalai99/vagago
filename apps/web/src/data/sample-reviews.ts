import type { GuestReview } from '@/lib/listings';

// Demo content for client presentations: shown in the hero only while no real reviews are
// published, and labelled "Sample reviews". Delete this file's entries to switch it off.
export const sampleReviews: GuestReview[] = [
  { id: 's1', comment: 'Woke up to mist over the pine forest. Spotless rooms and the host was so helpful.', author: 'Anjali', stay: 'The Fern House', accommodation: 5, connectivity: 4, cleanliness: 5, rating: 5 },
  { id: 's2', comment: 'Easy to find with the directions, and paying at the stay made booking stress free.', author: 'Rahul', stay: 'Cloudline Homestay', accommodation: 4.5, connectivity: 5, cleanliness: 4.5, rating: 5 },
  { id: 's3', comment: 'Perfect for our family weekend. Meadows view from the deck was unreal.', author: 'Sneha', stay: 'Meadow & Stone', accommodation: 5, connectivity: 3.5, cleanliness: 5, rating: 5 },
  { id: 's4', comment: 'Great value for the price. Quiet, cosy and close to all the viewpoints.', author: 'Arjun', stay: 'The Fern House', accommodation: 4, connectivity: 4.5, cleanliness: 4.5, rating: 4 },
];
