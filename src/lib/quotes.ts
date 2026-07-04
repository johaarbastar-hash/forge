import type { DayKey } from '../types';

/** Deterministic daily pick (SPEC §4.4): same dayKey → same quote. */
export function quoteForDay(dayKey: DayKey, quotes: readonly string[]): string {
  if (quotes.length === 0) return '';
  let hash = 0;
  for (let i = 0; i < dayKey.length; i++) {
    hash = (hash * 31 + dayKey.charCodeAt(i)) >>> 0;
  }
  return quotes[hash % quotes.length] ?? '';
}
