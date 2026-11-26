import Link from 'next/link';
import { useRouter } from 'next/router';
import { useEffect, useState, type FormEvent } from 'react';
import { Icon } from '@/components/icons';
import { SiteLayout } from '@/components/site/layout';
import { fullDate, money } from '@/lib/format';
import { bookingError, ensureGuest, guest } from '@/lib/guest';
import { bookingFeePaise, listingColumns, toListing, type Listing } from '@/lib/listings';
import { nightsBetween, readTrip, tripParams, tripProblem } from '@/lib/trip';

type Form = { name: string; phone: string; email: string; requests: string };
type Errors = Partial<Record<keyof Form, string>>;

function validate(form: Form): Errors {
  const errors: Errors = {};
  const name = form.name.trim();
  if (name.length < 2 || name.length > 100 || !/^[\p{L}\p{M} .’'-]+$/u.test(name)) errors.name = 'Enter the guest’s full name.';
  if (!/^[6-9]\d{9}$/.test(form.phone.replace(/[\s-]/g, ''))) errors.phone = 'Enter a valid 10-digit Indian mobile number.';
  if (form.email.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) errors.email = 'Enter a valid email address or leave it blank.';
  return errors;
}

const input = 'mt-1.5 w-full rounded-xl border border-line px-4 py-3 text-[16px] outline-none focus:border-forest focus:shadow-[0_0_0_3px_rgba(7,55,40,0.12)]';

export default function Book() {
  const router = useRouter();
  const slug = typeof router.query.stay === 'string' ? router.query.stay : '';
  const roomId = typeof router.query.room === 'string' ? router.query.room : '';
  const trip = readTrip(router.query);
  const [loaded, setLoaded] = useState<{ slug: string; stay: Listing | null } | null>(null);
  const [form, setForm] = useState<Form>({ name: '', phone: '', email: '', requests: '' });
  const [errors, setErrors] = useState<Errors>({});
  const [failure, setFailure] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!slug) return;
    void guest().from('properties').select(listingColumns).eq('status', 'published').eq('slug', slug).maybeSingle()
      .then(({ data }) => setLoaded({ slug, stay: data ? toListing(data as never) : null }));
  }, [slug]);
  // undefined while loading, null when the link has no stay or it is no longer listed.
  const stay = !router.isReady ? undefined : !slug ? null : loaded?.slug === slug ? loaded.stay : undefined;

  const room = stay?.rooms.find((item) => item.id === roomId) ?? stay?.rooms[0];
  const nights = nightsBetween(trip.checkIn, trip.checkOut);
  const problem = tripProblem(trip) ?? (room && trip.guests > room.capacity ? `${room.name} fits up to ${room.capacity} guests.` : null);
  const change = (field: keyof Form) => (event: { target: { value: string } }) => {
    setForm((current) => ({ ...current, [field]: event.target.value }));
    setErrors((current) => ({ ...current, [field]: undefined }));
  };

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    if (!room || problem) return;
    const found = validate(form);
    setErrors(found);
    if (Object.keys(found).length) return;
    setBusy(true);
    setFailure(null);
    try {
      await ensureGuest();
      const { data, error } = await guest().rpc('create_reservation', {
        p_room_type_id: room.id, p_check_in: trip.checkIn, p_check_out: trip.checkOut, p_guests: trip.guests,
        p_guest_name: form.name.trim(), p_guest_phone: form.phone, p_guest_email: form.email.trim() || undefined,
        p_special_requests: form.requests.trim() || undefined,
      });
      if (error || !data) throw new Error(error?.message ?? '');
      await router.replace(`/trips/${data.id}/?new=1`);
    } catch (caught) {
      setFailure(bookingError(caught instanceof Error ? caught.message : ''));
      setBusy(false);
    }
  };

  if (stay === undefined) return <SiteLayout title="Confirm your booking" description="Confirm your VagaGo booking." bare><div className="grid min-h-[60vh] place-items-center"><div className="size-8 animate-spin rounded-full border-2 border-forest border-t-transparent" /></div></SiteLayout>;
  if (!stay || !room) return <SiteLayout title="Stay not found" description="This stay is no longer listed.">
    <div className="mx-auto max-w-xl px-4 py-20 text-center"><h1 className="text-[26px] font-extrabold">This stay is no longer available</h1><Link href="/stays/" className="mt-6 inline-block rounded-full bg-forest px-5 py-3 font-bold text-white">Browse stays</Link></div>
  </SiteLayout>;

  return <SiteLayout title="Confirm your booking" description={`Book ${stay.name} in Vagamon.`} bare>
    <div className="mx-auto max-w-[1100px] px-4 py-8 sm:px-6">
      <Link href={`/stays/${stay.slug}/?${tripParams(trip)}`} className="inline-flex items-center gap-1.5 text-[15px] font-semibold text-muted hover:text-ink"><Icon name="back" size={18} />Back to {stay.name}</Link>
      <h1 className="mt-4 text-[30px] font-extrabold tracking-[-0.03em] md:text-[36px]">Confirm your booking</h1>
      <div className="mt-8 grid gap-10 lg:grid-cols-[1fr_400px]">
        <form onSubmit={(event) => void submit(event)} noValidate className="space-y-5">
          <h2 className="text-[20px] font-bold">Who’s checking in?</h2>
          <label className="block"><span className="text-[14px] font-bold">Full name</span>
            <input value={form.name} onChange={change('name')} autoComplete="name" maxLength={100} aria-invalid={Boolean(errors.name)} className={input} />
            {errors.name ? <span className="mt-1 block text-[13px] text-danger">{errors.name}</span> : null}
          </label>
          <label className="block"><span className="text-[14px] font-bold">Mobile number</span>
            <div className="relative"><span className="absolute top-1/2 left-4 mt-[3px] -translate-y-1/2 text-[16px] text-muted">+91</span>
              <input value={form.phone} onChange={change('phone')} inputMode="numeric" autoComplete="tel-national" maxLength={12} aria-invalid={Boolean(errors.phone)} className={`${input} pl-14`} />
            </div>
            {errors.phone ? <span className="mt-1 block text-[13px] text-danger">{errors.phone}</span> : <span className="mt-1 block text-[13px] text-muted">The property may call you about your arrival.</span>}
          </label>
          <label className="block"><span className="text-[14px] font-bold">Email <span className="font-medium text-muted">(optional)</span></span>
            <input type="email" value={form.email} onChange={change('email')} autoComplete="email" aria-invalid={Boolean(errors.email)} className={input} />
            {errors.email ? <span className="mt-1 block text-[13px] text-danger">{errors.email}</span> : null}
          </label>
          <label className="block"><span className="text-[14px] font-bold">Requests for the property <span className="font-medium text-muted">(optional)</span></span>
            <textarea value={form.requests} onChange={change('requests')} rows={3} maxLength={500} placeholder="Arrival time, dietary needs, anything else" className={`${input} resize-none`} />
          </label>
          <div className="flex gap-3 rounded-2xl bg-save-soft p-4 text-save"><Icon name="cash" className="shrink-0" /><p className="text-[15px] leading-6"><strong>Pay at the stay.</strong> Nothing is charged now. You pay the property when you check in.</p></div>
          {problem ? <p role="alert" className="text-[15px] font-semibold text-danger">{problem} <Link href={`/stays/${stay.slug}/`} className="underline">Change dates</Link></p> : null}
          {failure ? <p role="alert" className="rounded-xl bg-danger-soft p-4 text-[15px] text-danger">{failure}</p> : null}
          <button type="submit" disabled={busy || Boolean(problem)} className="min-h-14 w-full rounded-xl bg-action text-[16px] font-bold text-white transition-opacity hover:opacity-90 disabled:opacity-40">{busy ? 'Confirming…' : 'Confirm booking'}</button>
        </form>

        <aside className="h-fit overflow-hidden rounded-2xl border border-line lg:sticky lg:top-24">
          {stay.photos[0] ? <img src={stay.photos[0].full} srcSet={`${stay.photos[0].thumb} 480w, ${stay.photos[0].full} 1600w`} sizes="400px" alt="" className="aspect-[16/9] w-full object-cover" /> : null}
          <div className="space-y-4 p-5">
            <div><p className="text-[18px] font-bold">{stay.name}</p><p className="text-[14px] text-muted">{room.name}, {stay.area}</p></div>
            <dl className="space-y-2 border-t border-line pt-4 text-[15px]">
              <div className="flex justify-between gap-4"><dt className="text-muted">Check-in</dt><dd className="text-right font-semibold">{fullDate(trip.checkIn)}</dd></div>
              <div className="flex justify-between gap-4"><dt className="text-muted">Check-out</dt><dd className="text-right font-semibold">{fullDate(trip.checkOut)}</dd></div>
              <div className="flex justify-between gap-4"><dt className="text-muted">Guests</dt><dd className="font-semibold">{trip.guests}</dd></div>
            </dl>
            {nights > 0 ? <dl className="space-y-2 border-t border-line pt-4 text-[15px]">
              <div className="flex justify-between"><dt className="text-muted">{money(room.rate)} × {nights} {nights === 1 ? 'night' : 'nights'}</dt><dd className="tabular-nums">{money(room.rate * nights)}</dd></div>
              <div className="flex justify-between"><dt className="text-muted">Booking fee <span className="font-semibold text-save">flat</span></dt><dd className="tabular-nums">{money(bookingFeePaise)}</dd></div>
              <div className="flex justify-between text-[17px] font-bold"><dt>Total</dt><dd className="tabular-nums">{money(room.rate * nights + bookingFeePaise)}</dd></div>
              <p className="text-[13px] text-muted">Plus taxes and fees charged by the property.</p>
            </dl> : null}
          </div>
        </aside>
      </div>
    </div>
  </SiteLayout>;
}
