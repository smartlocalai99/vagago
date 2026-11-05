const rupees = new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 });
const shortDate = new Intl.DateTimeFormat('en-IN', { day: 'numeric', month: 'short', timeZone: 'UTC' });
const longDate = new Intl.DateTimeFormat('en-IN', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric', timeZone: 'UTC' });

export const money = (paise: number) => rupees.format(paise / 100);
export const dayMonth = (date: string) => shortDate.format(new Date(`${date}T00:00:00Z`));
export const fullDate = (date: string) => longDate.format(new Date(`${date}T00:00:00Z`));

// Vagamon runs on India time regardless of where the admin's phone is set.
export function todayInIndia(offsetDays = 0) {
  const now = new Date(Date.now() + 5.5 * 3_600_000 + offsetDays * 86_400_000);
  return now.toISOString().slice(0, 10);
}

export function slugify(name: string) {
  const base = name.toLowerCase().normalize('NFKD').replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 48) || 'stay';
  return `${base}-${Math.random().toString(36).slice(2, 6)}`;
}
