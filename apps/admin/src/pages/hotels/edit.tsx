import { useRouter } from 'next/router';
import { useEffect, useRef, useState } from 'react';
import { BasicsForm, type Basics } from '@/components/hotel-basics';
import { AmenitiesStep, checklist, LocationStep, PhotosStep, PublishStep, RoomsStep } from '@/components/hotel-steps';
import { Icon } from '@/components/icons';
import { Shell } from '@/components/shell';
import { Button, Empty, Loading } from '@/components/ui';
import { updateProperty, useProperty } from '@/lib/data';

const steps = [
  { id: 'basics', label: 'Basics' },
  { id: 'location', label: 'Location' },
  { id: 'rooms', label: 'Rooms' },
  { id: 'photos', label: 'Photos' },
  { id: 'amenities', label: 'Amenities' },
  { id: 'publish', label: 'Publish' },
] as const;
type Step = (typeof steps)[number]['id'];

export default function EditHotel() {
  const router = useRouter();
  const id = typeof router.query.id === 'string' ? router.query.id : undefined;
  const step = (steps.find((item) => item.id === router.query.step)?.id ?? 'basics') as Step;
  const { data: hotel, isLoading, error: loadError } = useProperty(id);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const nav = useRef<HTMLDivElement>(null);
  const index = steps.findIndex((item) => item.id === step);

  useEffect(() => {
    nav.current?.querySelector('[aria-current="step"]')?.scrollIntoView({ inline: 'center', block: 'nearest' });
    window.scrollTo({ top: 0 });
  }, [step]);

  if (!router.isReady || isLoading) return <Shell title="Hotel" back="/hotels/"><Loading /></Shell>;
  if (!hotel) return <Shell title="Hotel" back="/hotels/"><Empty icon="building" title="Hotel not found" body={loadError?.message ?? 'It may have been deleted.'} /></Shell>;

  const go = (next: string) => {
    setError(null);
    void router.replace({ query: { id, step: next } }, undefined, { shallow: true });
  };
  const next = () => go(steps[Math.min(index + 1, steps.length - 1)].id);
  const done = Object.fromEntries(checklist(hotel).map((item) => [item.step, item.done]));
  const stepProps = { hotel, formId: step, onDone: next, onError: setError };

  const saveBasics = async (values: Basics) => {
    setSaving(true);
    setError(null);
    try {
      await updateProperty(hotel.id, values);
      next();
    } catch (caught) { setError(caught instanceof Error ? caught.message : 'Couldn’t save.'); }
    setSaving(false);
  };

  const footer = step === 'publish' ? undefined
    : step === 'rooms' || step === 'photos'
      ? <Button type="button" className="w-full" onClick={next}>Continue</Button>
      : <Button type="submit" form={step} className="w-full" disabled={saving}>{saving ? 'Saving…' : 'Save and continue'}</Button>;

  return <Shell title={hotel.name} back="/hotels/" footer={footer}>
    <div ref={nav} className="sticky top-14 z-10 flex gap-1 overflow-x-auto border-b border-line bg-white px-3 py-2">
      {steps.map((item, position) => <button key={item.id} type="button" aria-current={item.id === step ? 'step' : undefined} onClick={() => go(item.id)}
        className={`flex shrink-0 items-center gap-1.5 rounded-full px-3 py-2 text-[13px] font-semibold ${item.id === step ? 'bg-forest text-white' : 'text-ink'}`}>
        {done[item.id] ? <Icon name="check" size={14} /> : <span className="tabular-nums opacity-60">{position + 1}</span>}{item.label}
      </button>)}
    </div>
    {error ? <p role="alert" className="mx-4 mt-4 rounded-xl bg-danger-soft px-4 py-3 text-[13px] text-danger">{error}</p> : null}
    {step === 'basics' ? <BasicsForm key={hotel.id} formId="basics" onSubmit={(values) => void saveBasics(values)} initial={{
      name: hotel.name, stay_style: hotel.stay_style, area: hotel.area, tagline: hotel.tagline ?? '', description: hotel.description ?? '',
      check_in_time: hotel.check_in_time.slice(0, 5), check_out_time: hotel.check_out_time.slice(0, 5),
      house_rules: hotel.house_rules ?? '', cancellation_policy: hotel.cancellation_policy ?? '',
    }} /> : null}
    {step === 'location' ? <LocationStep {...stepProps} /> : null}
    {step === 'rooms' ? <RoomsStep {...stepProps} /> : null}
    {step === 'photos' ? <PhotosStep {...stepProps} /> : null}
    {step === 'amenities' ? <AmenitiesStep {...stepProps} /> : null}
    {step === 'publish' ? <PublishStep {...stepProps} onJump={go} /> : null}
  </Shell>;
}
