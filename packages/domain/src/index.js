/**
 * Pure discovery and planning rules shared by Vagago clients.
 * These rules do not check inventory, create reservations, or quote final prices.
 */

const MILLISECONDS_PER_DAY = 86_400_000;

export const MOODS = Object.freeze(['peaceful', 'adventurous', 'romantic', 'nature']);
export const STAY_STYLES = Object.freeze(['all', 'villa', 'cottage', 'homestay']);

/**
 * @typedef {Object} GetawayDraft
 * @property {string} checkIn A date-only value in YYYY-MM-DD format.
 * @property {string} checkOut A date-only value in YYYY-MM-DD format.
 * @property {number} guests An integer from 1 to 12.
 * @property {number} nightlyBudget An indicative nightly budget in rupees, 1000–50000.
 * @property {'peaceful'|'adventurous'|'romantic'|'nature'|null} [mood]
 * @property {'all'|'villa'|'cottage'|'homestay'} [stayStyle]
 * @property {string} [query] Optional search text, up to 120 characters.
 */

/**
 * Parse a calendar date without using the device's timezone or allowing rollover.
 * @param {unknown} value
 * @returns {{year:number, month:number, day:number, epochDay:number}|null}
 */
export function parseDateOnly(value) {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return null;

  const [year, month, day] = value.split('-').map(Number);
  if (year < 1 || month < 1 || month > 12 || day < 1 || day > 31) return null;

  // setUTCFullYear avoids Date.UTC's special interpretation of years 00–99.
  const date = new Date(0);
  date.setUTCFullYear(year, month - 1, day);
  date.setUTCHours(0, 0, 0, 0);
  if (date.getUTCFullYear() !== year || date.getUTCMonth() !== month - 1 || date.getUTCDate() !== day) {
    return null;
  }

  return { year, month, day, epochDay: date.getTime() / MILLISECONDS_PER_DAY };
}

/**
 * The destination's calendar date, independent of the customer's device timezone.
 * @param {Date|number|string} [now]
 * @returns {string}
 */
export function getTodayInKolkata(now = new Date()) {
  const date = now instanceof Date ? now : new Date(now);
  if (!Number.isFinite(date.getTime())) throw new TypeError('A valid instant is required.');

  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Kolkata',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(date);
  const part = (type) => parts.find((item) => item.type === type).value;
  return `${part('year')}-${part('month')}-${part('day')}`;
}

function isValidGuests(value) {
  return Number.isInteger(value) && value >= 1 && value <= 12;
}

function isValidBudget(value) {
  return typeof value === 'number' && Number.isFinite(value) && value >= 1000 && value <= 50000;
}

function isValidMood(value) {
  return value === undefined || value === null || MOODS.includes(value);
}

function isValidStyle(value) {
  return value === undefined || STAY_STYLES.includes(value);
}

function isValidQuery(value) {
  return value === undefined || (typeof value === 'string' && value.length <= 120);
}

/**
 * Validate a complete editable plan. This says nothing about live availability.
 * Optional selectors default to any mood, all styles, and an empty query.
 * @param {GetawayDraft|unknown} draft
 * @param {{today?:string}} [options] Inject a date-only today for deterministic tests.
 * @returns {{valid:boolean, errors:Record<string,string>, nights:number|null}}
 */
export function validateGetawayDraft(draft, { today = getTodayInKolkata() } = {}) {
  const todayDate = parseDateOnly(today);
  if (!todayDate) throw new TypeError('today must be a valid YYYY-MM-DD date.');

  const value = draft && typeof draft === 'object' && !Array.isArray(draft) ? draft : {};
  const errors = {};
  const arrival = parseDateOnly(value.checkIn);
  const departure = parseDateOnly(value.checkOut);
  const nights = arrival && departure ? departure.epochDay - arrival.epochDay : null;

  if (!arrival) errors.checkIn = 'Enter a valid arrival date (YYYY-MM-DD).';
  else if (arrival.epochDay < todayDate.epochDay) errors.checkIn = 'Choose today or a later arrival date.';

  if (!departure) errors.checkOut = 'Enter a valid departure date (YYYY-MM-DD).';
  else if (arrival && nights <= 0) errors.checkOut = 'Departure must be after arrival.';
  else if (arrival && nights > 30) errors.checkOut = 'Plan a stay of 30 nights or fewer.';

  if (!isValidGuests(value.guests)) errors.guests = 'Choose between 1 and 12 guests.';
  if (!isValidBudget(value.nightlyBudget)) errors.nightlyBudget = 'Choose a nightly budget between ₹1,000 and ₹50,000.';
  if (!isValidMood(value.mood)) errors.mood = 'Choose a supported mood.';
  if (!isValidStyle(value.stayStyle)) errors.stayStyle = 'Choose a supported stay style.';
  if (!isValidQuery(value.query)) errors.query = 'Keep your search to 120 characters or fewer.';

  return { valid: Object.keys(errors).length === 0, errors, nights };
}

/**
 * @typedef {Object} PreviewStay
 * @property {string} id
 * @property {string} name
 * @property {string} [description]
 * @property {string} [area]
 * @property {string} [setting]
 * @property {number} capacity
 * @property {number} nightlyRate Indicative nightly rupees, not a live price.
 * @property {Array<'peaceful'|'adventurous'|'romantic'|'nature'>} moods
 * @property {'villa'|'cottage'|'homestay'} stayStyle
 */

/**
 * Filter static preview descriptions. Dates deliberately do not filter these
 * results: only a server can establish whether a room is available for a date.
 * Invalid filters return no matches instead of silently broadening results.
 * @template {PreviewStay} T
 * @param {T[]} stays
 * @param {Partial<GetawayDraft>} [filters]
 * @returns {T[]}
 */
export function matchPreviewStays(stays, filters = {}) {
  if (!Array.isArray(stays) || !filters || typeof filters !== 'object' || Array.isArray(filters)) return [];
  const { guests, nightlyBudget, mood, stayStyle, query } = filters;
  if ((guests !== undefined && !isValidGuests(guests))
    || (nightlyBudget !== undefined && !isValidBudget(nightlyBudget))
    || !isValidMood(mood) || !isValidStyle(stayStyle) || !isValidQuery(query)) return [];

  const normalizedQuery = (query ?? '').trim().toLocaleLowerCase();
  return stays.filter((stay) => {
    if (!stay || typeof stay.name !== 'string' || !Number.isInteger(stay.capacity) || stay.capacity < 1
      || !Number.isFinite(stay.nightlyRate) || stay.nightlyRate <= 0 || !Array.isArray(stay.moods)
      || !STAY_STYLES.slice(1).includes(stay.stayStyle)) return false;
    if (guests !== undefined && stay.capacity < guests) return false;
    if (nightlyBudget !== undefined && stay.nightlyRate > nightlyBudget) return false;
    if (mood && !stay.moods.includes(mood)) return false;
    if (stayStyle && stayStyle !== 'all' && stay.stayStyle !== stayStyle) return false;
    if (normalizedQuery) {
      const searchable = `${stay.name} ${stay.area ?? ''} ${stay.setting ?? ''} ${stay.description ?? ''} ${stay.stayStyle} ${stay.moods.join(' ')}`.toLocaleLowerCase();
      if (!searchable.includes(normalizedQuery)) return false;
    }
    return true;
  });
}

/**
 * Show an illustrative accommodation subtotal for a preview plan. This does not
 * include taxes, fees, discounts, availability, or a binding payment quote.
 * @param {number} nightlyRate Indicative nightly rupees.
 * @param {string} checkIn
 * @param {string} checkOut
 * @returns {{kind:'illustrative-estimate', nights:number, nightlyRate:number, subtotal:number, currency:'INR', includesTaxesAndFees:false, availabilityChecked:false}|null}
 */
export function estimateStaySubtotal(nightlyRate, checkIn, checkOut) {
  const arrival = parseDateOnly(checkIn);
  const departure = parseDateOnly(checkOut);
  if (!arrival || !departure || typeof nightlyRate !== 'number' || !Number.isFinite(nightlyRate) || nightlyRate <= 0) return null;
  const nights = departure.epochDay - arrival.epochDay;
  const rateInPaise = Math.round(nightlyRate * 100);
  if (nights < 1 || nights > 30 || !Number.isSafeInteger(rateInPaise * nights) || rateInPaise < 1) return null;

  return {
    kind: 'illustrative-estimate',
    nights,
    nightlyRate: rateInPaise / 100,
    subtotal: rateInPaise * nights / 100,
    currency: 'INR',
    includesTaxesAndFees: false,
    availabilityChecked: false,
  };
}
