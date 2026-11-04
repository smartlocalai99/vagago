import assert from 'node:assert/strict';
import test from 'node:test';
import {
  canSaveEscapeDraft,
  createDefaultDraft,
  decodeEscapeDraft,
  decodeSavedStays,
  encodeEscapeDraft,
  encodeSavedStays,
  mergeEscapeDraft,
} from './storage-records.js';

const knownIds = new Set(['fern-house', 'cloudline-cabin']);
const defaults = createDefaultDraft('2026-10-31T18:30:00Z');
const previews = [
  { id: 'fern-house', name: 'The Fern House', capacity: 4, nightlyRate: 6400, moods: ['peaceful', 'nature'], stayStyle: 'cottage' },
  { id: 'cloudline-cabin', name: 'Cloudline Homestay', capacity: 2, nightlyRate: 8200, moods: ['nature'], stayStyle: 'homestay' },
];
const roomOptionsByStay = {
  'fern-house': [{ id: 'fern-house-standard', capacity: 4, nightlyRate: 6400 }],
  'cloudline-cabin': [{ id: 'cloudline-cabin-standard', capacity: 2, nightlyRate: 8200 }],
};

test('default escape starts tomorrow in Kolkata and lasts two nights', () => {
  assert.equal(defaults.checkIn, '2026-11-02');
  assert.equal(defaults.checkOut, '2026-11-04');
  assert.equal(defaults.nightlyBudget, 15000);
  const yearEnd = createDefaultDraft('2026-12-31T12:00:00Z');
  assert.equal(yearEnd.checkIn, '2027-01-01');
  assert.equal(yearEnd.checkOut, '2027-01-03');
});

test('absent storage restores defaults without a false saved state or error', () => {
  assert.deepEqual(decodeSavedStays(null, knownIds), { value: [], recovered: false });
  assert.deepEqual(decodeEscapeDraft(null, defaults, knownIds), { draft: defaults, hasSavedDraft: false, recovered: false });
});

test('saved stays survive a versioned round trip and reject unknown IDs or duplicates', () => {
  assert.deepEqual(decodeSavedStays(encodeSavedStays(['fern-house']), knownIds), { value: ['fern-house'], recovered: false });
  const record = JSON.stringify({ version: 1, savedIds: ['fern-house', 'old-property', 'fern-house', 123, null] });
  assert.deepEqual(decodeSavedStays(record, knownIds), { value: ['fern-house'], recovered: true });
});

test('malformed and future-version saved records recover visibly', () => {
  for (const raw of ['broken', 'null', '[]', '{}', '{"version":2,"savedIds":[]}', '{"version":1,"savedIds":"fern-house"}']) {
    assert.deepEqual(decodeSavedStays(raw, knownIds), { value: [], recovered: true });
    assert.equal(decodeEscapeDraft(raw, defaults, knownIds).recovered, true);
  }
});

test('valid past dates survive hydration so the user can revise their saved plan', () => {
  const oldDraft = { ...defaults, checkIn: '2020-01-01', checkOut: '2020-01-03', stayId: 'fern-house' };
  assert.deepEqual(decodeEscapeDraft(encodeEscapeDraft(oldDraft), defaults, knownIds), {
    draft: oldDraft, hasSavedDraft: true, recovered: false,
  });
});

test('invalid draft fields recover to defaults without treating repaired data as saved', () => {
  for (const patch of [{ checkIn: '2026-02-30' }, { guests: 0 }, { nightlyBudget: Infinity }, { mood: 'unknown' }, { stayStyle: 'castle' }, { query: 123 }, { stayId: {} }]) {
    const result = decodeEscapeDraft(JSON.stringify({ version: 1, draft: { ...defaults, ...patch } }), defaults, knownIds);
    assert.deepEqual(result, { draft: defaults, hasSavedDraft: false, recovered: true });
  }
});

test('removed properties are detached from valid plans and unknown fields are stripped', () => {
  const raw = JSON.stringify({ version: 1, draft: { ...defaults, stayId: 'removed-property', paymentConfirmed: true } });
  const result = decodeEscapeDraft(raw, defaults, knownIds);
  assert.equal(result.draft.stayId, null);
  assert.equal(result.hasSavedDraft, true);
  assert.equal(result.recovered, true);
  assert.equal(Object.hasOwn(result.draft, 'paymentConfirmed'), false);
  assert.equal(Object.hasOwn(JSON.parse(encodeEscapeDraft({ ...defaults, paymentConfirmed: true })).draft, 'paymentConfirmed'), false);
});

test('saving rejects a selected stay made incompatible by edited preferences', () => {
  const plan = { ...defaults, stayId: 'fern-house', mood: 'nature', stayStyle: 'cottage' };
  assert.equal(canSaveEscapeDraft(plan, previews, '2026-11-01'), true);
  for (const patch of [{ guests: 5 }, { nightlyBudget: 6000 }, { mood: 'romantic' }, { stayStyle: 'villa' }, { stayId: 'removed-property' }, { checkIn: '2026-10-31' }]) {
    assert.equal(canSaveEscapeDraft({ ...plan, ...patch }, previews, '2026-11-01'), false);
  }
  assert.equal(canSaveEscapeDraft({ ...plan, stayId: null }, previews, '2026-11-01'), true);
});

test('existing v1 plans gain selection defaults without losing saved preferences or past dates', () => {
  const { roomOptionId, roomCount, ...legacyDraft } = {
    ...defaults, stayId: 'fern-house', checkIn: '2020-01-01', checkOut: '2020-01-03',
    guests: 4, mood: 'nature', query: 'fern', nightlyBudget: 9000,
  };
  const raw = JSON.stringify({ version: 1, draft: legacyDraft });
  assert.deepEqual(decodeEscapeDraft(raw, defaults, knownIds, roomOptionsByStay), {
    draft: { ...legacyDraft, roomOptionId: null, roomCount: 1 }, hasSavedDraft: true, recovered: false,
  });
});

test('a selected accommodation survives round trip and invalid selections recover only new fields', () => {
  const plan = { ...defaults, stayId: 'fern-house', roomOptionId: 'fern-house-standard', roomCount: 1 };
  assert.deepEqual(decodeEscapeDraft(encodeEscapeDraft(plan), defaults, knownIds, roomOptionsByStay), {
    draft: plan, hasSavedDraft: true, recovered: false,
  });
  for (const roomOptionId of ['cloudline-cabin-standard', 'removed-option', 123, {}]) {
    const raw = JSON.stringify({ version: 1, draft: { ...plan, roomOptionId } });
    const restored = decodeEscapeDraft(raw, defaults, knownIds, roomOptionsByStay);
    assert.deepEqual(restored, {
      draft: { ...plan, roomOptionId: null }, hasSavedDraft: true, recovered: true,
    });
  }
  for (const roomCount of [0, 2, '1', null]) {
    const raw = JSON.stringify({ version: 1, draft: { ...plan, roomCount } });
    assert.deepEqual(decodeEscapeDraft(raw, defaults, knownIds, roomOptionsByStay), {
      draft: plan, hasSavedDraft: true, recovered: true,
    });
  }
});

test('saving requires the option to belong to the property and support the budget and guest count', () => {
  const plan = { ...defaults, stayId: 'fern-house', roomOptionId: 'fern-house-standard', roomCount: 1 };
  assert.equal(canSaveEscapeDraft(plan, previews, '2026-11-01', roomOptionsByStay), true);
  for (const patch of [
    { roomOptionId: 'cloudline-cabin-standard' }, { roomOptionId: 'missing' },
    { roomOptionId: 123 }, { roomCount: 2 }, { roomCount: null }, { stayId: null },
  ]) {
    assert.equal(canSaveEscapeDraft({ ...plan, ...patch }, previews, '2026-11-01', roomOptionsByStay), false);
  }
  assert.equal(canSaveEscapeDraft(plan, previews, '2026-11-01'), false);
  for (const patch of [{ capacity: 1 }, { capacity: 5 }, { nightlyRate: 16000 }, { nightlyRate: 0 }, { nightlyRate: Infinity }]) {
    const invalidOptions = { 'fern-house': [{ ...roomOptionsByStay['fern-house'][0], ...patch }] };
    assert.equal(canSaveEscapeDraft(plan, previews, '2026-11-01', invalidOptions), false);
  }
});

test('changing property clears its accommodation while atomic property and option selection is preserved', () => {
  const plan = { ...defaults, stayId: 'fern-house', roomOptionId: 'fern-house-standard', roomCount: 1 };
  assert.deepEqual(mergeEscapeDraft(plan, { stayId: 'cloudline-cabin' }), {
    ...plan, stayId: 'cloudline-cabin', roomOptionId: null,
  });
  assert.equal(mergeEscapeDraft(plan, { stayId: null }).roomOptionId, null);
  assert.equal(mergeEscapeDraft(plan, { guests: 3 }).roomOptionId, 'fern-house-standard');
  assert.equal(mergeEscapeDraft(plan, {
    stayId: 'cloudline-cabin', roomOptionId: 'cloudline-cabin-standard', roomCount: 1,
  }).roomOptionId, 'cloudline-cabin-standard');
});

test('search edits leave a previously saved trip snapshot intact', () => {
  const savedDraft = Object.freeze({ ...defaults, stayId: 'fern-house', roomOptionId: 'fern-house-standard', roomCount: 1 });
  const nextSearch = mergeEscapeDraft(savedDraft, { query: 'homestay', guests: 2, stayId: null });
  assert.equal(nextSearch.stayId, null);
  assert.equal(nextSearch.roomOptionId, null);
  assert.equal(nextSearch.query, 'homestay');
  assert.equal(savedDraft.stayId, 'fern-house');
  assert.equal(savedDraft.roomOptionId, 'fern-house-standard');
  assert.equal(savedDraft.query, '');
  assert.notEqual(nextSearch, savedDraft);
});

test('legacy property categories migrate without losing dates, stay or accommodation identity', () => {
  const legacyDraft = { ...defaults, stayId: 'cloudline-cabin', stayStyle: 'cabin', roomOptionId: 'cloudline-cabin-standard' };
  const originalRecord = JSON.stringify({ version: 1, draft: legacyDraft });
  const result = decodeEscapeDraft(originalRecord, defaults, knownIds, roomOptionsByStay);
  assert.deepEqual(result, {
    draft: { ...legacyDraft, stayStyle: 'homestay' }, hasSavedDraft: true, recovered: false,
  });
  assert.equal(canSaveEscapeDraft(result.draft, previews, '2026-11-01', roomOptionsByStay), true);
  assert.equal(JSON.parse(originalRecord).draft.stayStyle, 'cabin');
});
