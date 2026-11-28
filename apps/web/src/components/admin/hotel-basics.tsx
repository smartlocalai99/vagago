import { useState, type FormEvent } from 'react';
import { Field, Input, Select, TextArea } from '@/components/admin/ui';
import { houseRuleOptions, type HousePolicies, type HouseRuleKey } from '@/lib/house-rules';
import type { Database } from '@/lib/database.types';

type StayStyle = Database['public']['Enums']['stay_style'];
export type Basics = {
  name: string; stay_style: StayStyle; area: string; tagline: string; description: string;
  check_in_time: string; check_out_time: string; house_rules: string; house_policies: HousePolicies; cancellation_policy: string;
};

export const emptyBasics: Basics = {
  name: '', stay_style: 'cottage', area: '', tagline: '', description: '',
  check_in_time: '14:00', check_out_time: '11:00', house_rules: '', house_policies: {}, cancellation_policy: 'Free cancellation until 48 hours before check-in.',
};

const styles: { value: StayStyle; label: string }[] = [
  { value: 'cottage', label: 'Cottage' }, { value: 'homestay', label: 'Homestay' }, { value: 'villa', label: 'Villa' },
  { value: 'resort', label: 'Resort' }, { value: 'hotel', label: 'Hotel' },
];

export function BasicsForm({ initial, formId, onSubmit }: { initial: Basics; formId: string; onSubmit: (values: Basics) => void }) {
  const [values, setValues] = useState(initial);
  const [error, setError] = useState<string | null>(null);
  const set = <K extends keyof Basics>(key: K, value: Basics[K]) => setValues((current) => ({ ...current, [key]: value }));
  const submit = (event: FormEvent) => {
    event.preventDefault();
    if (values.name.trim().length < 2) return setError('Enter the hotel name.');
    if (!values.area.trim()) return setError('Enter the area, for example “Near Pine Forest”.');
    setError(null);
    onSubmit({ ...values, name: values.name.trim(), area: values.area.trim() });
  };
  return <form id={formId} onSubmit={submit} className="space-y-5 px-4 pt-5">
    <Field label="Hotel name"><Input value={values.name} onChange={(event) => set('name', event.target.value)} maxLength={120} placeholder="The Fern House" /></Field>
    <Field label="Type of stay">
      <Select value={values.stay_style} onChange={(event) => set('stay_style', event.target.value as StayStyle)}>
        {styles.map((style) => <option key={style.value} value={style.value}>{style.label}</option>)}
      </Select>
    </Field>
    <Field label="Area" hint="Shown to guests before they book. The exact address stays hidden."><Input value={values.area} onChange={(event) => set('area', event.target.value)} maxLength={80} placeholder="Near Pine Forest" /></Field>
    <Field label="Tagline"><Input value={values.tagline} onChange={(event) => set('tagline', event.target.value)} maxLength={160} placeholder="For mornings that take their time." /></Field>
    <Field label="Description"><TextArea value={values.description} onChange={(event) => set('description', event.target.value)} placeholder="What makes this stay special?" /></Field>
    <div className="grid grid-cols-2 gap-3">
      <Field label="Check-in from"><Input type="time" value={values.check_in_time} onChange={(event) => set('check_in_time', event.target.value)} /></Field>
      <Field label="Check-out by"><Input type="time" value={values.check_out_time} onChange={(event) => set('check_out_time', event.target.value)} /></Field>
    </div>
    <HouseRulesPicker value={values.house_policies} onChange={(next) => set('house_policies', next)} />
    <Field label="Other house rules" hint="Anything the options above don’t cover."><TextArea rows={3} value={values.house_rules} onChange={(event) => set('house_rules', event.target.value)} placeholder="Quiet hours after 10 pm. Bonfire only in the fire pit." /></Field>
    <Field label="Cancellation policy"><TextArea rows={2} value={values.cancellation_policy} onChange={(event) => set('cancellation_policy', event.target.value)} /></Field>
    {error ? <p className="rounded-xl bg-danger-soft px-4 py-3 text-[13px] text-danger">{error}</p> : null}
  </form>;
}

const ruleGroups: { title: string; keys: HouseRuleKey[] }[] = [
  { title: 'Who can stay', keys: ['couples', 'local_id', 'kids', 'pets', 'visitors'] },
  { title: 'At the property', keys: ['smoking', 'alcohol', 'parties', 'outside_food', 'bonfire', 'music'] },
];

// Each rule is Allowed, Not allowed, or left unset (guests then see nothing for it). Tap a chosen answer again to clear it.
function HouseRulesPicker({ value, onChange }: { value: HousePolicies; onChange: (next: HousePolicies) => void }) {
  const choose = (key: HouseRuleKey, allowed: boolean) => {
    const next = { ...value };
    if (next[key] === allowed) delete next[key];
    else next[key] = allowed;
    onChange(next);
  };
  const stated = Object.keys(value).length;
  return <fieldset className="space-y-4">
    <div className="flex items-baseline justify-between gap-3">
      <legend className="text-[13px] font-semibold">House rules</legend>
      <span className="text-[12px] text-muted">{stated} of {houseRuleOptions.length} set</span>
    </div>
    {ruleGroups.map((group) => <div key={group.title} className="overflow-hidden rounded-2xl border border-line">
      <p className="bg-surface px-4 py-2.5 text-[12px] font-bold text-muted">{group.title}</p>
      {group.keys.map((key) => {
        const rule = houseRuleOptions.find((item) => item.key === key)!;
        const current = value[key];
        return <div key={key} className="flex items-center gap-3 border-t border-line px-4 py-3">
          <div className="min-w-0 flex-1">
            <p className="text-[14px] font-semibold">{rule.yes}</p>
            <p className={`text-[12px] ${current === undefined ? 'text-muted' : current ? 'text-ok' : 'text-danger'}`}>{current === undefined ? 'Not set' : current ? `Guests see “${rule.yes}”` : `Guests see “${rule.no}”`}</p>
          </div>
          <div role="radiogroup" aria-label={rule.yes} className="flex shrink-0 rounded-full bg-surface p-1">
            <button type="button" role="radio" aria-checked={current === true} onClick={() => choose(key, true)}
              className={`min-h-9 rounded-full px-3.5 text-[13px] font-bold transition-colors ${current === true ? 'bg-ok text-white' : 'text-muted'}`}>Yes</button>
            <button type="button" role="radio" aria-checked={current === false} onClick={() => choose(key, false)}
              className={`min-h-9 rounded-full px-3.5 text-[13px] font-bold transition-colors ${current === false ? 'bg-danger text-white' : 'text-muted'}`}>No</button>
          </div>
        </div>;
      })}
    </div>)}
  </fieldset>;
}
