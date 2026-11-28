export type Mood = 'peaceful' | 'adventurous' | 'romantic' | 'nature';
export type StayStyle = 'all' | 'villa' | 'cottage' | 'homestay' | 'resort' | 'hotel';
export type GetawayDraft = {
  checkIn: string;
  checkOut: string;
  guests: number;
  nightlyBudget: number;
  mood?: Mood | null;
  stayStyle?: StayStyle;
  query?: string;
};
export type PreviewStay = {
  id: string;
  name: string;
  description?: string;
  area?: string;
  setting?: string;
  capacity: number;
  nightlyRate: number;
  moods: Mood[];
  stayStyle: Exclude<StayStyle, 'all'>;
};
export const MOODS: readonly Mood[];
export const STAY_STYLES: readonly StayStyle[];
export function parseDateOnly(value: unknown): { year: number; month: number; day: number; epochDay: number } | null;
export function getTodayInKolkata(now?: Date | number | string): string;
export function validateGetawayDraft(draft: unknown, options?: { today?: string }): {
  valid: boolean;
  errors: Record<string, string>;
  nights: number | null;
};
export function matchPreviewStays<T extends PreviewStay>(stays: T[], filters?: Partial<GetawayDraft>): T[];
export function estimateStaySubtotal(nightlyRate: number, checkIn: string, checkOut: string): {
  kind: 'illustrative-estimate';
  nights: number;
  nightlyRate: number;
  subtotal: number;
  currency: 'INR';
  includesTaxesAndFees: false;
  availabilityChecked: false;
} | null;
export type HouseRuleKey = 'couples' | 'local_id' | 'pets' | 'kids' | 'smoking' | 'alcohol' | 'parties' | 'visitors' | 'outside_food' | 'bonfire' | 'music';
export type HousePolicies = Partial<Record<HouseRuleKey, boolean>>;
export const houseRuleOptions: { key: HouseRuleKey; yes: string; no: string }[];
export function statedHouseRules(policies: unknown): { key: HouseRuleKey; allowed: boolean; label: string }[];
