import Link from 'next/link';
import { useEffect, useState } from 'react';
import { Icon } from '@/components/icons';
import { SiteLayout } from '@/components/site/layout';
import { TripStatus } from '@/components/site/trip-status';
import { dayMonth, money, todayInIndia } from '@/lib/format';
import { guest, hasGuestSession, tripColumns, type Trip } from '@/lib/guest';
import { thumbUrl } from '@/lib/listings';

export default function Trips() {
  const [trips, setTrips] = useState<Trip[] | null>(null);

  useEffect(() => {
    void (async () => {
      // No session means this browser has never booked: nothing to fetch.
      if (!await hasGuestSession()) { setTrips([]); return; }
      const { data } = await guest().from('reservations').select(tripColumns).order('check_in', { ascending: false });
      setTrips((data as unknown as Trip[] | null) ?? []);
    })();
  }, []);

  const today = todayInIndia();
  const upcoming = trips?.filter((trip) => trip.check_out >= today && trip.status !== 'cancelled') ?? [];
  const past = trips?.filter((trip) => !upcoming.includes(trip)) ?? [];

  return <SiteLayout title="My bookings" description="Your VagaGo bookings on this device.">
    <div className="mx-auto max-w-[900px] px-4 py-10 sm:px-6">
      <h1 className="text-[30px] font-extrabold tracking-[-0.03em] md:text-[36px]">My bookings</h1>
      <p className="mt-1 text-[15px] text-muted">Bookings made in this browser.</p>
      {trips === null ? <div className="mt-8 space-y-3">{[0, 1].map((key) => <div key={key} className="h-28 animate-pulse rounded-2xl bg-surface" />)}</div>
        : !trips.length ? <div className="mt-8 rounded-2xl bg-surface px-6 py-14 text-center">
          <span className="mx-auto grid size-14 place-items-center rounded-2xl bg-white text-forest"><Icon name="calendar" size={26} /></span>
          <p className="mt-4 text-[18px] font-bold">No bookings yet</p>
          <p className="mt-1 text-[15px] text-muted">When you book a stay, it shows up here with the address and directions.</p>
          <Link href="/stays/" className="mt-5 inline-block rounded-full bg-forest px-5 py-3 text-[15px] font-bold text-white">Find a stay</Link>
        </div>
        : <>
          {[{ title: 'Upcoming', list: upcoming }, { title: 'Past and cancelled', list: past }].map(({ title, list }) => list.length ? <section key={title} className="mt-8">
            <h2 className="text-[18px] font-bold">{title}</h2>
            <ul className="mt-3 space-y-3">
              {list.map((trip) => {
                const cover = [...(trip.properties?.property_photos ?? [])].sort((a, b) => a.sort_order - b.sort_order)[0];
                return <li key={trip.id}><Link href={`/trips/${trip.id}/`} className="flex gap-4 rounded-2xl border border-line p-3 transition-colors hover:bg-surface">
                  <div className="size-24 shrink-0 overflow-hidden rounded-xl bg-surface">{cover ? <img src={thumbUrl(cover.storage_path)} alt="" className="size-full object-cover" /> : null}</div>
                  <div className="min-w-0 flex-1 py-1">
                    <div className="flex items-start justify-between gap-3"><p className="truncate text-[17px] font-bold">{trip.properties?.name ?? 'Your stay'}</p><TripStatus status={trip.status} /></div>
                    <p className="text-[14px] text-muted">{dayMonth(trip.check_in)} – {dayMonth(trip.check_out)} | {trip.guests} {trip.guests === 1 ? 'guest' : 'guests'}</p>
                    <p className="mt-1 text-[14px]"><span className="font-semibold">{money(trip.total_paise)}</span> <span className="text-muted">| {trip.reference}</span></p>
                  </div>
                </Link></li>;
              })}
            </ul>
          </section> : null)}
        </>}
    </div>
  </SiteLayout>;
}
