import { Row, StatusPill } from '@/components/ui';
import type { Reservation } from '@/lib/data';
import { dayMonth, money } from '@/lib/format';

export function BookingRow({ booking, hotel }: { booking: Reservation; hotel?: string }) {
  return <Row href={`/bookings/view/?id=${booking.id}`}>
    <div className="min-w-0 flex-1">
      <div className="flex items-center gap-2">
        <p className="truncate text-[15px] font-semibold">{booking.guest_name}</p>
        <StatusPill reservation={booking.status} />
      </div>
      <p className="truncate text-[13px] text-muted">{hotel ?? 'Hotel'} · {dayMonth(booking.check_in)} – {dayMonth(booking.check_out)} · {booking.guests} guests</p>
    </div>
    <p className="shrink-0 text-[14px] font-bold tabular-nums">{money(booking.total_paise)}</p>
  </Row>;
}
