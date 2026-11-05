import Link from 'next/link';
import { useRouter } from 'next/router';
import { useState, type FormEvent, type MouseEvent } from 'react';
import { Icon, type IconName } from '@/components/icons';
import { money, todayInIndia } from '@/lib/format';
import { discountPercent, styleLabel, type Listing } from '@/lib/listings';
import { addDays, nightsBetween, tripParams, type TripQuery } from '@/lib/trip';

export function DealPrice({ rate, compareAt, size = 'lg' }: { rate: number; compareAt: number | null; size?: 'md' | 'lg' | 'xl' }) {
  const discount = discountPercent(rate, compareAt);
  const big = { md: 'text-[20px]', lg: 'text-[24px]', xl: 'text-[28px]' }[size];
  return <p className="flex flex-wrap items-baseline gap-x-2" aria-label={`${money(rate)} per night${discount ? `, was ${money(compareAt!)}, ${discount}% off` : ''}`}>
    <span className={`${big} font-extrabold tracking-[-0.02em] tabular-nums`}>{money(rate)}</span>
    {discount ? <span className="text-[15px] text-muted line-through tabular-nums">{money(compareAt!)}</span> : null}
    {discount ? <span className="text-[15px] font-bold text-save">{discount}% off</span> : null}
  </p>;
}

export function Chip({ icon, children, tone = 'neutral' }: { icon?: IconName; children: string; tone?: 'neutral' | 'save' }) {
  return <span className={`inline-flex items-center gap-1.5 rounded-md px-2 py-1 text-[13px] font-medium ${tone === 'save' ? 'bg-save-soft text-save' : 'bg-surface text-ink'}`}>
    {icon ? <Icon name={icon} size={15} /> : null}{children}
  </span>;
}

export function StayCard({ stay, trip }: { stay: Listing; trip?: TripQuery }) {
  const nights = trip ? nightsBetween(trip.checkIn, trip.checkOut) : 0;
  const cover = stay.photos[0];
  return <Link href={`/stays/${stay.slug}/${trip ? `?${tripParams(trip)}` : ''}`}
    className="group flex flex-col overflow-hidden rounded-2xl bg-white shadow-[0_2px_14px_rgba(0,0,0,0.08)] transition-shadow hover:shadow-[0_6px_24px_rgba(0,0,0,0.13)]">
    <div className="relative aspect-[4/3] overflow-hidden bg-surface">
      {cover ? <img src={cover.full} srcSet={`${cover.thumb} 480w, ${cover.full} 1600w`} sizes="(min-width: 1024px) 380px, (min-width: 640px) 50vw, 100vw"
        alt={stay.name} loading="lazy" className="size-full object-cover transition-transform duration-500 group-hover:scale-[1.03]" /> : null}
      <span className="absolute top-3 left-3 inline-flex items-center gap-1.5 rounded-md bg-white px-2 py-1 text-[13px] font-semibold"><Icon name="home" size={14} />{styleLabel[stay.style]}</span>
    </div>
    <div className="flex flex-1 flex-col gap-1 p-4">
      <div className="mb-1 flex flex-wrap gap-2"><Chip icon="cash" tone="save">Pay at stay</Chip><Chip icon="users">{`Up to ${stay.capacity} guests`}</Chip></div>
      <h3 className="text-[18px] leading-6 font-bold">{stay.name}</h3>
      <p className="text-[14px] text-muted">{stay.area}, Vagamon</p>
      <div className="mt-auto pt-3">
        <DealPrice rate={stay.rate} compareAt={stay.compareAt} />
        <p className="text-[13px] text-muted">per night + taxes & fees{nights > 0 ? ` · ${money(stay.rate * nights)} for ${nights} ${nights === 1 ? 'night' : 'nights'}` : ''}</p>
      </div>
    </div>
  </Link>;
}

const fieldLabel = 'block text-[12px] font-bold text-muted';
const fieldInput = 'mt-1 w-full bg-transparent text-[16px] font-semibold text-ink outline-none';

// Booking-site search: what or where, dates and guests. Results open on /stays.
export function SearchForm({ trip, query = '', variant = 'card' }: { trip: TripQuery; query?: string; variant?: 'card' | 'compact' | 'glass' }) {
  const router = useRouter();
  const [q, setQ] = useState(query);
  const [checkIn, setCheckIn] = useState(trip.checkIn);
  const [checkOut, setCheckOut] = useState(trip.checkOut);
  const [guests, setGuests] = useState(trip.guests);
  const today = todayInIndia();

  const changeCheckIn = (value: string) => {
    setCheckIn(value);
    if (value && nightsBetween(value, checkOut) < 1) setCheckOut(addDays(value, 1));
  };
  const submit = (event: FormEvent) => {
    event.preventDefault();
    void router.push({ pathname: '/stays/', query: { ...(q.trim() ? { q: q.trim() } : {}), in: checkIn, out: checkOut, guests } });
  };

  // The whole field works like a button: clicking anywhere in it focuses the input or
  // opens the date or guest picker.
  const openField = (event: MouseEvent<HTMLLabelElement>) => {
    const field = event.currentTarget.querySelector('input, select') as HTMLInputElement | HTMLSelectElement | null;
    if (!field) return;
    field.focus();
    if ((field.type === 'date' || field.tagName === 'SELECT') && 'showPicker' in field) {
      try { field.showPicker(); } catch { /* already open or not allowed */ }
    }
  };
  const glass = variant === 'glass';
  const cell = glass ? 'cursor-pointer rounded-2xl px-4 py-2 hover:bg-white/60 focus-within:bg-white/70 md:rounded-full'
    : `cursor-pointer rounded-xl px-4 py-2.5 ${variant === 'compact' ? 'border border-line' : 'hover:bg-surface'} focus-within:bg-surface`;
  const shell = glass ? 'rounded-[26px] border border-white/70 bg-white/80 shadow-[0_12px_40px_rgba(0,0,0,0.14)] backdrop-blur-xl md:rounded-full'
    : `rounded-2xl bg-white ${variant === 'compact' ? '' : 'shadow-[0_10px_40px_rgba(0,0,0,0.18)]'}`;
  return <form onSubmit={submit} role="search" aria-label="Search stays"
    className={`grid gap-2 p-2 ${shell} md:grid-cols-[1.6fr_1fr_1fr_0.8fr_auto] md:items-center`}>
    <label className={cell} onClick={openField}><span className={fieldLabel}>Where in Vagamon</span>
      <input value={q} onChange={(event) => setQ(event.target.value)} maxLength={120} placeholder="Any stay or place, e.g. Pine Forest" className={`${fieldInput} placeholder:font-medium placeholder:text-muted`} />
    </label>
    <div className="grid grid-cols-2 gap-2 md:contents">
      <label className={cell} onClick={openField}><span className={fieldLabel}>Check-in</span>
        <input type="date" required min={today} value={checkIn} onChange={(event) => changeCheckIn(event.target.value)} className={`${fieldInput} cursor-pointer`} />
      </label>
      <label className={cell} onClick={openField}><span className={fieldLabel}>Check-out</span>
        <input type="date" required min={checkIn ? addDays(checkIn, 1) : today} value={checkOut} onChange={(event) => setCheckOut(event.target.value)} className={`${fieldInput} cursor-pointer`} />
      </label>
    </div>
    <label className={cell} onClick={openField}><span className={fieldLabel}>Guests</span>
      <select value={guests} onChange={(event) => setGuests(Number(event.target.value))} className={`${fieldInput} cursor-pointer appearance-none`}>
        {Array.from({ length: 12 }, (_, index) => index + 1).map((count) => <option key={count} value={count}>{count} {count === 1 ? 'guest' : 'guests'}</option>)}
      </select>
    </label>
    <button type="submit" className={`flex min-h-14 items-center justify-center gap-2 px-7 text-[16px] font-bold text-white transition-opacity hover:opacity-90 ${glass ? 'rounded-2xl bg-forest md:rounded-full' : 'rounded-xl bg-action'}`}>
      <Icon name="search" size={20} />Search
    </button>
  </form>;
}
