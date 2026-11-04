export function formatDate(value: string) {
  const date = new Date(`${value}T12:00:00Z`);
  return Number.isNaN(date.getTime()) ? 'Choose a date' : new Intl.DateTimeFormat('en-IN', { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'UTC' }).format(date);
}
