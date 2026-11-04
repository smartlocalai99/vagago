import assert from 'node:assert/strict';
import test from 'node:test';
import {
  estimateStaySubtotal,
  getTodayInKolkata,
  matchPreviewStays,
  parseDateOnly,
  validateGetawayDraft,
} from '../src/index.js';

const today = '2026-11-01';
const draft = {
  checkIn: today,
  checkOut: '2026-11-03',
  guests: 2,
  nightlyBudget: 6000,
  mood: null,
  stayStyle: 'all',
};
const stays = [
  { id: 'a', name: 'Mist Cottage', description: 'A garden retreat', capacity: 2, nightlyRate: 4000, moods: ['peaceful', 'nature'], stayStyle: 'cottage' },
  { id: 'b', name: 'Ridge Villa', description: 'A hill escape', capacity: 6, nightlyRate: 9000, moods: ['romantic', 'peaceful'], stayStyle: 'villa' },
  { id: 'c', name: 'Trail Homestay', description: 'By the forest', capacity: 4, nightlyRate: 6000, moods: ['adventurous', 'nature'], stayStyle: 'homestay' },
];

test('calendar dates reject rollovers, malformed strings and non-dates', () => {
  for (const invalid of ['2026-02-29', '2024-02-30', '2100-02-29', '2026-04-31', '2026-13-01', '2026-00-01', '2026-01-00', '2026-1-01', '0000-01-01', '2026-11-01T00:00:00Z', '', null, 20261101]) {
    assert.equal(parseDateOnly(invalid), null, String(invalid));
  }
  assert.equal(parseDateOnly('2024-02-29').day, 29);
  assert.equal(parseDateOnly('2000-02-29').day, 29);
  assert.equal(parseDateOnly('0099-01-01').year, 99);
});

test('destination today changes at midnight in Kolkata rather than UTC', () => {
  assert.equal(getTodayInKolkata('2026-10-31T18:29:59Z'), '2026-10-31');
  assert.equal(getTodayInKolkata('2026-10-31T18:30:00Z'), '2026-11-01');
  assert.throws(() => getTodayInKolkata('not an instant'), TypeError);
});

test('valid plans accept arrival today and 30 nights, regardless of UTC offsets', () => {
  assert.deepEqual(validateGetawayDraft(draft, { today }), { valid: true, errors: {}, nights: 2 });
  assert.equal(validateGetawayDraft({ ...draft, checkOut: '2026-12-01' }, { today }).valid, true);
  const leapPlan = validateGetawayDraft({ ...draft, checkIn: '2028-02-28', checkOut: '2028-03-01' }, { today });
  assert.equal(leapPlan.nights, 2);
  const yearPlan = validateGetawayDraft({ ...draft, checkIn: '2026-12-31', checkOut: '2027-01-01' }, { today });
  assert.equal(yearPlan.nights, 1);
});

test('plans reject past arrival, same-day departure, reversed dates and overlong stays', () => {
  const cases = [
    [{ checkIn: '2026-10-31' }, 'checkIn'],
    [{ checkOut: today }, 'checkOut'],
    [{ checkOut: '2026-10-31' }, 'checkOut'],
    [{ checkOut: '2026-12-02' }, 'checkOut'],
    [{ checkIn: '2026-02-29' }, 'checkIn'],
  ];
  for (const [changes, field] of cases) {
    const result = validateGetawayDraft({ ...draft, ...changes }, { today });
    assert.equal(result.valid, false);
    assert.ok(result.errors[field]);
  }
  assert.equal(validateGetawayDraft({ ...draft, checkIn: '' }, { today }).nights, null);
  assert.throws(() => validateGetawayDraft(draft, { today: '2026-02-30' }), TypeError);
});

test('guest and budget boundaries are enforced without coercing input', () => {
  for (const guests of [0, 13, 1.5, '2', NaN, Infinity, null]) {
    assert.ok(validateGetawayDraft({ ...draft, guests }, { today }).errors.guests);
  }
  for (const nightlyBudget of [999, 50001, '6000', NaN, Infinity, null]) {
    assert.ok(validateGetawayDraft({ ...draft, nightlyBudget }, { today }).errors.nightlyBudget);
  }
  for (const guests of [1, 12]) {
    for (const nightlyBudget of [1000, 50000]) {
      assert.equal(validateGetawayDraft({ ...draft, guests, nightlyBudget }, { today }).valid, true);
    }
  }
});

test('unsupported selectors and incomplete persisted plans are safely invalid', () => {
  assert.ok(validateGetawayDraft({ ...draft, mood: 'luxury' }, { today }).errors.mood);
  assert.ok(validateGetawayDraft({ ...draft, stayStyle: 'hotel' }, { today }).errors.stayStyle);
  assert.ok(validateGetawayDraft({ ...draft, query: 'x'.repeat(121) }, { today }).errors.query);
  assert.equal(validateGetawayDraft(null, { today }).valid, false);
  assert.equal(validateGetawayDraft([], { today }).valid, false);
});

test('preview matches combine capacity, indicative budget, mood and style', () => {
  assert.deepEqual(matchPreviewStays(stays, { guests: 3, nightlyBudget: 6000, mood: 'nature' }).map((stay) => stay.id), ['c']);
  assert.deepEqual(matchPreviewStays(stays, { stayStyle: 'villa' }).map((stay) => stay.id), ['b']);
  assert.deepEqual(matchPreviewStays(stays, { stayStyle: 'homestay' }).map((stay) => stay.id), ['c']);
  assert.deepEqual(matchPreviewStays(stays, { query: 'homestay' }).map((stay) => stay.id), ['c']);
  assert.deepEqual(matchPreviewStays(stays, { query: '  GARDEN  ' }).map((stay) => stay.id), ['a']);
  assert.equal(matchPreviewStays(stays, { query: 'nonexistent' }).length, 0);
  assert.equal(matchPreviewStays(stays, { stayStyle: 'all', mood: null }).length, 3);
});

test('preview matching never makes a date-availability claim or modifies source records', () => {
  const before = JSON.stringify(stays);
  const matches = matchPreviewStays(stays, { checkIn: '2026-12-31', checkOut: '2027-01-02' });
  assert.equal(matches.length, 3);
  assert.notEqual(matches, stays);
  assert.equal(JSON.stringify(stays), before);
  assert.equal(Object.hasOwn(matches[0], 'available'), false);
});

test('malformed filters return no matches instead of widening the search', () => {
  for (const filters of [{ guests: -1 }, { nightlyBudget: NaN }, { mood: 'unknown' }, { stayStyle: 'hotel' }, { query: 123 }, null, []]) {
    assert.deepEqual(matchPreviewStays(stays, filters), []);
  }
  assert.deepEqual(matchPreviewStays(null), []);
  assert.deepEqual(matchPreviewStays([{ ...stays[0], capacity: '2' }]), []);
});

test('illustrative estimates count calendar nights and explicitly exclude fees and availability', () => {
  assert.deepEqual(estimateStaySubtotal(4000, '2026-11-01', '2026-11-03'), {
    kind: 'illustrative-estimate', nights: 2, nightlyRate: 4000, subtotal: 8000,
    currency: 'INR', includesTaxesAndFees: false, availabilityChecked: false,
  });
  assert.equal(estimateStaySubtotal(1999.99, '2026-12-31', '2027-01-03').subtotal, 5999.97);
  assert.equal(estimateStaySubtotal(4000, '2028-02-28', '2028-03-01').nights, 2);
});

test('estimates reject invalid date ranges and unsafe or invalid rates', () => {
  for (const rate of [0, -1, '4000', Infinity, NaN, Number.MAX_SAFE_INTEGER]) {
    assert.equal(estimateStaySubtotal(rate, '2026-11-01', '2026-11-03'), null);
  }
  assert.equal(estimateStaySubtotal(4000, '2026-02-29', '2026-03-03'), null);
  assert.equal(estimateStaySubtotal(4000, '2026-11-03', '2026-11-03'), null);
  assert.equal(estimateStaySubtotal(4000, '2026-11-03', '2026-11-02'), null);
  assert.equal(estimateStaySubtotal(4000, '2026-11-01', '2026-12-02'), null);
});
