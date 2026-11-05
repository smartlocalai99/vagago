import Link from 'next/link';
import { Shell } from '@/components/admin/shell';
import { BookingRow } from '@/components/admin/booking-row';
import { Empty, Loading, Section } from '@/components/admin/ui';
import { useProperties, useReservations } from '@/lib/data';
import { fullDate, todayInIndia } from '@/lib/format';

export default function Home() {
  const { data: bookings, isLoading } = useReservations();
  const { data: hotels } = useProperties();
  const today = todayInIndia();
  const weekAhead = todayInIndia(7);
  const hotelName = (id: string) => hotels?.find((hotel) => hotel.id === id)?.name;
  const active = (bookings ?? []).filter((booking) => booking.status === 'confirmed' || booking.status === 'checked_in');
  const arrivals = active.filter((booking) => booking.check_in === today && booking.status === 'confirmed');
  const inHouse = active.filter((booking) => booking.status === 'checked_in');
  const upcoming = active.filter((booking) => booking.check_in > today && booking.check_in <= weekAhead);
  const latest = [...(bookings ?? [])].sort((a, b) => b.created_at.localeCompare(a.created_at)).slice(0, 5);
  const live = hotels?.filter((hotel) => hotel.status === 'published').length ?? 0;
  const pending = hotels?.filter((hotel) => hotel.status === 'draft' || hotel.status === 'in_review') ?? [];

  const stats = [
    { label: 'Arriving today', value: arrivals.length, href: '/admin/bookings/?tab=upcoming' },
    { label: 'In-house now', value: inHouse.length, href: '/admin/bookings/?tab=inhouse' },
    { label: 'Next 7 days', value: upcoming.length, href: '/admin/bookings/?tab=upcoming' },
    { label: 'Live hotels', value: live, href: '/admin/hotels/?filter=published' },
  ];

  return <Shell title="Home">
    <div className="px-4 pt-5">
      <p className="text-[13px] font-semibold text-muted">{fullDate(today)}</p>
      <div className="mt-3 grid grid-cols-2 gap-px overflow-hidden rounded-2xl border border-line bg-line">
        {stats.map((stat) => <Link key={stat.label} href={stat.href} className="bg-white px-4 py-3.5 active:bg-surface">
          <p className="text-[28px] leading-none font-bold tabular-nums">{isLoading ? '–' : stat.value}</p>
          <p className="mt-1.5 text-[13px] text-muted">{stat.label}</p>
        </Link>)}
      </div>
    </div>

    {pending.length ? <Link href="/admin/hotels/?filter=draft" className="mx-4 mt-4 flex items-center justify-between rounded-xl bg-warn-soft px-4 py-3 text-[14px] text-warn">
      <span><b>{pending.length}</b> {pending.length === 1 ? 'hotel is' : 'hotels are'} not live yet</span><span className="font-bold">Finish</span>
    </Link> : null}

    <Section title="Arriving today">
      {isLoading ? <Loading /> : arrivals.length ? <div className="border-t border-line">{arrivals.map((booking) => <BookingRow key={booking.id} booking={booking} hotel={hotelName(booking.property_id)} />)}</div>
        : <p className="px-4 text-[14px] text-muted">No arrivals today.</p>}
    </Section>

    <Section title="Latest bookings" action={<Link href="/admin/bookings/" className="text-[13px] font-bold text-forest">See all</Link>}>
      {isLoading ? <Loading /> : latest.length ? <div className="border-t border-line">{latest.map((booking) => <BookingRow key={booking.id} booking={booking} hotel={hotelName(booking.property_id)} />)}</div>
        : <Empty icon="calendar" title="No bookings yet" body="Bookings made in the VagaGo app appear here instantly." />}
    </Section>
  </Shell>;
}
