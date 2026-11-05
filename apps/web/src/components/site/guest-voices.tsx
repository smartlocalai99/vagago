import Link from 'next/link';
import { useEffect, useState } from 'react';
import { Icon } from '@/components/icons';
import type { GuestReview } from '@/lib/listings';

type Slide = { text: string; author?: string; scores: (number | null)[] };

// Until guests have published reviews, the card shows what booking with VagaGo guarantees.
const promises: Slide[] = [
  { text: 'Pay at the stay. Nothing is charged when you book.', scores: [null, null, null] },
  { text: 'See the exact address and directions the moment you book.', scores: [null, null, null] },
  { text: 'Plans changed? Cancel free of charge any time before check-in.', scores: [null, null, null] },
];
const categories = ['Accommodation', 'Connectivity', 'Cleanliness'];

function usePrefersReducedMotion() {
  const [reduced, setReduced] = useState(false);
  useEffect(() => {
    const query = window.matchMedia('(prefers-reduced-motion: reduce)');
    const update = () => setReduced(query.matches);
    update();
    query.addEventListener('change', update);
    return () => query.removeEventListener('change', update);
  }, []);
  return reduced;
}

// Types each slide out, holds it, erases it and moves on.
function useTypewriter(slides: Slide[], reduced: boolean) {
  const [index, setIndex] = useState(0);
  const [shown, setShown] = useState(0);
  const [phase, setPhase] = useState<'typing' | 'holding' | 'erasing'>('typing');
  const text = slides[index].text;

  useEffect(() => {
    if (reduced) {
      const timer = setTimeout(() => setIndex((current) => (current + 1) % slides.length), 6000);
      return () => clearTimeout(timer);
    }
    let timer: ReturnType<typeof setTimeout>;
    if (phase === 'typing') {
      timer = shown < text.length ? setTimeout(() => setShown(shown + 1), 28) : setTimeout(() => setPhase('holding'), 0);
    } else if (phase === 'holding') {
      timer = setTimeout(() => setPhase('erasing'), 3200);
    } else {
      timer = shown > 0 ? setTimeout(() => setShown(shown - 2 < 0 ? 0 : shown - 2), 12) : setTimeout(() => {
        setIndex((current) => (current + 1) % slides.length);
        setPhase('typing');
      }, 180);
    }
    return () => clearTimeout(timer);
  }, [phase, shown, text.length, slides.length, reduced]);

  return { index, typed: reduced ? text : text.slice(0, shown), done: reduced || phase !== 'typing' };
}

// Golden stars that pop in one after another each time the quote changes. Each star fills
// by the review's score; with no reviews yet they stay as golden outlines.
function Stars({ value, delay }: { value: number | null; delay: number }) {
  return <span className="flex gap-0.5 text-[#E9A23B]" aria-hidden>
    {[0, 1, 2, 3, 4].map((star) => {
      const fill = value === null ? 0 : Math.min(1, Math.max(0, value - star));
      return <span key={star} className="star-pop relative inline-flex" style={{ animationDelay: `${delay + star * 70}ms` }}>
        <Icon name="star" size={15} />
        {fill > 0 ? <span className="absolute inset-y-0 left-0 overflow-hidden [&_path]:fill-current" style={{ width: `${fill * 100}%` }}><Icon name="star" size={15} className="shrink-0" /></span> : null}
      </span>;
    })}
  </span>;
}

export function GuestVoices({ reviews, thumbs }: { reviews: GuestReview[]; thumbs: string[] }) {
  const reduced = usePrefersReducedMotion();
  const live = reviews.length > 0;
  const slides: Slide[] = live
    ? reviews.map((review) => ({ text: review.comment, author: `${review.author}${review.stay ? `, stayed at ${review.stay}` : ''}`, scores: [review.accommodation, review.connectivity, review.cleanliness] }))
    : promises;
  const { index, typed, done } = useTypewriter(slides, reduced);
  const slide = slides[index];

  return <div className="flex flex-col justify-between gap-4 rounded-[26px] border border-white/70 bg-white/85 p-5 backdrop-blur-xl">
    <div className="grid gap-5 sm:grid-cols-[1.12fr_1fr] sm:gap-0 sm:divide-x sm:divide-line">
      <div className="min-w-0 sm:pr-5" aria-live="polite">
        <p className="text-[13px] font-bold text-muted">{live ? 'What guests say' : 'Booking with VagaGo'}</p>
        <p className="mt-2 min-h-[84px] font-display text-[22px] leading-[1.25] font-semibold text-ink">
          <span className="text-forest">“</span>{typed}{!done ? <span className="ml-0.5 inline-block h-[0.95em] w-[2px] translate-y-[3px] animate-pulse bg-forest" /> : <span className="text-forest">”</span>}
        </p>
        <p className={`mt-1 min-h-5 text-[13px] text-muted transition-opacity duration-500 ${slide.author && done ? 'opacity-100' : 'opacity-0'}`}>{slide.author ? `— ${slide.author}` : ''}</p>
        <div className="mt-2 flex gap-1.5" aria-hidden>{slides.map((item, dot) => <span key={item.text} className={`h-1.5 rounded-full transition-all duration-500 ${dot === index ? 'w-5 bg-forest' : 'w-1.5 bg-line'}`} />)}</div>
      </div>
      <div className="sm:pl-5">
        <p className="text-[13px] font-bold text-muted">Guest ratings</p>
        <ul className="mt-2 space-y-2.5">
          {categories.map((name, row) => {
            const value = slide.scores[row];
            return <li key={name} className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1">
              <span className="text-[14px] font-semibold">{name}</span>
              <span className="flex items-center gap-2">
                <Stars key={`${index}-${row}`} value={value} delay={row * 160} />
                {value === null ? <span className="rounded-full bg-forest-soft px-2 py-0.5 text-[11px] font-bold text-forest">New</span>
                  : <span className="w-7 text-right text-[14px] font-extrabold tabular-nums" aria-label={`${name} ${value} out of 5`}>{value.toFixed(1)}</span>}
              </span>
            </li>;
          })}
        </ul>
        {!live ? <p className="mt-2.5 text-[12px] leading-4 text-muted">Ratings appear here once guests review their stay.</p> : null}
      </div>
    </div>
    <div className="flex items-center gap-4 border-t border-line pt-4">
      <div className="flex -space-x-3">
        {thumbs.map((src) => <img key={src} src={src} alt="" className="size-10 rounded-full border-2 border-white object-cover" />)}
        <Link href="/stays/" aria-label="See all stays" className="grid size-10 place-items-center rounded-full border-2 border-white bg-forest text-white"><Icon name="plus" size={18} /></Link>
      </div>
      <p className="text-[14px] leading-5 text-ink/80">Cottages, homestays and villas. <span className="font-bold text-ink">Nothing to pay until you arrive.</span></p>
    </div>
  </div>;
}
