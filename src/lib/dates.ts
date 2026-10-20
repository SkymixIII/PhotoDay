/** Local calendar day as YYYY-MM-DD (one selfie per user per local day). */
export function dayKey(date: Date = new Date()): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

/** YYYY-MM for the month containing `date`. */
export function monthKey(date: Date = new Date()): string {
  return dayKey(date).slice(0, 7);
}

/** First and last day (inclusive) of a YYYY-MM month, as day keys. */
export function monthRange(month: string): { from: string; to: string } {
  const [y, m] = month.split('-').map(Number);
  const last = new Date(y, m, 0).getDate();
  return { from: `${month}-01`, to: `${month}-${String(last).padStart(2, '0')}` };
}

/** The month before a YYYY-MM month. */
export function previousMonth(month: string): string {
  const [y, m] = month.split('-').map(Number);
  return monthKey(new Date(y, m - 2, 1));
}
