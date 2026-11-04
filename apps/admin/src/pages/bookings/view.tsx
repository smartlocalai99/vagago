import { useRouter } from 'next/router';
import { useState, type ReactNode } from 'react';
import { Shell } from '@/components/shell';
import { Icon } from '@/components/icons';
import { Button, Empty, Loading, StatusPill } from '@/components/ui';
import { cancelReservation, setReservationStatus, useProperties, useReservations, type ReservationStatus } from '@/lib/data';
import { fullDate, money, todayInIndia } from '@/lib/format';

function Line({ label, children }: { label: string; children: ReactNode }) {
  return <div className="flex justify-between gap-4 border-b border-line px-4 py-3 text-[14px]">
    <span className="text-muted">{label}</span><span className="text-right font-semibold">{children}</span>
  </div>;
}

export default function BookingView() {
  const router = useRouter();
  const id = typeof router.query.id === 'string' ? router.query.id : undefined;
  const { data: bookings, isLoading } = useReservations();
  const { data: hotels } = useProperties();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const booking = bookings?.find((item) => item.id === id);

  if (!router.isReady || isLoading) return <Shell title="Booking" back="/bookings/"><Loading /></Shell>;
  if (!booking) return <Shell title="Booking" back="/bookings/"><Empty icon="calendar" title="Booking not found" body="It may be older than two months." /></Shell>;

  const hotel = hotels?.find((item) => item.id === booking.property_id);
  const phone = booking.guest_phone.replace(/\D/g, '').slice(-10);
  const today = todayInIndia();

  async function run(action: () => Promise<void>) {
    setBusy(true);
    setError(null);
    try { await action(); } catch (caught) { setError(caught instanceof Error ? caught.message : 'Something went wrong.'); }
    setBusy(false);
  }
  const move = (status: ReservationStatus) => run(() => setReservationStatus(booking.id, status));
  const cancel = () => {
    const reason = window.prompt('Reason for cancelling (shared with the team)', '');
    if (reason !== null) void run(() => cancelReservation(booking.id, reason));
  };

  const actions = booking.status === 'confirmed'
    ? <div className="grid gap-2">
      <Button disabled={busy || booking.check_in > today} onClick={() => void move('checked_in')}>{booking.check_in > today ? `Check-in opens ${fullDate(booking.check_in)}` : 'Check in guest'}</Button>
      <div className="grid grid-cols-2 gap-2">
        <Button variant="secondary" disabled={busy || booking.check_in > today} onClick={() => void move('no_show')}>No-show</Button>
        <Button variant="danger" disabled={busy} onClick={cancel}>Cancel</Button>
      </div>
    </div>
    : booking.status === 'checked_in' ? <Button disabled={busy} onClick={() => void move('completed')}>Check out guest</Button> : null;

  return <Shell title={booking.reference} back="/bookings/" footer={actions}>
    <div className="px-4 pt-5 pb-4">
      <StatusPill reservation={booking.status} />
      <h2 className="mt-2 text-[24px] leading-tight font-bold">{booking.guest_name}</h2>
      <p className="mt-1 text-[14px] text-muted">{hotel?.name ?? 'Hotel'}{hotel?.area ? ` · ${hotel.area}` : ''}</p>
      <div className="mt-4 grid grid-cols-2 gap-2">
        <a href={`tel:+91${phone}`} className="flex min-h-12 items-center justify-center gap-2 rounded-xl bg-forest-soft font-bold text-forest"><Icon name="phone" size={18} />Call</a>
        <a href={`https://wa.me/91${phone}`} target="_blank" rel="noreferrer" className="flex min-h-12 items-center justify-center gap-2 rounded-xl bg-forest-soft font-bold text-forest"><Icon name="message" size={18} />WhatsApp</a>
      </div>
    </div>
    {error ? <p className="mx-4 mb-3 rounded-xl bg-danger-soft px-4 py-3 text-[13px] text-danger">{error}</p> : null}
    <div className="border-t border-line">
      <Line label="Check-in">{fullDate(booking.check_in)}</Line>
      <Line label="Check-out">{fullDate(booking.check_out)}</Line>
      <Line label="Stay">{booking.nights} {booking.nights === 1 ? 'night' : 'nights'} · {booking.guests} {booking.guests === 1 ? 'guest' : 'guests'}</Line>
      <Line label="Total">{money(booking.total_paise)}</Line>
      <Line label="Payment">{booking.payment_status === 'paid' ? 'Paid' : 'Pay at property'}</Line>
      <Line label="Phone">+91 {phone}</Line>
      {booking.guest_email ? <Line label="Email">{booking.guest_email}</Line> : null}
      <Line label="Booked on">{new Date(booking.created_at).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })}</Line>
      {booking.special_requests ? <Line label="Requests">{booking.special_requests}</Line> : null}
      {booking.cancellation_reason ? <Line label="Cancel reason">{booking.cancellation_reason}</Line> : null}
    </div>
  </Shell>;
}
