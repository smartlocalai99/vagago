import type { GetStaticProps } from 'next';
import Link from 'next/link';
import { Icon, type IconName } from '@/components/icons';
import { SiteLayout } from '@/components/site/layout';
import { SearchForm, StayCard } from '@/components/site/stay-parts';
import { discountPercent, fetchListings, fetchPlaces, type Listing, type Place } from '@/lib/listings';
import { defaultTrip, formatDrive, formatKm, nearby, vagamonTown } from '@/lib/trip';

type Props = { stays: Listing[]; places: Place[]; total: number };

// Rebuilt in the background at most every five minutes, whatever the traffic.
export const getStaticProps: GetStaticProps<Props> = async () => {
  try {
    const [listings, places] = await Promise.all([fetchListings(), fetchPlaces()]);
    const best = [...listings].sort((a, b) => discountPercent(b.rate, b.compareAt) - discountPercent(a.rate, a.compareAt) || a.rate - b.rate);
    return { props: { stays: best.slice(0, 6), places, total: listings.length }, revalidate: 300 };
  } catch {
    return { props: { stays: [], places: [], total: 0 }, revalidate: 60 };
  }
};

const promises: { icon: IconName; title: string; body: string }[] = [
  { icon: 'cash', title: 'Pay at the stay', body: 'No advance payment. You pay the property when you check in.' },
  { icon: 'lock', title: 'Address right after booking', body: 'The exact location, directions and the host’s number unlock as soon as you book.' },
  { icon: 'calendar', title: 'Cancel before check-in', body: 'Plans changed? Cancel from My bookings any time before your check-in day.' },
];

const steps = [
  { title: 'Pick a stay', body: 'Compare cottages, homestays and villas with real nightly prices for your dates.' },
  { title: 'Book in a minute', body: 'Just your name and mobile number. Nothing to pay now.' },
  { title: 'Get directions', body: 'See the exact address, directions and the host’s number straight away.' },
];

const faqs = [
  { q: 'Do I pay anything when I book?', a: 'No. You pay the property when you check in. Prices are per night before taxes and fees, which the property charges at the stay.' },
  { q: 'Why can’t I see the exact address before booking?', a: 'It keeps hosts’ homes private. Before booking you see the area and the distance to nearby places; the exact address, directions and the host’s number appear the moment you book.' },
  { q: 'Can I cancel my booking?', a: 'Yes. Open My bookings on the device you booked from and cancel any time before your check-in day.' },
  { q: 'Where do I find my booking later?', a: 'Bookings are saved in the browser you booked from, under My bookings. Keep your booking reference handy at check-in.' },
  { q: 'What are the check-in and check-out times?', a: 'Most stays check in from 2 pm and check out by 11 am. Each stay lists its own times on its page.' },
];

export default function Home({ stays, places, total }: Props) {
  const fromTown = nearby(vagamonTown, places);
  return <SiteLayout title="VagaGo" description="Book cottages, homestays and villas in Vagamon, Kerala at the best price. No advance payment: pay at the stay.">
    <section className="relative">
      <div className="relative h-[540px] md:h-[620px]">
        <img src="/images/hero.jpg" alt="Tea gardens and mist over the hills around Vagamon" fetchPriority="high" className="absolute inset-0 size-full object-cover" />
        <div className="absolute inset-0 bg-[linear-gradient(to_top,rgba(0,0,0,0.68),rgba(0,0,0,0.18)_55%,rgba(0,0,0,0.12))]" />
        <div className="relative mx-auto flex h-full max-w-[1200px] flex-col justify-end px-4 pb-32 sm:px-6 md:pb-36">
          <p className="flex items-center gap-1.5 text-[15px] font-semibold text-white/90"><Icon name="pin" size={17} />Vagamon, Kerala</p>
          <h1 className="mt-3 max-w-3xl text-[40px] leading-[1.04] font-extrabold tracking-[-0.035em] text-white md:text-[66px]">Affordable stays at the best price</h1>
          <p className="mt-4 max-w-xl text-[17px] leading-7 text-white/88 md:text-[19px]">Cottages, homestays and villas in the hills. Book in a minute and pay when you arrive.</p>
        </div>
      </div>
      <div className="relative z-10 mx-auto -mt-24 max-w-[1100px] px-4 sm:px-6 md:-mt-14"><SearchForm trip={defaultTrip()} /></div>
    </section>

    <section aria-label="Why book with VagaGo" className="mx-auto mt-12 grid max-w-[1200px] gap-6 px-4 sm:px-6 md:grid-cols-3">
      {promises.map((item) => <div key={item.title} className="flex gap-4">
        <span className="grid size-12 shrink-0 place-items-center rounded-xl bg-forest-soft text-forest"><Icon name={item.icon} size={24} /></span>
        <div><h2 className="text-[17px] font-bold">{item.title}</h2><p className="mt-1 text-[15px] leading-6 text-muted">{item.body}</p></div>
      </div>)}
    </section>

    <section className="mx-auto mt-16 max-w-[1200px] px-4 sm:px-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h2 className="text-[28px] font-extrabold tracking-[-0.025em] md:text-[34px]">Stays at the best price</h2>
          <p className="mt-1 text-[16px] text-muted">The biggest savings in Vagamon right now.</p>
        </div>
        {total ? <Link href="/stays/" className="rounded-full border border-ink px-5 py-2.5 text-[15px] font-bold hover:bg-surface">See all {total} stays</Link> : null}
      </div>
      {stays.length ? <div className="mt-7 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">{stays.map((stay) => <StayCard key={stay.id} stay={stay} />)}</div>
        : <p className="mt-7 rounded-2xl bg-surface p-6 text-[15px] text-muted">New stays are being added. Please check back soon.</p>}
    </section>

    {fromTown.length ? <section id="places" className="mt-20 scroll-mt-20 bg-surface py-16">
      <div className="mx-auto max-w-[1200px] px-4 sm:px-6">
        <h2 className="text-[28px] font-extrabold tracking-[-0.025em] md:text-[34px]">Places to visit in Vagamon</h2>
        <p className="mt-1 max-w-2xl text-[16px] text-muted">Approximate road distance and drive time from Vagamon town. Each stay shows distances from its own location.</p>
        <ul className="mt-8 grid gap-x-10 md:grid-cols-2">
          {fromTown.map((place) => <li key={place.id} className="flex items-center gap-4 border-b border-line py-4">
            <span className="grid size-10 shrink-0 place-items-center rounded-full bg-white text-forest"><Icon name="pin" size={19} /></span>
            <div className="min-w-0 flex-1"><p className="text-[16px] font-bold">{place.name}</p><p className="text-[14px] text-muted">{place.kind}</p></div>
            <div className="text-right tabular-nums"><p className="text-[16px] font-bold">{formatKm(place.roadKm)}</p><p className="text-[13px] text-muted">about {formatDrive(place.driveMinutes)}</p></div>
          </li>)}
        </ul>
      </div>
    </section> : null}

    <section id="how-it-works" className="mx-auto mt-20 max-w-[1200px] scroll-mt-20 px-4 sm:px-6">
      <h2 className="text-[28px] font-extrabold tracking-[-0.025em] md:text-[34px]">How booking works</h2>
      <ol className="mt-8 grid gap-8 md:grid-cols-3">
        {steps.map((step, index) => <li key={step.title} className="border-t-2 border-forest pt-5">
          <span className="text-[15px] font-extrabold text-forest tabular-nums">Step {index + 1}</span>
          <h3 className="mt-1 text-[20px] font-bold">{step.title}</h3>
          <p className="mt-2 text-[15px] leading-6 text-muted">{step.body}</p>
        </li>)}
      </ol>
    </section>

    <section id="faq" className="mx-auto mt-20 max-w-[860px] scroll-mt-20 px-4 sm:px-6">
      <h2 className="text-[28px] font-extrabold tracking-[-0.025em] md:text-[34px]">Questions and answers</h2>
      <div className="mt-6 divide-y divide-line border-y border-line">
        {faqs.map((item) => <details key={item.q} className="group py-1">
          <summary className="flex min-h-14 cursor-pointer list-none items-center justify-between gap-4 text-[17px] font-bold [&::-webkit-details-marker]:hidden">
            {item.q}<Icon name="plus" size={20} className="shrink-0 transition-transform group-open:rotate-45" />
          </summary>
          <p className="pb-5 text-[15px] leading-7 text-muted">{item.a}</p>
        </details>)}
      </div>
    </section>
  </SiteLayout>;
}
