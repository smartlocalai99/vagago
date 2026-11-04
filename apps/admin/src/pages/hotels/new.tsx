import { useRouter } from 'next/router';
import { useState } from 'react';
import { BasicsForm, emptyBasics, type Basics } from '@/components/hotel-basics';
import { Shell } from '@/components/shell';
import { Button } from '@/components/ui';
import { createProperty } from '@/lib/data';
import { slugify } from '@/lib/format';

export default function NewHotel() {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function create(values: Basics) {
    setBusy(true);
    setError(null);
    try {
      const id = await createProperty({ ...values, slug: slugify(values.name), status: 'draft' });
      await router.replace(`/hotels/edit/?id=${id}&step=location`);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Couldn’t create the hotel.');
      setBusy(false);
    }
  }

  return <Shell title="Add hotel" back="/hotels/" footer={<Button form="basics" type="submit" className="w-full" disabled={busy}>{busy ? 'Creating…' : 'Save and continue'}</Button>}>
    <p className="px-4 pt-4 text-[13px] text-muted">Step 1 of 6 · The hotel stays hidden from guests until you publish it.</p>
    {error ? <p className="mx-4 mt-3 rounded-xl bg-danger-soft px-4 py-3 text-[13px] text-danger">{error}</p> : null}
    <BasicsForm formId="basics" initial={emptyBasics} onSubmit={(values) => void create(values)} />
  </Shell>;
}
