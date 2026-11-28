// House rules a property sets as allowed (true) or not allowed (false); a missing key means not stated.
// Stored on properties.house_policies; the database check lists the same keys, and the app reads
// them from packages/domain. Order is the order guests see them.
export type HouseRuleKey = 'couples' | 'local_id' | 'pets' | 'kids' | 'smoking' | 'alcohol' | 'parties' | 'visitors' | 'outside_food' | 'bonfire' | 'music';
export type HousePolicies = Partial<Record<HouseRuleKey, boolean>>;

export const houseRuleOptions: { key: HouseRuleKey; yes: string; no: string }[] = [
  { key: 'couples', yes: 'Couple friendly', no: 'Unmarried couples not allowed' },
  { key: 'local_id', yes: 'Local IDs accepted', no: 'Local IDs not accepted' },
  { key: 'pets', yes: 'Pet friendly', no: 'No pets' },
  { key: 'kids', yes: 'Kids welcome', no: 'Not suitable for kids' },
  { key: 'smoking', yes: 'Smoking allowed', no: 'No smoking' },
  { key: 'alcohol', yes: 'Alcohol allowed', no: 'No alcohol' },
  { key: 'parties', yes: 'Parties and events allowed', no: 'No parties or events' },
  { key: 'visitors', yes: 'Visitors allowed', no: 'No outside visitors' },
  { key: 'outside_food', yes: 'Outside food allowed', no: 'No outside food' },
  { key: 'bonfire', yes: 'Bonfire allowed', no: 'No bonfire' },
  { key: 'music', yes: 'Music allowed', no: 'No loud music' },
];

export function statedHouseRules(policies: unknown): { key: HouseRuleKey; allowed: boolean; label: string }[] {
  if (!policies || typeof policies !== 'object' || Array.isArray(policies)) return [];
  const record = policies as Record<string, unknown>;
  return houseRuleOptions.flatMap((rule) => typeof record[rule.key] === 'boolean'
    ? [{ key: rule.key, allowed: record[rule.key] as boolean, label: record[rule.key] ? rule.yes : rule.no }] : []);
}
