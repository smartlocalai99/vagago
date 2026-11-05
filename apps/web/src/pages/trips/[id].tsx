import Link from 'next/link';
import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';
import { Icon } from '@/components/icons';
import { SiteLayout } from '@/components/site/layout';
import { TripStatus } from '@/components/site/trip-status';
import { fullDate, money, todayInIndia } from '@/lib/format';
import { guest, hasGuestSession, tripColumns, type Trip } from '@/lib/guest';
import { photoUrl, type Place } from '@/lib/listings';
import { formatDrive, formatKm, nearby } from '@/lib/trip';

type Address = { address_line: string; city: string; state: string; postal_code: string; latitude: number; longitude: number; arrival_instructions: string | null; contact_phone: string | null };

export default function TripPage() {
  const router = useRouter();
  const id = typeof router.query.id === 'string' ? router.query.id : '';
  const justBooked = router.query.new === '1';
  const [trip, setTrip] = useState<Trip | null | undefined>(undefined);
  const [address, setAddress] = useState<Address | null>(null);
  const [places, setPlaces] = useState<Place[]>([]);
  const [cancelling, setCancelling] = useState(false);
  const [failure, setFailure] = useState<string | null>(null);

  useEffect(() => {
    if (!router.isReady) return;
    void (async () => {
      if (!id || !await hasGuestSession()) { setTrip(null); return; }
      const db = guest();
      // Booking, exact address and nearby places load together.
      const [booking, location, attractions] = await Promise.all([
        db.from('reservations').select(tripColumns).eq('id', id).maybeSingle(),
        db.rpc('reservation_location', { p_reservation_id: id }),
        db.from('attractions').select('slug, name, kind, latitude, longitude').eq('is_active', true).order('sort_order'),
      ]);
      setTrip((booking.data as unknown as Trip | null) ?? null);
      const row = Array.isArray(location.data) ? location.data[0] : null;
      if (row) setAddress({ ...row, latitude: Number(row.latitude), longitude: Number(row.longitude) });
      setPlaces((attractions.data ?? []).map((place) => ({ id: place.slug, name: place.name, kind: place.kind, latitude: Number(place.latitude), longitude: Number(place.longitude) })));
    })();
  }, [router.isReady, id]);

  const cancel = async () => {
    if (!trip || !window.confirm('Cancel this booking?')) return;
    setCancelling(true);
    setFailure(null);
    const { data, error } = await guest().rpc('cancel_reservation', { p_reservation_id: trip.id });
    if (error || !data) setFailure('Couldn’t cancel this booking. Please try again.');
    else setTrip({ ...trip, status: data.status });
    setCancelling(false);
  };

  if (trip === undefined) return <SiteLayout title="Your booking" description="Your VagaGo booking."><div className="grid min-h-[50vh] place-items-center"><div className="size-8 animate-spin rounded-full border-2 border-forest border-t-transparent" /></div></SiteLayout>;
  if (!trip) return <SiteLayout title="Booking not found" description="This booking isn’t on this device.">
    <div className="mx-auto max-w-xl px-4 py-20 text-center">
      <h1 className="text-[26px] font-extrabold">Booking not found</h1>
      <p className="mt-2 text-[15px] text-muted">Bookings can be opened from the browser they were made in.</p>
      <Link href="/trips/" className="mt-6 inline-block rounded-full bg-forest px-5 py-3 font-bold text-white">My bookings</Link>
    </div>
  </SiteLayout>;

  const active = trip.status === 'confirmed' || trip.status === 'checked_in';
  const cover = [...(trip.properties?.property_photos ?? [])].sort((a, b) => a.sort_order - b.sort_order)[0];
  const destination = address ? `${address.latitude},${address.longitude}` : '';
  const near = address ? nearby(address, places) : [];

  return <SiteLayout title={`Booking ${trip.reference}`} description="Your VagaGo booking.">
    <div className="mx-auto max-w-[900px] px-4 py-8 sm:px-6">
      <Link href="/trips/" className="inline-flex items-center gap-1.5 text-[15px] font-semibold text-muted hover:text-ink"><Icon name="back" size={18} />My bookings</Link>
      {justBooked && trip.status === 'confirmed' ? <div role="status" className="mt-5 flex items-center gap-4 rounded-2xl bg-save-soft p-5 text-save">
        <span className="grid size-11 shrink-0 place-items-center rounded-full bg-save text-white"><Icon name="check" /></span>
        <div><p className="text-[18px] font-bold">Booking confirmed</p><p className="text-[15px]">Your exact address and directions are below. Pay at the stay when you check in.</p></div>
      </div> : null}

      <div className="mt-6 overflow-hidden rounded-2xl border border-line">
        {cover ? <img src={photoUrl(cover.storage_path)} alt="" className="aspect-[21/9] w-full object-cover" /> : null}
        <div className="p-5 sm:p-6">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div><h1 className="text-[26px] font-extrabold tracking-[-0.02em]">{trip.properties?.name ?? 'Your stay'}</h1><p className="text-[15px] text-muted">Booking {trip.reference}</p></div>
            <TripStatus status={trip.status} />
          </div>
          <dl className="mt-5 grid gap-4 border-t border-line pt-5 text-[15px] sm:grid-cols-3">
            <div><dt className="text-muted">Check-in</dt><dd className="font-bold">{fullDate(trip.check_in)}</dd></div>
            <div><dt className="text-muted">Check-out</dt><dd className="font-bold">{fullDate(trip.check_out)}</dd></div>
            <div><dt className="text-muted">Guests</dt><dd className="font-bold">{trip.guests}, booked by {trip.guest_name}</dd></div>
          </dl>
          <div className="mt-5 flex items-baseline justify-between border-t border-line pt-5"><span className="font-bold">Pay at check-in</span><span className="text-[22px] font-extrabold tabular-nums">{money(trip.total_paise)}</span></div>
          <p className="text-[13px] text-muted">Plus taxes and fees charged by the property.</p>
        </div>
      </div>

      {active && address ? <section className="mt-8 rounded-2xl border border-line p-5 sm:p-6">
        <h2 className="text-[20px] font-bold">Exact address</h2>
        <p className="mt-2 text-[16px] leading-7">{address.address_line}<br />{address.city}, {address.state} {address.postal_code}</p>
        {address.arrival_instructions ? <p className="mt-3 rounded-xl bg-surface p-4 text-[15px] leading-6">{address.arrival_instructions}</p> : null}
        <div className="mt-4 flex flex-wrap gap-3">
          <a href={`https://www.google.com/maps/dir/?api=1&destination=${destination}&travelmode=driving`} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 rounded-xl bg-forest px-5 py-3 text-[15px] font-bold text-white"><Icon name="navigation" size={18} />Get directions</a>
          {address.contact_phone ? <a href={`tel:${address.contact_phone.startsWith('+') ? address.contact_phone : `+91${address.contact_phone}`}`} className="inline-flex items-center gap-2 rounded-xl border border-line px-5 py-3 text-[15px] font-bold"><Icon name="phone" size={18} />Call the property</a> : null}
        </div>
      </section> : null}

      {active && near.length ? <section className="mt-8">
        <h2 className="text-[20px] font-bold">Places to visit nearby</h2>
        <p className="mt-1 text-[15px] text-muted">Approximate road distance and drive time from your stay.</p>
        <ul className="mt-3 grid gap-x-8 sm:grid-cols-2">
          {near.map((place) => <li key={place.id}><a href={`https://www.google.com/maps/dir/?api=1&origin=${destination}&destination=${place.latitude},${place.longitude}&travelmode=driving`} target="_blank" rel="noreferrer" className="flex items-center gap-3 border-b border-line py-3.5 hover:bg-surface">
            <Icon name="pin" size={18} className="shrink-0 text-muted" />
            <div className="min-w-0 flex-1"><p className="text-[15px] font-bold">{place.name}</p><p className="text-[13px] text-muted">{place.kind}</p></div>
            <div className="text-right tabular-nums"><p className="text-[15px] font-bold">{formatKm(place.roadKm)}</p><p className="text-[13px] text-muted">about {formatDrive(place.driveMinutes)}</p></div>
          </a></li>)}
        </ul>
      </section> : null}

      {trip.status === 'confirmed' && trip.check_in >= todayInIndia() ? <div className="mt-10 text-center">
        {failure ? <p role="alert" className="mb-3 text-[15px] text-danger">{failure}</p> : null}
        <button onClick={() => void cancel()} disabled={cancelling} className="text-[15px] font-bold text-danger underline underline-offset-4 disabled:opacity-50">{cancelling ? 'Cancelling…' : 'Cancel booking'}</button>
      </div> : null}
    </div>
  </SiteLayout>;
}
