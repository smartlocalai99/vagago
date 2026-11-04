import { getTodayInKolkata, matchPreviewStays, parseDateOnly, validateGetawayDraft } from '@vagago/domain';

export const SAVED_STAYS_KEY = '@vagago/saved-stays:v1';
export const ESCAPE_DRAFT_KEY = '@vagago/escape-draft:v1';

export function createDefaultDraft(now) {
  const today = parseDateOnly(getTodayInKolkata(now));
  const offsetDate = (days) => new Date((today.epochDay + days) * 86_400_000).toISOString().slice(0, 10);
  return {
    checkIn: offsetDate(1),
    checkOut: offsetDate(3),
    guests: 2,
    nightlyBudget: 15000,
    mood: null,
    stayStyle: 'all',
    query: '',
    stayId: null,
    roomOptionId: null,
    roomCount: 1,
  };
}

function readRecord(raw) {
  try {
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === 'object' && !Array.isArray(parsed) && parsed.version === 1 ? parsed : null;
  } catch {
    return null;
  }
}

export function decodeSavedStays(raw, knownIds) {
  if (raw === null) return { value: [], recovered: false };
  const record = readRecord(raw);
  if (!record || !Array.isArray(record.savedIds)) return { value: [], recovered: true };
  const value = [...new Set(record.savedIds.filter((id) => typeof id === 'string' && knownIds.has(id)))];
  return { value, recovered: value.length !== record.savedIds.length };
}

export function decodeEscapeDraft(raw, defaults, knownIds, roomOptionsByStay = {}) {
  const fallback = { draft: { ...defaults }, hasSavedDraft: false, recovered: raw !== null };
  if (raw === null) return fallback;
  const record = readRecord(raw);
  const storedDraft = record?.draft;
  if (!storedDraft || typeof storedDraft !== 'object' || Array.isArray(storedDraft)) return fallback;
  // Keep older records readable after renaming the property category. The live
  // booking flow does not read these records or rewrite their stored contents.
  const draft = storedDraft.stayStyle === 'cabin' ? { ...storedDraft, stayStyle: 'homestay' } : storedDraft;

  // A stale plan remains editable. Its calendar dates must still be structurally
  // valid, but the UI will ask the user to move past dates before saving again.
  const validation = validateGetawayDraft(draft, { today: '0001-01-01' });
  if (!validation.valid || !Object.hasOwn(draft, 'mood') || !Object.hasOwn(draft, 'stayStyle')
    || !Object.hasOwn(draft, 'query') || !Object.hasOwn(draft, 'stayId')
    || (draft.stayId !== null && typeof draft.stayId !== 'string')) return fallback;

  const stayId = draft.stayId !== null && knownIds.has(draft.stayId) ? draft.stayId : null;
  // Version 1 plans written before accommodation selection are still valid.
  // Repair only the new fields so an invalid selection cannot erase dates.
  const requestedOption = draft.roomOptionId ?? null;
  const roomOptionId = stayId && typeof requestedOption === 'string'
    && roomOptionsByStay[stayId]?.some((option) => option.id === requestedOption)
    ? requestedOption : null;
  const invalidOption = (Object.hasOwn(draft, 'roomOptionId') && draft.roomOptionId !== null
    && (typeof draft.roomOptionId !== 'string' || draft.roomOptionId !== roomOptionId));
  const invalidCount = Object.hasOwn(draft, 'roomCount') && draft.roomCount !== 1;
  return {
    draft: {
      checkIn: draft.checkIn,
      checkOut: draft.checkOut,
      guests: draft.guests,
      nightlyBudget: draft.nightlyBudget,
      mood: draft.mood,
      stayStyle: draft.stayStyle,
      query: draft.query,
      stayId,
      roomOptionId,
      roomCount: 1,
    },
    hasSavedDraft: true,
    recovered: draft.stayId !== stayId || invalidOption || invalidCount,
  };
}

export function encodeSavedStays(savedIds) {
  return JSON.stringify({ version: 1, savedIds });
}

export function canSaveEscapeDraft(draft, previewStays, today, roomOptionsByStay = {}) {
  if (!validateGetawayDraft(draft, { today }).valid) return false;
  if (draft.roomCount !== undefined && draft.roomCount !== 1) return false;
  const optionId = draft.roomOptionId ?? null;
  if (draft.stayId === null) return optionId === null;
  const stay = matchPreviewStays(previewStays, draft).find((item) => item.id === draft.stayId);
  if (!stay) return false;
  if (optionId === null) return true;
  if (typeof optionId !== 'string') return false;
  const option = roomOptionsByStay[stay.id]?.find((item) => item.id === optionId);
  return Boolean(option && Number.isInteger(option.capacity) && option.capacity >= draft.guests
    && option.capacity <= stay.capacity && Number.isFinite(option.nightlyRate)
    && option.nightlyRate > 0 && option.nightlyRate <= draft.nightlyBudget);
}

export function mergeEscapeDraft(draft, patch) {
  const next = { ...draft, ...patch };
  if (Object.hasOwn(patch, 'stayId') && patch.stayId !== draft.stayId) {
    // A selection belongs to one property. An atomic property + option change
    // is allowed, while switching only the property drops the old selection.
    next.roomOptionId = patch.roomOptionId ?? null;
    next.roomCount = patch.roomCount ?? 1;
  }
  return next;
}

export function encodeEscapeDraft(draft) {
  return JSON.stringify({
    version: 1,
    draft: {
      checkIn: draft.checkIn,
      checkOut: draft.checkOut,
      guests: draft.guests,
      nightlyBudget: draft.nightlyBudget,
      mood: draft.mood,
      stayStyle: draft.stayStyle,
      query: draft.query,
      stayId: draft.stayId,
      roomOptionId: draft.roomOptionId ?? null,
      roomCount: draft.roomCount ?? 1,
    },
  });
}
