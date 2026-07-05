import { addDaysToKey, weekStartKey } from '../../lib/dates';
import type { DayKey } from '../../types';

export type CalendarCell = { dayKey: DayKey; inMonth: boolean };

const pad = (n: number) => String(n).padStart(2, '0');

/** Days in a 1-based month (month 1–12). */
export function daysInMonth(year: number, month: number): number {
  return new Date(year, month, 0).getDate();
}

/**
 * Weeks (Monday-first) covering `month` (1–12) of `year`, each a 7-cell row.
 * Leading/trailing cells from adjacent months are marked `inMonth: false`.
 */
export function monthGrid(year: number, month: number): CalendarCell[][] {
  const prefix = `${year}-${pad(month)}`;
  const firstDay = `${prefix}-01`;
  const lastDayKey = `${prefix}-${pad(daysInMonth(year, month))}`;
  const weeks: CalendarCell[][] = [];
  let cursor = weekStartKey(firstDay);
  do {
    const week: CalendarCell[] = Array.from({ length: 7 }, (_, i) => {
      const dayKey = addDaysToKey(cursor, i);
      return { dayKey, inMonth: dayKey.slice(0, 7) === prefix };
    });
    weeks.push(week);
    cursor = addDaysToKey(cursor, 7);
  } while (cursor <= lastDayKey);
  return weeks;
}

export function monthLabel(year: number, month: number): string {
  return new Intl.DateTimeFormat('en-GB', { month: 'long', year: 'numeric' }).format(
    new Date(year, month - 1, 1),
  );
}

/** Move a {year, month} by `delta` months, wrapping the year. */
export function shiftMonth(year: number, month: number, delta: number): { year: number; month: number } {
  const zero = year * 12 + (month - 1) + delta;
  return { year: Math.floor(zero / 12), month: (zero % 12) + 1 };
}
