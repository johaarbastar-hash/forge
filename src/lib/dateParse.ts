import type { DayKey } from '../types';

const MONTHS = [
  'jan', 'feb', 'mar', 'apr', 'may', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec',
];

const pad = (n: number) => String(n).padStart(2, '0');

/**
 * Parse a loose date query into a DayKey. Accepts `YYYY-MM-DD`, `12 Jul`,
 * `Jul 12`, `12 July 2026` etc. Missing year defaults to `defaultYear`.
 * Returns null if it isn't a recognisable date.
 */
export function parseDateQuery(query: string, defaultYear: number): DayKey | null {
  const q = query.trim().toLowerCase();
  if (!q) return null;

  // ISO YYYY-MM-DD
  const iso = /^(\d{4})-(\d{2})-(\d{2})$/.exec(q);
  if (iso) {
    const [, y, m, d] = iso;
    const month = Number(m);
    const day = Number(d);
    if (month >= 1 && month <= 12 && day >= 1 && day <= 31) return `${y}-${m}-${d}`;
    return null;
  }

  // "12 jul", "jul 12", "12 july 2026"
  const tokens = q.replace(/,/g, ' ').split(/\s+/).filter(Boolean);
  let day: number | null = null;
  let month: number | null = null;
  let year: number | null = null;
  for (const tok of tokens) {
    const monthIdx = MONTHS.findIndex((mm) => tok.startsWith(mm));
    if (monthIdx >= 0 && month === null) {
      month = monthIdx + 1;
      continue;
    }
    const n = Number(tok);
    if (!Number.isNaN(n)) {
      if (n >= 1 && n <= 31 && day === null) day = n;
      else if (n >= 1000) year = n;
    }
  }
  if (day !== null && month !== null) {
    return `${year ?? defaultYear}-${pad(month)}-${pad(day)}`;
  }
  return null;
}
