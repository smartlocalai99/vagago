# @vagago/domain

Dependency-free JavaScript rules for customer discovery and editable escape plans.
Import from `@vagago/domain` in workspace clients. Run `npm test --workspace @vagago/domain`
from the repository root, or `npm test` inside this package.

## Exports

| Export | Contract |
| --- | --- |
| `MOODS` | Frozen array: `peaceful`, `adventurous`, `romantic`, `nature`. |
| `STAY_STYLES` | Frozen array: `all`, `villa`, `cottage`, `homestay`. |
| `parseDateOnly(value)` | Validates exact `YYYY-MM-DD`; returns `{year, month, day, epochDay}` or `null`. Dates never roll into another month. |
| `getTodayInKolkata(now?)` | Returns destination calendar date. Invalid instants throw `TypeError`. |
| `validateGetawayDraft(draft, {today?}?)` | Returns `{valid, errors, nights}`. Errors map field names to actionable messages. Missing/invalid dates yield `nights: null`; otherwise `nights` is the calculated difference even when the range is invalid. An invalid injected `today` throws. |
| `matchPreviewStays(stays, filters?)` | Returns a new array of matching preview records. Invalid filter values return `[]`. Dates do not affect matches or imply availability. |
| `estimateStaySubtotal(nightlyRate, checkIn, checkOut)` | Returns the illustrative estimate below, or `null` for invalid rates/dates/range. This is not a booking quote. |

## Draft schema

```js
const draft = {
  checkIn: '2026-11-06',
  checkOut: '2026-11-08',
  guests: 2,               // Integer, 1–12.
  nightlyBudget: 6000,     // Numeric rupees, 1000–50000.
  mood: 'peaceful',        // Optional; null means any mood.
  stayStyle: 'all',        // Optional; omitted also means all.
  query: '',              // Optional; string, at most 120 characters.
};
```

Arrival must be today or later in Asia/Kolkata. Departure must follow arrival,
and stays are limited to 30 nights. A plan is local intent; validation does not
mean that a stay can be reserved. Unknown extra fields are ignored and are not
sanitized: keep persistence schemas explicit.

## Preview stay schema

```js
const previewStay = {
  id: 'sample-cottage',
  name: 'Example Cottage',
  description: 'A sample forest escape',
  capacity: 2,
  nightlyRate: 4000,       // Indicative rupees; clearly label in the UI.
  moods: ['peaceful', 'nature'],
  stayStyle: 'cottage',
};
```

Matching combines capacity, maximum indicative nightly rate, mood, style, and a
case-insensitive text query across name/description/style/moods. It preserves
input order and record references. Sample assets and descriptions must never be
presented as verified or onboarded properties.

## Illustrative estimate schema

```js
{
  kind: 'illustrative-estimate',
  nights: 2,
  nightlyRate: 4000,
  subtotal: 8000,
  currency: 'INR',
  includesTaxesAndFees: false,
  availabilityChecked: false,
}
```

Display this as an estimate excluding taxes and fees. Do not use it for checkout.
Future shared server APIs must own live rates, tax/fee calculation, room holds,
transactional inventory allocation, payment verification, and confirmations.
Customer, hotel, and admin clients must all read that same reservation system;
hotel membership must be enforced server-side for every property operation.
