import type { GetStaticProps } from 'next';
import Link from 'next/link';
import { Faq, Hero, PlacesGrid, WhyVagaGo } from '@/components/site/home-sections';
import { SiteLayout } from '@/components/site/layout';
import { StayCard } from '@/components/site/stay-parts';
import { discountPercent, fetchAmenityHighlights, fetchListings, fetchPlaces, fetchPublishedReviews, type GuestReview, type Listing, type Place } from '@/lib/listings';
import type { AmenityHighlight } from '@/lib/places';
import { nearby, vagamonTown } from '@/lib/trip';

type Props = { stays: Listing[]; places: Place[]; total: number; amenities: AmenityHighlight[]; reviews: GuestReview[] };

// Rebuilt in the background at most every five minutes, whatever the traffic.
export const getStaticProps: GetStaticProps<Props> = async () => {
  try {
    const [listings, places] = await Promise.all([fetchListings(), fetchPlaces()]);
    const best = [...listings].sort((a, b) => discountPercent(b.rate, b.compareAt) - discountPercent(a.rate, a.compareAt) || a.rate - b.rate);
    const [amenities, reviews] = await Promise.all([fetchAmenityHighlights(listings).catch(() => []), fetchPublishedReviews().catch(() => [])]);
    return { props: { stays: best.slice(0, 6), places, total: listings.length, amenities, reviews }, revalidate: 300 };
  } catch {
    return { props: { stays: [], places: [], total: 0, amenities: [], reviews: [] }, revalidate: 60 };
  }
};

const steps = [
  { title: 'Pick a stay', body: 'Compare cottages, homestays and villas with real nightly prices for your dates.' },
  { title: 'Book in a minute', body: 'Just your name and mobile number. Nothing to pay now.' },
  { title: 'Get directions', body: 'See the exact address, directions and the host’s number straight away.' },
];

export default function Home({ stays, places, total, amenities, reviews }: Props) {
  const fromTown = nearby(vagamonTown, places);
  return <SiteLayout title="VagaGo" header={false} description="Book cottages, homestays and villas in Vagamon, Kerala at the best price. No advance payment: pay at the stay.">
    <Hero featured={stays[0] ?? null} reviews={reviews} thumbs={stays.slice(0, 3).flatMap((stay) => stay.photos[0] ? [stay.photos[0].thumb] : [])} />

    <WhyVagaGo amenities={amenities} />

    <section className="mx-auto mt-20 max-w-[1200px] px-4 sm:px-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h2 className="font-display text-[40px] leading-tight font-semibold md:text-[52px]">Stays at the best price</h2>
          <p className="mt-1 text-[16px] text-muted">The biggest savings in Vagamon right now.</p>
        </div>
        {total ? <Link href="/stays/" className="rounded-full border border-ink px-5 py-2.5 text-[15px] font-bold hover:bg-surface">See all {total} stays</Link> : null}
      </div>
      {stays.length ? <div className="mt-7 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">{stays.map((stay) => <StayCard key={stay.id} stay={stay} />)}</div>
        : <p className="mt-7 rounded-2xl bg-surface p-6 text-[15px] text-muted">New stays are being added. Please check back soon.</p>}
    </section>

    {fromTown.length ? <section id="places" className="mx-auto mt-20 max-w-[1200px] scroll-mt-6 px-4 sm:px-6">
      <h2 className="font-display text-[40px] leading-tight font-semibold md:text-[52px]">Places to visit in Vagamon</h2>
      <p className="mt-1 max-w-2xl text-[16px] text-muted">Approximate road distance and drive time from Vagamon town. Each stay shows distances from its own location.</p>
      <PlacesGrid places={fromTown} from="Vagamon town" />
    </section> : null}

    <section id="how-it-works" className="mx-auto mt-20 max-w-[1200px] scroll-mt-6 px-4 sm:px-6">
      <h2 className="font-display text-[40px] leading-tight font-semibold md:text-[52px]">How booking works</h2>
      <ol className="mt-8 grid gap-8 md:grid-cols-3">
        {steps.map((step, index) => <li key={step.title} className="border-t-2 border-forest pt-5">
          <span className="text-[15px] font-extrabold text-forest tabular-nums">Step {index + 1}</span>
          <h3 className="mt-1 text-[20px] font-bold">{step.title}</h3>
          <p className="mt-2 text-[15px] leading-6 text-muted">{step.body}</p>
        </li>)}
      </ol>
    </section>

    <Faq />
  </SiteLayout>;
}
