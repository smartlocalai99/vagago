import { useEffect, useState, type FormEvent } from 'react';
import { Icon } from '@/components/icons';
import { guest, type Trip } from '@/lib/guest';

const categories = [
  { key: 'accommodation_rating', label: 'Accommodation' },
  { key: 'connectivity_rating', label: 'Connectivity' },
  { key: 'cleanliness_rating', label: 'Cleanliness' },
] as const;
type Scores = Record<(typeof categories)[number]['key'], number>;

function StarPicker({ label, value, onChange }: { label: string; value: number; onChange: (value: number) => void }) {
  return <div className="flex items-center justify-between gap-4">
    <span className="text-[15px] font-semibold">{label}</span>
    <span role="radiogroup" aria-label={label} className="flex">
      {[1, 2, 3, 4, 5].map((star) => <button key={star} type="button" role="radio" aria-checked={value === star} aria-label={`${star} out of 5`} onClick={() => onChange(star)}
        className={`grid size-10 place-items-center transition-transform active:scale-90 ${star <= value ? 'text-[#E9A23B] [&_path]:fill-current' : 'text-line'}`}>
        <Icon name="star" size={24} />
      </button>)}
    </span>
  </div>;
}

// Guests rate a completed stay; it is published on the website after an admin checks it.
export function ReviewForm({ trip }: { trip: Trip }) {
  const [existing, setExisting] = useState<{ status: string } | null | undefined>(undefined);
  const [scores, setScores] = useState<Scores>({ accommodation_rating: 0, connectivity_rating: 0, cleanliness_rating: 0 });
  const [comment, setComment] = useState('');
  const [name, setName] = useState(trip.guest_name.split(' ')[0] ?? '');
  const [failure, setFailure] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    void guest().from('reviews').select('status').eq('reservation_id', trip.id).maybeSingle().then(({ data }) => setExisting(data ?? null));
  }, [trip.id]);

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    if (Object.values(scores).some((score) => score === 0)) { setFailure('Rate all three to send your review.'); return; }
    if (comment.trim().length < 10) { setFailure('Write a few words about your stay.'); return; }
    if (!name.trim()) { setFailure('Add the name to show with your review.'); return; }
    setBusy(true);
    setFailure(null);
    const { data: session } = await guest().auth.getSession();
    const values = Object.values(scores);
    const { error } = await guest().from('reviews').insert({
      reservation_id: trip.id, property_id: trip.property_id, customer_id: session.session?.user.id ?? '',
      rating: Math.round(values.reduce((sum, value) => sum + value, 0) / values.length), comment: comment.trim(), author_name: name.trim(), ...scores,
    });
    setBusy(false);
    if (error) setFailure('Couldn’t send your review. Please try again.');
    else setExisting({ status: 'pending' });
  };

  if (existing === undefined) return null;
  if (existing) return <section className="mt-8 flex items-center gap-3 rounded-2xl bg-forest-soft p-5 text-forest">
    <Icon name="check" className="shrink-0" />
    <p className="text-[15px]">{existing.status === 'published' ? 'Thanks for your review. It’s live on VagaGo.' : 'Thanks for your review. It appears on VagaGo once our team has checked it.'}</p>
  </section>;

  return <form onSubmit={(event) => void submit(event)} className="mt-8 rounded-2xl border border-line p-5 sm:p-6">
    <h2 className="text-[20px] font-bold">Rate your stay</h2>
    <p className="mt-1 text-[14px] text-muted">Your review helps other guests choose. It is shown with your first name.</p>
    <div className="mt-4 space-y-1">{categories.map((item) => <StarPicker key={item.key} label={item.label} value={scores[item.key]} onChange={(value) => setScores((current) => ({ ...current, [item.key]: value }))} />)}</div>
    <label className="mt-4 block"><span className="text-[14px] font-bold">Your review</span>
      <textarea value={comment} onChange={(event) => setComment(event.target.value)} rows={3} maxLength={600} placeholder="What did you enjoy? Anything others should know?"
        className="mt-1.5 w-full resize-none rounded-xl border border-line px-4 py-3 text-[16px] outline-none focus:border-forest" />
    </label>
    <label className="mt-3 block"><span className="text-[14px] font-bold">Name to show</span>
      <input value={name} onChange={(event) => setName(event.target.value)} maxLength={60} className="mt-1.5 w-full rounded-xl border border-line px-4 py-3 text-[16px] outline-none focus:border-forest" />
    </label>
    {failure ? <p role="alert" className="mt-3 text-[14px] text-danger">{failure}</p> : null}
    <button type="submit" disabled={busy} className="mt-4 min-h-12 w-full rounded-xl bg-forest text-[15px] font-bold text-white disabled:opacity-50">{busy ? 'Sending…' : 'Send review'}</button>
  </form>;
}
