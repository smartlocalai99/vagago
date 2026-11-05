import type { GetStaticProps } from 'next';
import { useRouter } from 'next/router';
import { Icon } from '@/components/icons';
import { SiteLayout } from '@/components/site/layout';
import { SearchForm, StayCard } from '@/components/site/stay-parts';
import { dayMonth } from '@/lib/format';
import { discountPercent, fetchListings, styleLabel, type Listing } from '@/lib/listings';
import { readTrip } from '@/lib/trip';

type Props = { stays: Listing[] };

export const getStaticProps: GetStaticProps<Props> = async () => {
  try {
    return { props: { stays: await fetchListings() }, revalidate: 300 };
  } catch {
    return { props: { stays: [] }, revalidate: 60 };
  }
};

const sorts = [
  { id: 'recommended', label: 'Recommended' },
  { id: 'low', label: 'Price: low to high' },
  { id: 'high', label: 'Price: high to low' },
  { id: 'savings', label: 'Biggest savings' },
] as const;
type SortId = (typeof sorts)[number]['id'];

function sortStays(stays: Listing[], sort: SortId) {
  const sorted = [...stays];
  if (sort === 'low') sorted.sort((a, b) => a.rate - b.rate);
  if (sort === 'high') sorted.sort((a, b) => b.rate - a.rate);
  if (sort === 'savings') sorted.sort((a, b) => discountPercent(b.rate, b.compareAt) - discountPercent(a.rate, a.compareAt) || a.rate - b.rate);
  return sorted;
}

export default function Stays({ stays }: Props) {
  const router = useRouter();
  // The page is pre-rendered once; search terms arrive in the URL and are applied in the browser.
  const trip = readTrip(router.query);
  const q = typeof router.query.q === 'string' ? router.query.q.trim().toLowerCase() : '';
  const sort = (sorts.find((item) => item.id === router.query.sort)?.id ?? 'recommended') as SortId;
  const results = sortStays(stays.filter((stay) => stay.capacity >= trip.guests
    && (!q || `${stay.name} ${stay.area} ${stay.description} ${styleLabel[stay.style]}`.toLowerCase().includes(q))), sort);
  const setSort = (value: SortId) => void router.replace({ query: { ...router.query, sort: value } }, undefined, { shallow: true, scroll: false });

  return <SiteLayout title="Stays in Vagamon" description="Compare cottages, homestays and villas in Vagamon with nightly prices for your dates. Pay at the stay.">
    <div className="border-b border-line bg-surface">
      <div className="mx-auto max-w-[1200px] px-4 py-5 sm:px-6">
        <SearchForm key={router.isReady ? router.asPath : 'initial'} trip={trip} query={typeof router.query.q === 'string' ? router.query.q : ''} variant="compact" />
      </div>
    </div>
    <section className="mx-auto max-w-[1200px] px-4 pt-8 sm:px-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-[28px] font-extrabold tracking-[-0.025em] md:text-[32px]">{results.length} {results.length === 1 ? 'stay' : 'stays'} in Vagamon</h1>
          <p className="mt-1 text-[15px] text-muted">{dayMonth(trip.checkIn)} – {dayMonth(trip.checkOut)}, {trip.guests} {trip.guests === 1 ? 'guest' : 'guests'}{q ? `, matching “${router.query.q}”` : ''}</p>
        </div>
        <label className="flex items-center gap-2 rounded-full border border-line px-4 py-2 text-[15px] font-semibold">
          <span className="text-muted">Sort by</span>
          <select value={sort} onChange={(event) => setSort(event.target.value as SortId)} className="appearance-none bg-transparent font-bold outline-none">
            {sorts.map((item) => <option key={item.id} value={item.id}>{item.label}</option>)}
          </select>
          <Icon name="chevron" size={14} className="rotate-90" />
        </label>
      </div>
      {results.length ? <div className="mt-7 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">{results.map((stay) => <StayCard key={stay.id} stay={stay} trip={trip} />)}</div>
        : <div className="mt-10 rounded-2xl bg-surface px-6 py-12 text-center">
          <p className="text-[18px] font-bold">No stays match this search</p>
          <p className="mt-1 text-[15px] text-muted">Try another stay name or place, or fewer guests.</p>
          <button onClick={() => void router.push('/stays/')} className="mt-5 rounded-full bg-forest px-5 py-2.5 text-[15px] font-bold text-white">Clear search</button>
        </div>}
    </section>
  </SiteLayout>;
}
