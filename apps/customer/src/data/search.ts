import { matchPreviewStays } from '@vagago/domain';
import type { EscapeDraft, Stay } from '@/types';

// Search narrows stays by name or place and by group size only. Property-type and budget
// filters were removed from the app, so any values left in the draft are ignored here.
export function matchStays(stays: Stay[], draft: EscapeDraft): Stay[] {
  return matchPreviewStays(stays, { guests: draft.guests, query: draft.query, mood: null, stayStyle: 'all' });
}

export const sortOptions = [
  { id: 'recommended', label: 'Recommended' },
  { id: 'low', label: 'Price: low to high' },
  { id: 'high', label: 'Price: high to low' },
] as const;
export type SortId = (typeof sortOptions)[number]['id'];

export function discountPercent(rate: number, compareAtRate?: number) {
  return compareAtRate && compareAtRate > rate ? Math.round((1 - rate / compareAtRate) * 100) : 0;
}

export function sortStays(stays: Stay[], sort: SortId): Stay[] {
  if (sort === 'recommended') return stays;
  const sorted = [...stays];
  if (sort === 'low') sorted.sort((a, b) => a.nightlyRate - b.nightlyRate);
  else sorted.sort((a, b) => b.nightlyRate - a.nightlyRate);
  return sorted;
}
