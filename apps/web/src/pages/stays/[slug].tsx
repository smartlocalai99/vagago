import type { GetStaticPaths, GetStaticProps } from 'next';
import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';
import { Icon } from '@/components/icons';
import { SiteLayout } from '@/components/site/layout';
import { Chip, DealPrice } from '@/components/site/stay-parts';
import { money, todayInIndia } from '@/lib/format';
import { guest } from '@/lib/guest';
import { fetchListing, fetchPlaces, fetchSlugs, styleLabel, type Listing, type Photo, type Place, type Room } from '@/lib/listings';
import { addDays, formatDrive, formatKm, nearby, nightsBetween, readTrip, tripParams, tripProblem, type TripQuery } from '@/lib/trip';

type Props = { stay: Listing; places: Place[] };

export const getStaticPaths: GetStaticPaths = async () => {
  try {
    return { paths: (await fetchSlugs()).map((slug) => ({ params: { slug } })), fallback: 'blocking' };
  } catch {
    return { paths: [], fallback: 'blocking' };
  }
};

// New and edited listings appear within five minutes without a redeploy.
export const getStaticProps: GetStaticProps<Props> = async ({ params }) => {
  const [stay, places] = await Promise.all([fetchListing(String(params?.slug)), fetchPlaces().catch(() => [])]);
  if (!stay) return { notFound: true, revalidate: 60 };
  return { props: { stay, places }, revalidate: 300 };
};

const clock = (time: string) => {
  const [hours, minutes] = time.split(':').map(Number);
  const suffix = hours >= 12 ? 'pm' : 'am';
  const hour = hours % 12 || 12;
  return minutes ? `${hour}:${String(minutes).padStart(2, '0')} ${suffix}` : `${hour} ${suffix}`;
};

function Lightbox({ photos, start, name, onClose }: { photos: Photo[]; start: number; name: string; onClose: () => void }) {
  const [index, setIndex] = useState(start);
  const step = (by: number) => setIndex((current) => (current + by + photos.length) % photos.length);
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
      if (event.key === 'ArrowRight') setIndex((current) => (current + 1) % photos.length);
      if (event.key === 'ArrowLeft') setIndex((current) => (current - 1 + photos.length) % photos.length);
    };
    document.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => { document.removeEventListener('keydown', onKey); document.body.style.overflow = ''; };
  }, [onClose, photos.length]);
  return <div role="dialog" aria-modal="true" aria-label={`${name} photos`} className="fixed inset-0 z-50 flex flex-col bg-black/95 text-white">
    <div className="flex items-center justify-between p-4">
      <span className="text-[15px] font-semibold tabular-nums">{index + 1} / {photos.length}</span>
      <button onClick={onClose} aria-label="Close photos" className="grid size-11 place-items-center rounded-full hover:bg-white/10"><Icon name="close" /></button>
    </div>
    <div className="relative flex min-h-0 flex-1 items-center justify-center px-4 pb-6">
      <img src={photos[index].full} alt={`${name}, photo ${index + 1}`} className="max-h-full max-w-full rounded-lg object-contain" />
      {photos.length > 1 ? <>
        <button onClick={() => step(-1)} aria-label="Previous photo" className="absolute left-3 grid size-12 place-items-center rounded-full bg-white/15 hover:bg-white/25"><Icon name="back" /></button>
        <button onClick={() => step(1)} aria-label="Next photo" className="absolute right-3 grid size-12 place-items-center rounded-full bg-white/15 hover:bg-white/25"><Icon name="chevron" /></button>
      </> : null}
    </div>
  </div>;
}

function Photos({ stay }: { stay: Listing }) {
  const [open, setOpen] = useState<number | null>(null);
  const photos = stay.photos;
  if (!photos.length) return <div className="aspect-[16/9] rounded-2xl bg-surface" />;
  const shown = photos.slice(0, 5);
  // Desktop: one large photo with up to four beside it. Mobile: swipeable strip.
  const layout = (index: number) => {
    if (shown.length === 1) return 'col-span-4 row-span-2';
    if (index === 0) return 'col-span-2 row-span-2';
    if (shown.length === 2) return 'col-span-2 row-span-2';
    if (shown.length === 3 || (shown.length === 4 && index === 1)) return 'col-span-2 row-span-1';
    return 'col-span-1 row-span-1';
  };
  return <>
    <div className="relative">
      <div className="hidden h-[440px] grid-cols-4 grid-rows-2 gap-2 overflow-hidden rounded-2xl md:grid">
        {shown.map((photo, index) => <button key={photo.full} onClick={() => setOpen(index)} className={`${layout(index)} overflow-hidden bg-surface`} aria-label={`Open photo ${index + 1} of ${photos.length}`}>
          <img src={photo.full} srcSet={index ? `${photo.thumb} 480w, ${photo.full} 1600w` : undefined} sizes={index ? '300px' : undefined} alt="" loading={index ? 'lazy' : 'eager'} className="size-full object-cover transition-transform duration-500 hover:scale-[1.03]" />
        </button>)}
      </div>
      <div className="-mx-4 flex snap-x snap-mandatory overflow-x-auto md:hidden">
        {photos.map((photo, index) => <button key={photo.full} onClick={() => setOpen(index)} className="aspect-[4/3] w-full shrink-0 snap-center bg-surface" aria-label={`Open photo ${index + 1} of ${photos.length}`}>
          <img src={photo.full} alt="" loading={index ? 'lazy' : 'eager'} className="size-full object-cover" />
        </button>)}
      </div>
      <button onClick={() => setOpen(0)} className="absolute right-4 bottom-4 flex items-center gap-2 rounded-lg bg-white px-3.5 py-2 text-[14px] font-bold shadow-md">
        <Icon name="image" size={17} />{photos.length === 1 ? 'View photo' : `All ${photos.length} photos`}
      </button>
    </div>
    {open !== null ? <Lightbox photos={photos} start={open} name={stay.name} onClose={() => setOpen(null)} /> : null}
  </>;
}

type Availability = 'idle' | 'checking' | 'available' | 'sold-out';

function BookingBox({ stay, room, rooms, onRoom, initial }: { stay: Listing; room: Room; rooms: Room[]; onRoom: (id: string) => void; initial: TripQuery }) {
  const router = useRouter();
  const [trip, setTrip] = useState(initial);
  const [availability, setAvailability] = useState<Availability>('idle');
  const nights = nightsBetween(trip.checkIn, trip.checkOut);
  const problem = tripProblem(trip) ?? (trip.guests > room.capacity ? `${room.name} fits up to ${room.capacity} guests.` : null);
  const today = todayInIndia();

  // One availability check per change of room or dates, after the guest stops editing.
  useEffect(() => {
    if (tripProblem(trip)) return;
    const controller = new AbortController();
    const timer = setTimeout(() => {
      setAvailability('checking');
      void guest().rpc('room_availability', { p_room_type_id: room.id, p_check_in: trip.checkIn, p_check_out: trip.checkOut })
        .abortSignal(controller.signal)
        .then(({ data, error }) => { if (!controller.signal.aborted) setAvailability(error ? 'idle' : (data ?? 0) > 0 ? 'available' : 'sold-out'); });
    }, 300);
    return () => { clearTimeout(timer); controller.abort(); };
  }, [room.id, trip]);

  const changeCheckIn = (value: string) => setTrip((current) => ({ ...current, checkIn: value, checkOut: nightsBetween(value, current.checkOut) < 1 ? addDays(value, 1) : current.checkOut }));
  const reserve = () => void router.push(`/book/?stay=${stay.slug}&room=${room.id}&${tripParams(trip)}`);
  const blocked = Boolean(problem) || availability === 'sold-out';

  return <div id="book" className="scroll-mt-24 rounded-2xl border border-line bg-white p-5 shadow-[0_6px_28px_rgba(0,0,0,0.09)]">
    <DealPrice rate={room.rate} compareAt={room.compareAt} size="xl" />
    <p className="text-[14px] text-muted">per night + taxes & fees</p>
    <div className="mt-5 overflow-hidden rounded-xl border border-line">
      <div className="grid grid-cols-2 divide-x divide-line">
        <label className="block px-3.5 py-2.5"><span className="block text-[12px] font-bold text-muted">Check-in</span>
          <input type="date" min={today} value={trip.checkIn} onChange={(event) => changeCheckIn(event.target.value)} className="mt-0.5 w-full bg-transparent text-[15px] font-semibold outline-none" />
        </label>
        <label className="block px-3.5 py-2.5"><span className="block text-[12px] font-bold text-muted">Check-out</span>
          <input type="date" min={addDays(trip.checkIn, 1)} value={trip.checkOut} onChange={(event) => setTrip((current) => ({ ...current, checkOut: event.target.value }))} className="mt-0.5 w-full bg-transparent text-[15px] font-semibold outline-none" />
        </label>
      </div>
      <label className="block border-t border-line px-3.5 py-2.5"><span className="block text-[12px] font-bold text-muted">Guests</span>
        <select value={trip.guests} onChange={(event) => setTrip((current) => ({ ...current, guests: Number(event.target.value) }))} className="mt-0.5 w-full appearance-none bg-transparent text-[15px] font-semibold outline-none">
          {Array.from({ length: Math.max(room.capacity, trip.guests) }, (_, index) => index + 1).map((count) => <option key={count} value={count}>{count} {count === 1 ? 'guest' : 'guests'}</option>)}
        </select>
      </label>
      {rooms.length > 1 ? <label className="block border-t border-line px-3.5 py-2.5"><span className="block text-[12px] font-bold text-muted">Stay option</span>
        <select value={room.id} onChange={(event) => onRoom(event.target.value)} className="mt-0.5 w-full appearance-none bg-transparent text-[15px] font-semibold outline-none">
          {rooms.map((item) => <option key={item.id} value={item.id}>{item.name}, {money(item.rate)} a night</option>)}
        </select>
      </label> : null}
    </div>
    <p aria-live="polite" className={`mt-3 min-h-5 text-[14px] font-semibold ${problem || availability === 'sold-out' ? 'text-danger' : 'text-save'}`}>
      {problem ?? (availability === 'sold-out' ? 'Sold out for these dates. Try other dates.' : availability === 'available' ? 'Available for your dates' : availability === 'checking' ? <span className="text-muted">Checking availability…</span> : '')}
    </p>
    {!tripProblem(trip) ? <div className="mt-3 space-y-2 border-t border-line pt-4 text-[15px]">
      <div className="flex justify-between"><span className="text-muted">{money(room.rate)} × {nights} {nights === 1 ? 'night' : 'nights'}</span><span className="tabular-nums">{money(room.rate * nights)}</span></div>
      <div className="flex justify-between font-bold"><span>Estimated total</span><span className="tabular-nums">{money(room.rate * nights)}</span></div>
    </div> : null}
    <button onClick={reserve} disabled={blocked} className="mt-5 min-h-14 w-full rounded-xl bg-action text-[16px] font-bold text-white transition-opacity hover:opacity-90 disabled:opacity-40">Book now & pay at stay</button>
    <p className="mt-2.5 text-center text-[13px] text-muted">You won’t pay anything now.</p>
  </div>;
}

export default function StayPage({ stay, places }: Props) {
  const router = useRouter();
  const [roomId, setRoomId] = useState(stay.rooms[0].id);
  const room = stay.rooms.find((item) => item.id === roomId) ?? stay.rooms[0];
  const near = nearby({ latitude: stay.latitude, longitude: stay.longitude }, places);
  const share = async () => {
    const url = window.location.href.split('?')[0];
    if (navigator.share) await navigator.share({ title: stay.name, url }).catch(() => undefined);
    else await navigator.clipboard?.writeText(url).catch(() => undefined);
  };
  const mapUrl = `https://www.google.com/maps/search/?api=1&query=${stay.latitude.toFixed(2)},${stay.longitude.toFixed(2)}`;
  const jsonLd = {
    '@context': 'https://schema.org', '@type': 'LodgingBusiness', name: stay.name, description: stay.description || stay.tagline,
    image: stay.photos.map((photo) => photo.full), priceRange: `From ${money(stay.rate)} a night`,
    address: { '@type': 'PostalAddress', addressLocality: 'Vagamon', addressRegion: 'Kerala', addressCountry: 'IN' },
    amenityFeature: stay.amenities.map((name) => ({ '@type': 'LocationFeatureSpecification', name, value: true })),
  };

  return <SiteLayout title={`${stay.name}, ${stay.area}`} description={`${styleLabel[stay.style]} in ${stay.area}, Vagamon for up to ${stay.capacity} guests. From ${money(stay.rate)} a night, pay at the stay.`} image={stay.photos[0]?.full}>
    <Head><script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} /></Head>
    <div className="mx-auto max-w-[1200px] px-4 pt-5 pb-28 sm:px-6 lg:pb-0">
      <nav aria-label="Breadcrumb" className="mb-4 text-[14px] text-muted"><Link href="/" className="hover:text-ink">Home</Link> <span aria-hidden>/</span> <Link href="/stays/" className="hover:text-ink">Stays</Link> <span aria-hidden>/</span> <span className="text-ink">{stay.name}</span></nav>
      <div className="mb-5 flex flex-wrap items-end justify-between gap-4">
        <div>
          <div className="mb-2 flex flex-wrap gap-2"><Chip icon="home">{`Entire ${styleLabel[stay.style].toLowerCase()}`}</Chip><Chip icon="cash" tone="save">Pay at stay</Chip></div>
          <h1 className="text-[30px] leading-tight font-extrabold tracking-[-0.03em] md:text-[40px]">{stay.name}</h1>
          <p className="mt-1 text-[16px] text-muted">{stay.area}, Vagamon, Kerala | {stay.bedrooms} {stay.bedrooms === 1 ? 'bedroom' : 'bedrooms'} | Up to {stay.capacity} guests</p>
        </div>
        <button onClick={() => void share()} className="flex items-center gap-2 rounded-full border border-line px-4 py-2 text-[14px] font-bold hover:bg-surface"><Icon name="share" size={17} />Share</button>
      </div>
      <Photos stay={stay} />

      <div className="mt-10 grid gap-12 lg:grid-cols-[1fr_380px]">
        <div className="min-w-0 space-y-10">
          {stay.tagline || stay.description ? <section>
            <h2 className="text-[24px] font-extrabold tracking-[-0.02em]">About this stay</h2>
            {stay.tagline ? <p className="mt-2 text-[17px] font-semibold">{stay.tagline}</p> : null}
            {stay.description ? <p className="mt-2 max-w-[68ch] text-[16px] leading-7 text-ink/85">{stay.description}</p> : null}
          </section> : null}

          <section className="rounded-2xl bg-forest p-6 text-white">
            <h2 className="text-[20px] font-bold">Book now, pay at the stay</h2>
            <p className="mt-1.5 max-w-[60ch] text-[15px] leading-6 text-white/80">No advance payment. The exact address, directions and the host’s number unlock as soon as you book.</p>
          </section>

          {stay.amenities.length ? <section>
            <h2 className="text-[24px] font-extrabold tracking-[-0.02em]">What this place offers</h2>
            <ul className="mt-4 grid gap-3 sm:grid-cols-2">{stay.amenities.map((amenity) => <li key={amenity} className="flex items-center gap-3 text-[16px]"><Icon name="check" size={19} className="text-save" />{amenity}</li>)}</ul>
          </section> : null}

          <section>
            <h2 className="text-[24px] font-extrabold tracking-[-0.02em]">Choose your stay</h2>
            <p className="mt-1 text-[15px] text-muted">The whole property is yours.</p>
            <div className="mt-4 space-y-3">
              {stay.rooms.map((item) => {
                const selected = item.id === room.id;
                return <label key={item.id} className={`flex cursor-pointer gap-4 rounded-2xl border p-5 transition-colors ${selected ? 'border-forest bg-forest-soft/50' : 'border-line hover:border-ink/30'}`}>
                  <input type="radio" name="room" checked={selected} onChange={() => setRoomId(item.id)} className="mt-1.5 size-5 accent-[#073728]" />
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1"><p className="text-[18px] font-bold">{item.name}</p><DealPrice rate={item.rate} compareAt={item.compareAt} size="md" /></div>
                    <p className="mt-1 text-[15px] text-muted">{item.beds} | Up to {item.capacity} guests</p>
                    <p className="mt-2 text-[15px] leading-6">{item.description}</p>
                  </div>
                </label>;
              })}
            </div>
          </section>

          <section>
            <h2 className="text-[24px] font-extrabold tracking-[-0.02em]">Location</h2>
            <div className="mt-4 flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-line p-5">
              <div className="flex items-start gap-3">
                <span className="grid size-10 shrink-0 place-items-center rounded-full bg-forest-soft text-forest"><Icon name="lock" size={19} /></span>
                <div><p className="text-[16px] font-bold">{stay.area}, Vagamon</p><p className="text-[15px] text-muted">The exact address and directions appear as soon as you book.</p></div>
              </div>
              <a href={mapUrl} target="_blank" rel="noreferrer" className="rounded-full border border-ink px-4 py-2 text-[14px] font-bold hover:bg-surface">View area on map</a>
            </div>
          </section>

          {near.length ? <section>
            <h2 className="text-[24px] font-extrabold tracking-[-0.02em]">Places to visit nearby</h2>
            <p className="mt-1 text-[15px] text-muted">Approximate road distance and drive time from {stay.name}.</p>
            <ul className="mt-3 grid gap-x-8 sm:grid-cols-2">
              {near.map((place) => <li key={place.id} className="flex items-center gap-3 border-b border-line py-3.5">
                <Icon name="pin" size={18} className="shrink-0 text-muted" />
                <div className="min-w-0 flex-1"><p className="text-[15px] font-bold">{place.name}</p><p className="text-[13px] text-muted">{place.kind}</p></div>
                <div className="text-right tabular-nums"><p className="text-[15px] font-bold">{formatKm(place.roadKm)}</p><p className="text-[13px] text-muted">about {formatDrive(place.driveMinutes)}</p></div>
              </li>)}
            </ul>
          </section> : null}

          <section>
            <h2 className="text-[24px] font-extrabold tracking-[-0.02em]">Good to know</h2>
            <dl className="mt-4 grid gap-5 sm:grid-cols-2">
              <div className="flex gap-3"><Icon name="clock" className="shrink-0 text-forest" /><div><dt className="font-bold">Check-in and check-out</dt><dd className="text-[15px] text-muted">Check in from {clock(stay.checkIn)}, check out by {clock(stay.checkOut)}</dd></div></div>
              <div className="flex gap-3"><Icon name="calendar" className="shrink-0 text-forest" /><div><dt className="font-bold">Cancellation</dt><dd className="text-[15px] text-muted">{stay.cancellationPolicy ?? 'Cancel from My bookings any time before your check-in day. Nothing is charged, as you pay at the stay.'}</dd></div></div>
              {stay.houseRules ? <div className="flex gap-3 sm:col-span-2"><Icon name="shield" className="shrink-0 text-forest" /><div><dt className="font-bold">House rules</dt><dd className="text-[15px] whitespace-pre-line text-muted">{stay.houseRules}</dd></div></div> : null}
            </dl>
          </section>
        </div>

        <aside className="lg:sticky lg:top-24 lg:self-start">
          <BookingBox key={router.isReady ? router.asPath : 'initial'} stay={stay} room={room} rooms={stay.rooms} onRoom={setRoomId} initial={readTrip(router.query)} />
        </aside>
      </div>
    </div>

    <div className="fixed inset-x-0 bottom-0 z-30 flex items-center justify-between gap-4 border-t border-line bg-white px-4 pt-3 pb-[max(12px,env(safe-area-inset-bottom))] lg:hidden">
      <div><DealPrice rate={room.rate} compareAt={room.compareAt} size="md" /><p className="text-[13px] text-action">+ taxes & fees</p></div>
      <a href="#book" className="rounded-xl bg-action px-5 py-3.5 text-[15px] font-bold text-white">Book now & pay at stay</a>
    </div>
  </SiteLayout>;
}
