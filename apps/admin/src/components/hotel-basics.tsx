import { useState, type FormEvent } from 'react';
import { Field, Input, Select, TextArea } from '@/components/ui';
import type { Database } from '@/lib/database.types';

type StayStyle = Database['public']['Enums']['stay_style'];
export type Basics = {
  name: string; stay_style: StayStyle; area: string; tagline: string; description: string;
  check_in_time: string; check_out_time: string; house_rules: string; cancellation_policy: string;
};

export const emptyBasics: Basics = {
  name: '', stay_style: 'cottage', area: '', tagline: '', description: '',
  check_in_time: '14:00', check_out_time: '11:00', house_rules: '', cancellation_policy: 'Free cancellation until 48 hours before check-in.',
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
    <Field label="House rules"><TextArea rows={3} value={values.house_rules} onChange={(event) => set('house_rules', event.target.value)} placeholder="No loud music after 10 pm" /></Field>
    <Field label="Cancellation policy"><TextArea rows={2} value={values.cancellation_policy} onChange={(event) => set('cancellation_policy', event.target.value)} /></Field>
    {error ? <p className="rounded-xl bg-danger-soft px-4 py-3 text-[13px] text-danger">{error}</p> : null}
  </form>;
}
