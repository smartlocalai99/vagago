import { useState } from 'react';
import { Shell } from '@/components/admin/shell';
import { Button, Empty, Loading } from '@/components/admin/ui';
import { setReviewStatus, useReviews, type ReviewRow } from '@/lib/data';
import { fullDate } from '@/lib/format';

const tabs = [{ id: 'pending', label: 'Waiting' }, { id: 'published', label: 'Live' }, { id: 'hidden', label: 'Hidden' }] as const;

function Scores({ review }: { review: ReviewRow }) {
  const rows: [string, number | null][] = [['Accommodation', review.accommodation_rating], ['Connectivity', review.connectivity_rating], ['Cleanliness', review.cleanliness_rating]];
  return <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-[12px] text-muted">{rows.map(([label, value]) => <span key={label}>{label} <b className="text-ink">{value ?? '–'}</b>/5</span>)}</div>;
}

// Guests' reviews appear on the website only after they are published here.
export default function Reviews() {
  const { data, isLoading } = useReviews();
  const [tab, setTab] = useState<(typeof tabs)[number]['id']>('pending');
  const [busy, setBusy] = useState<string | null>(null);
  const list = (data ?? []).filter((review) => review.status === tab);
  const act = async (id: string, status: ReviewRow['status']) => {
    setBusy(id);
    try { await setReviewStatus(id, status); } finally { setBusy(null); }
  };
  return <Shell title="Guest reviews" back="/admin/">
    <div className="flex gap-2 px-4 pt-4">
      {tabs.map((item) => <button key={item.id} onClick={() => setTab(item.id)} className={`rounded-full px-4 py-2 text-[13px] font-bold ${tab === item.id ? 'bg-forest text-white' : 'bg-surface text-ink'}`}>
        {item.label} {data ? `(${data.filter((review) => review.status === item.id).length})` : ''}
      </button>)}
    </div>
    {isLoading ? <div className="mt-4"><Loading /></div> : !list.length ? <Empty icon="star" title="Nothing here" body={tab === 'pending' ? 'New reviews from guests appear here for you to check.' : 'No reviews in this list.'} />
      : <ul className="mt-4 divide-y divide-line border-y border-line">
        {list.map((review) => <li key={review.id} className="px-4 py-4">
          <div className="flex items-baseline justify-between gap-3"><p className="font-bold">{review.author_name ?? 'Guest'}</p><p className="text-[12px] text-muted">{fullDate(review.created_at.slice(0, 10))}</p></div>
          <p className="text-[13px] text-muted">{review.properties?.name ?? 'Stay'} · {review.rating}/5 overall</p>
          <p className="mt-2 text-[15px] leading-6">{review.comment}</p>
          <Scores review={review} />
          <div className="mt-3 flex gap-2">
            {review.status !== 'published' ? <Button className="flex-1" disabled={busy === review.id} onClick={() => void act(review.id, 'published')}>Publish</Button> : null}
            {review.status !== 'hidden' ? <Button variant="secondary" className="flex-1" disabled={busy === review.id} onClick={() => void act(review.id, 'hidden')}>Hide</Button> : null}
          </div>
        </li>)}
      </ul>}
  </Shell>;
}
