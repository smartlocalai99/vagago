import Link from 'next/link';
import { Icon, type IconName } from '@/components/icons';
import { Logo, navLinks } from '@/components/site/layout';
import { SearchForm } from '@/components/site/stay-parts';
import { money } from '@/lib/format';
import type { Listing, Place } from '@/lib/listings';
import { placePhoto, type AmenityHighlight } from '@/lib/places';
import { defaultTrip, formatDrive, formatKm, type nearby } from '@/lib/trip';

type NearbyPlace = ReturnType<typeof nearby<Place>>[number];

function HeroNav() {
  return <div className="flex items-center justify-between gap-4">
    <Logo />
    <nav aria-label="Main" className="hidden items-center gap-1 rounded-full border border-white/70 bg-white/70 p-1.5 shadow-[0_6px_24px_rgba(0,0,0,0.08)] backdrop-blur-xl lg:flex">
      <span aria-current="page" className="rounded-full bg-ink px-5 py-2 text-[14px] font-semibold text-white">Home</span>
      {navLinks.map((item) => <Link key={item.href} href={item.href} className="rounded-full px-4 py-2 text-[14px] font-semibold text-ink transition-colors hover:bg-white">{item.label}</Link>)}
    </nav>
    <div className="flex items-center gap-2">
      <Link href="/stays/" aria-label="Search stays" className="hidden size-11 place-items-center rounded-full border border-white/70 bg-white/70 backdrop-blur-xl sm:grid"><Icon name="search" size={19} /></Link>
      <Link href="/stays/" className="flex items-center gap-3 rounded-full bg-forest py-1.5 pr-1.5 pl-5 text-[14px] font-bold text-white">
        Book a stay<span className="grid size-8 place-items-center rounded-full bg-white text-forest"><Icon name="chevron" size={16} /></span>
      </Link>
    </div>
  </div>;
}

function Stat({ icon, value, label }: { icon: IconName; value: string; label: string }) {
  return <div className="flex flex-col items-center text-center">
    <span className="grid size-10 place-items-center rounded-full bg-forest-soft text-forest"><Icon name={icon} size={19} /></span>
    <span className="mt-2 text-[22px] leading-none font-extrabold tabular-nums">{value}</span>
    <span className="mt-1 text-[12px] leading-4 text-muted">{label}</span>
  </div>;
}

export function Hero({ featured, total, placeCount, thumbs }: { featured: Listing | null; total: number; placeCount: number; thumbs: string[] }) {
  return <section className="p-2.5 sm:p-4">
    <div className="relative overflow-hidden rounded-[28px] sm:rounded-[36px]">
      <img src="/images/hero.jpg" alt="Tea gardens and mist over the hills around Vagamon" fetchPriority="high" className="absolute inset-0 size-full object-cover" />
      <div className="absolute inset-0 bg-[linear-gradient(100deg,rgba(255,255,255,0.86)_0%,rgba(255,255,255,0.55)_38%,rgba(255,255,255,0)_66%)]" />
      <div className="absolute inset-x-0 bottom-0 h-2/5 bg-[linear-gradient(to_top,rgba(0,0,0,0.28),rgba(0,0,0,0))]" />
      <div className="relative flex min-h-[880px] flex-col gap-10 px-4 pt-4 pb-4 sm:px-8 sm:pt-6 sm:pb-6">
        <HeroNav />
        <div className="max-w-[640px] sm:pl-2">
          <p className="flex items-center gap-1.5 text-[15px] font-semibold text-ink/75"><Icon name="pin" size={17} />Vagamon, Kerala</p>
          <h1 className="mt-4 font-display text-[54px] leading-[0.95] font-semibold tracking-[-0.01em] text-ink sm:text-[84px]">Affordable stays<br /><span className="text-tea">at the best price</span></h1>
          <p className="mt-5 max-w-md text-[17px] leading-7 text-ink/80">Cottages, homestays and villas in the Vagamon hills. Book in a minute and pay when you arrive.</p>
          <div className="mt-8 flex flex-wrap items-center gap-5">
            <Link href="/stays/" className="flex items-center gap-3 rounded-full bg-ink py-2 pr-2 pl-6 text-[15px] font-bold text-white">Explore stays<span className="grid size-9 place-items-center rounded-full bg-white/15"><Icon name="chevron" size={17} /></span></Link>
            <a href="#how-it-works" className="flex items-center gap-3 text-[15px] font-bold text-ink"><span className="grid size-12 place-items-center rounded-full border border-ink/15 bg-white/70 backdrop-blur"><Icon name="chevron" size={17} className="rotate-90" /></span>How booking works</a>
          </div>
        </div>

        <div className="mt-auto space-y-4">
          <div className="mx-auto max-w-[1040px]"><SearchForm trip={defaultTrip()} variant="glass" /></div>
          <div className="grid gap-4 lg:grid-cols-[1fr_1.55fr_1fr]">
            {featured ? <Link href={`/stays/${featured.slug}/`} className="group flex gap-3 rounded-[26px] border border-white/70 bg-white/85 p-3 backdrop-blur-xl lg:flex-col">
              <div className="relative h-28 w-36 shrink-0 overflow-hidden rounded-[18px] bg-surface lg:h-36 lg:w-full">
                {featured.photos[0] ? <img src={featured.photos[0].full} srcSet={`${featured.photos[0].thumb} 480w, ${featured.photos[0].full} 1600w`} sizes="340px" alt="" className="size-full object-cover transition-transform duration-500 group-hover:scale-[1.04]" /> : null}
                <span className="absolute top-2.5 left-2.5 rounded-full bg-white/90 px-2.5 py-1 text-[11px] font-bold">Best price</span>
              </div>
              <div className="flex min-w-0 flex-1 items-end justify-between gap-3 px-1 pb-1">
                <div className="min-w-0">
                  <p className="truncate text-[17px] font-bold">{featured.name}</p>
                  <p className="text-[13px] text-muted">{featured.area}</p>
                  <p className="mt-1 text-[14px]"><span className="font-extrabold">{money(featured.rate)}</span> <span className="text-muted">a night</span></p>
                </div>
                <span className="grid size-10 shrink-0 place-items-center rounded-full border border-line bg-white transition-colors group-hover:bg-forest group-hover:text-white"><Icon name="chevron" size={17} /></span>
              </div>
            </Link> : <div />}

            <div className="flex flex-col justify-between gap-5 rounded-[26px] border border-white/70 bg-white/85 p-5 backdrop-blur-xl">
              <div className="grid grid-cols-4 gap-2">
                <Stat icon="home" value={String(total)} label={total === 1 ? 'Stay to choose' : 'Stays to choose'} />
                <Stat icon="pin" value={String(placeCount)} label="Places to visit" />
                <Stat icon="cash" value="₹0" label="Paid when booking" />
                <Stat icon="calendar" value="Free" label="Cancellation" />
              </div>
              <div className="flex items-center gap-4 border-t border-line pt-4">
                <div className="flex -space-x-3">
                  {thumbs.map((src) => <img key={src} src={src} alt="" className="size-10 rounded-full border-2 border-white object-cover" />)}
                  <Link href="/stays/" aria-label="See all stays" className="grid size-10 place-items-center rounded-full border-2 border-white bg-forest text-white"><Icon name="plus" size={18} /></Link>
                </div>
                <p className="text-[14px] leading-5 text-ink/80">Cottages, homestays and villas. <span className="font-bold text-ink">Nothing to pay until you arrive.</span></p>
              </div>
            </div>

            <a href="#places" className="group relative hidden min-h-[200px] overflow-hidden rounded-[26px] lg:block">
              <img src="/places/vagamon-meadows.jpg" alt="" className="absolute inset-0 size-full object-cover transition-transform duration-700 group-hover:scale-[1.05]" />
              <div className="absolute inset-0 bg-[linear-gradient(to_top,rgba(0,0,0,0.65),rgba(0,0,0,0.05)_60%)]" />
              <span className="absolute top-4 left-4 grid size-11 place-items-center rounded-full bg-white/90 text-ink"><Icon name="pin" size={19} /></span>
              <div className="absolute inset-x-5 bottom-4 text-white">
                <p className="font-display text-[28px] leading-7 font-semibold">Real places.<br />Real distances.</p>
                <p className="mt-1.5 text-[13px] text-white/85">See how far each spot is from your stay</p>
              </div>
            </a>
          </div>
        </div>
      </div>
    </div>
  </section>;
}

const promises: { icon: IconName; label: string }[] = [
  { icon: 'cash', label: 'Pay at the stay, no advance' },
  { icon: 'lock', label: 'Exact address right after booking' },
  { icon: 'calendar', label: 'Free cancellation before check-in' },
];

export function WhyVagaGo({ amenities }: { amenities: AmenityHighlight[] }) {
  return <section className="mx-auto mt-16 max-w-[1200px] px-4 sm:px-6">
    <h2 className="font-display text-[40px] leading-tight font-semibold md:text-[52px]">Why book with <span className="text-action">VagaGo</span></h2>
    <ul className="mt-5 flex flex-wrap gap-x-10 gap-y-4">
      {promises.map((item) => <li key={item.label} className="flex items-center gap-3 text-[17px] font-bold">
        <span className="grid size-12 place-items-center rounded-full bg-action-soft text-action"><Icon name={item.icon} size={22} /></span>{item.label}
      </li>)}
    </ul>
    {amenities.length ? <>
      <p className="mt-10 text-[16px] text-muted">Popular at our stays</p>
      <ul className="-mx-4 mt-3 flex snap-x gap-4 overflow-x-auto px-4 pb-2 sm:mx-0 sm:grid sm:grid-cols-3 sm:overflow-visible sm:px-0 lg:grid-cols-5">
        {amenities.map((item) => <li key={item.name} className="flex aspect-square w-[62%] shrink-0 snap-start flex-col items-center justify-center rounded-[28px] bg-tile p-4 text-center sm:w-auto">
          <img src={item.art} alt="" className="w-[78%]" loading="lazy" />
          <p className="mt-3 text-[18px] leading-6 font-bold">{item.name}</p>
          <p className="text-[13px] text-muted">At {item.stays} {item.stays === 1 ? 'stay' : 'stays'}</p>
        </li>)}
      </ul>
    </> : null}
  </section>;
}

export function PlacesGrid({ places, from }: { places: NearbyPlace[]; from: string }) {
  return <ul className="mt-8 grid grid-cols-2 gap-x-4 gap-y-7 md:grid-cols-3 lg:grid-cols-5">
    {places.map((place) => {
      const photo = placePhoto(place.id);
      return <li key={place.id}><a href={`https://www.google.com/maps/search/?api=1&query=${place.latitude},${place.longitude}`} target="_blank" rel="noreferrer" className="group block">
        <div className="relative aspect-[4/5] overflow-hidden rounded-2xl bg-forest">
          {photo ? <img src={photo} alt={place.name} loading="lazy" className="size-full object-cover transition-transform duration-500 group-hover:scale-[1.05]" />
            : <div className="grid size-full place-items-center bg-[linear-gradient(160deg,#0E5A40,#073728)] text-white/80"><Icon name="pin" size={40} /></div>}
          <span className="absolute top-2.5 left-2.5 rounded-full bg-white/95 px-2.5 py-1 text-[12px] font-bold tabular-nums shadow-sm">{formatKm(place.roadKm)} · {formatDrive(place.driveMinutes)}</span>
        </div>
        <p className="mt-2.5 text-[16px] leading-5 font-bold">{place.name}</p>
        <p className="mt-0.5 text-[13px] text-muted">{place.kind}</p>
      </a></li>;
    })}
    <li className="sr-only">Distances are approximate road distances from {from}.</li>
  </ul>;
}

const faqs = [
  { q: 'Do I pay anything when I book?', a: 'No. You pay the property when you check in. Prices are per night before taxes and fees, which the property charges at the stay.' },
  { q: 'Why can’t I see the exact address before booking?', a: 'It keeps hosts’ homes private. Before booking you see the area and the distance to nearby places; the exact address, directions and the host’s number appear the moment you book.' },
  { q: 'How do I find a stay near the places I want to visit?', a: 'Every stay page lists the main sights of Vagamon with the approximate road distance and drive time from that stay.' },
  { q: 'What should I check before booking?', a: 'Check that the stay fits your group, its check-in and check-out times, the house rules and how far it is from the places you plan to visit.' },
  { q: 'What are the check-in and check-out times?', a: 'Most stays check in from 2 pm and check out by 11 am. Each stay lists its own times on its page.' },
  { q: 'Can I cancel my booking?', a: 'Yes. Open My bookings on the device you booked from and cancel any time before your check-in day. Nothing is charged, as you pay at the stay.' },
  { q: 'Where do I find my booking later?', a: 'Bookings are saved in the browser or phone you booked from, under My bookings. Keep your booking reference handy at check-in.' },
  { q: 'Can I book for a family or a group?', a: 'Yes. Each stay shows how many guests it fits, and the whole property is yours. Choose the number of guests when you search.' },
  { q: 'Where can I find the best prices?', a: 'Stays at the best price on the home page shows the biggest savings, and you can sort any search by biggest savings or lowest price.' },
];

export function Faq() {
  const half = Math.ceil(faqs.length / 2);
  return <section id="faq" className="mt-20 scroll-mt-20 bg-surface py-16">
    <div className="mx-auto max-w-[1200px] px-4 sm:px-6">
      <h2 className="font-display text-[40px] leading-tight font-semibold md:text-[52px]">Questions about booking with VagaGo</h2>
      <div className="mt-8 grid gap-x-10 md:grid-cols-2">
        {[faqs.slice(0, half), faqs.slice(half)].map((column, index) => <div key={index} className="divide-y divide-line border-b border-line md:border-b-0">
          {column.map((item) => <details key={item.q} className="group">
            <summary className="flex min-h-[68px] cursor-pointer list-none items-center justify-between gap-4 text-[17px] font-bold [&::-webkit-details-marker]:hidden">
              {item.q}<Icon name="chevron" size={18} className="shrink-0 rotate-90 text-muted transition-transform group-open:-rotate-90" />
            </summary>
            <p className="pb-5 text-[15px] leading-7 text-muted">{item.a}</p>
          </details>)}
        </div>)}
      </div>
    </div>
  </section>;
}
