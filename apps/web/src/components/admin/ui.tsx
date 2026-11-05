import Link from 'next/link';
import type { ButtonHTMLAttributes, InputHTMLAttributes, ReactNode, SelectHTMLAttributes, TextareaHTMLAttributes } from 'react';
import type { PropertyStatus, ReservationStatus } from '@/lib/data';
import { Icon, type IconName } from '../icons';

export function Button({ variant = 'primary', className = '', ...props }: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: 'primary' | 'secondary' | 'danger' | 'ghost' }) {
  const styles = {
    primary: 'bg-forest text-white active:bg-forest/85',
    secondary: 'bg-forest-soft text-forest active:bg-forest-soft/70',
    danger: 'bg-danger-soft text-danger active:bg-danger-soft/70',
    ghost: 'text-forest underline underline-offset-4',
  }[variant];
  return <button {...props} className={`min-h-12 rounded-xl px-5 text-[15px] font-bold transition-opacity disabled:opacity-45 ${styles} ${className}`} />;
}

export function Field({ label, hint, error, children }: { label: string; hint?: string; error?: string | null; children: ReactNode }) {
  return <label className="block space-y-1.5">
    <span className="text-[13px] font-semibold">{label}</span>
    {children}
    {error ? <span className="block text-[12px] text-danger">{error}</span> : hint ? <span className="block text-[12px] text-muted">{hint}</span> : null}
  </label>;
}

export const Input = (props: InputHTMLAttributes<HTMLInputElement>) => <input {...props} className={`field ${props.className ?? ''}`} />;
export const Select = (props: SelectHTMLAttributes<HTMLSelectElement>) => <select {...props} className={`field appearance-none ${props.className ?? ''}`} />;
export const TextArea = (props: TextareaHTMLAttributes<HTMLTextAreaElement>) => <textarea rows={4} {...props} className={`field resize-none leading-6 ${props.className ?? ''}`} />;

const propertyStatus: Record<PropertyStatus, [string, string]> = {
  draft: ['Draft', 'bg-surface text-muted'],
  in_review: ['In review', 'bg-warn-soft text-warn'],
  published: ['Live', 'bg-ok-soft text-ok'],
  suspended: ['Suspended', 'bg-danger-soft text-danger'],
};
const reservationStatus: Record<ReservationStatus, [string, string]> = {
  confirmed: ['Confirmed', 'bg-forest-soft text-forest'],
  checked_in: ['Checked in', 'bg-ok-soft text-ok'],
  completed: ['Completed', 'bg-surface text-muted'],
  cancelled: ['Cancelled', 'bg-danger-soft text-danger'],
  no_show: ['No-show', 'bg-warn-soft text-warn'],
};

export function StatusPill({ property, reservation }: { property?: PropertyStatus; reservation?: ReservationStatus }) {
  const [label, style] = property ? propertyStatus[property] : reservationStatus[reservation!];
  return <span className={`inline-flex shrink-0 items-center rounded-full px-2.5 py-1 text-[11px] font-bold ${style}`}>{label}</span>;
}

export function Empty({ icon, title, body, action }: { icon: IconName; title: string; body: string; action?: ReactNode }) {
  return <div className="flex flex-col items-center px-6 py-14 text-center">
    <div className="mb-4 grid size-14 place-items-center rounded-2xl bg-forest-soft text-forest"><Icon name={icon} size={26} /></div>
    <p className="text-[17px] font-bold">{title}</p>
    <p className="mt-1.5 max-w-xs text-[14px] leading-6 text-muted">{body}</p>
    {action ? <div className="mt-5">{action}</div> : null}
  </div>;
}

export function Row({ href, children }: { href: string; children: ReactNode }) {
  return <Link href={href} className="flex items-center gap-3 border-b border-line px-4 py-3.5 active:bg-surface">
    {children}
    <Icon name="chevron" size={16} className="shrink-0 text-muted" />
  </Link>;
}

export function Section({ title, action, children }: { title: string; action?: ReactNode; children: ReactNode }) {
  return <section className="mt-6">
    <div className="flex items-baseline justify-between px-4 pb-2">
      <h2 className="text-[15px] font-bold">{title}</h2>
      {action}
    </div>
    {children}
  </section>;
}

export function Loading() {
  return <div className="space-y-px" aria-label="Loading">
    {[0, 1, 2, 3].map((item) => <div key={item} className="h-[68px] animate-pulse bg-surface" />)}
  </div>;
}
