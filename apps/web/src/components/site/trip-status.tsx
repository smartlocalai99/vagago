import type { Database } from '@/lib/database.types';

type Status = Database['public']['Enums']['reservation_status'];

const labels: Record<Status, [string, string]> = {
  confirmed: ['Confirmed', 'bg-save-soft text-save'],
  checked_in: ['Checked in', 'bg-forest-soft text-forest'],
  completed: ['Completed', 'bg-surface text-muted'],
  cancelled: ['Cancelled', 'bg-danger-soft text-danger'],
  no_show: ['Missed', 'bg-warn-soft text-warn'],
};

export function TripStatus({ status }: { status: Status }) {
  const [label, style] = labels[status];
  return <span className={`inline-flex shrink-0 rounded-full px-2.5 py-1 text-[12px] font-bold ${style}`}>{label}</span>;
}
