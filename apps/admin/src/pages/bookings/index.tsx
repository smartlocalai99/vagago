import { useRouter } from 'next/router';
import { useMemo, useState } from 'react';
import { BookingRow } from '@/components/booking-row';
import { Shell } from '@/components/shell';
import { Icon } from '@/components/icons';
import { Empty, Loading } from '@/components/ui';
import { useProperties, useReservations, type Reservation } from '@/lib/data';
import { todayInIndia } from '@/lib/format';

const tabs = [
  { id: 'upcoming', label: 'Upcoming' },
  { id: 'inhouse', label: 'In-house' },
  { id: 'past', label: 'Past' },
  { id: 'cancelled', label: 'Cancelled' },
] as const;
type Tab = (typeof tabs)[number]['id'];

function tabOf(booking: Reservation, today: string): Tab {
  if (booking.status === 'cancelled' || booking.status === 'no_show') return 'cancelled';
  if (booking.status === 'checked_in') return 'inhouse';
  if (booking.status === 'completed' || booking.check_out < today) return 'past';
  return 'upcoming';
}

export default function Bookings() {
  const router = useRouter();
  const tab = (tabs.find((item) => item.id === router.query.tab)?.id ?? 'upcoming') as Tab;
  const [query, setQuery] = useState('');
  const { data: bookings, isLoading } = useReservations();
  const { data: hotels } = useProperties();
  const today = todayInIndia();
  const hotelName = (id: string) => hotels?.find((hotel) => hotel.id === id)?.name;

  const counts = useMemo(() => {
    const result: Record<Tab, number> = { upcoming: 0, inhouse: 0, past: 0, cancelled: 0 };
    for (const booking of bookings ?? []) result[tabOf(booking, today)] += 1;
    return result;
  }, [bookings, today]);

  const needle = query.trim().toLowerCase();
  const visible = (bookings ?? [])
    .filter((booking) => tabOf(booking, today) === tab)
    .filter((booking) => !needle || [booking.guest_name, booking.guest_phone, booking.reference, hotelName(booking.property_id) ?? ''].some((value) => value.toLowerCase().includes(needle)));
  if (tab === 'past' || tab === 'cancelled') visible.reverse();

  return <Shell title="Bookings">
    <div className="sticky top-14 z-10 space-y-3 bg-white px-4 pt-3 pb-2">
      <div className="flex items-center gap-2 rounded-xl bg-surface px-3">
        <Icon name="search" size={18} className="text-muted" />
        <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Guest, phone, hotel or booking ID"
          className="min-h-11 flex-1 bg-transparent outline-none" aria-label="Search bookings" />
      </div>
      <div className="flex gap-1.5 overflow-x-auto">
        {tabs.map((item) => <button key={item.id} onClick={() => void router.replace({ query: { tab: item.id } }, undefined, { shallow: true })}
          className={`shrink-0 rounded-full px-3.5 py-2 text-[13px] font-semibold ${tab === item.id ? 'bg-forest text-white' : 'bg-surface text-ink'}`}>
          {item.label} <span className="tabular-nums opacity-70">{counts[item.id]}</span>
        </button>)}
      </div>
    </div>
    {isLoading ? <Loading /> : visible.length ? <div className="border-t border-line">{visible.map((booking) => <BookingRow key={booking.id} booking={booking} hotel={hotelName(booking.property_id)} />)}</div>
      : <Empty icon="calendar" title={needle ? 'No matching bookings' : 'Nothing here yet'} body={needle ? 'Try a different name, phone number or booking ID.' : 'Bookings move between these lists as guests arrive and leave.'} />}
  </Shell>;
}
