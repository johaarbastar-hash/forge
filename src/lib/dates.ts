import { addDays, format, parse, startOfWeek } from 'date-fns';

import type { DayKey, Weekday } from '../types';

/**
 * The ONLY way to turn a Date into a day bucket. Local calendar date,
 * `yyyy-MM-dd` — never `toISOString()` (UTC would shift evenings across days).
 */
export function toDayKey(date: Date): DayKey {
  return format(date, 'yyyy-MM-dd');
}

/** Parse a DayKey back to a local Date at midnight. */
export function fromDayKey(dayKey: DayKey): Date {
  return parse(dayKey, 'yyyy-MM-dd', new Date());
}

export function todayKey(now: Date = new Date()): DayKey {
  return toDayKey(now);
}

export function addDaysToKey(dayKey: DayKey, days: number): DayKey {
  return toDayKey(addDays(fromDayKey(dayKey), days));
}

/** Monday of the week containing `dayKey` (week = Monday–Sunday). */
export function weekStartKey(dayKey: DayKey): DayKey {
  return toDayKey(startOfWeek(fromDayKey(dayKey), { weekStartsOn: 1 }));
}

/** The 7 day keys (Mon..Sun) of the week containing `dayKey`. */
export function weekKeys(dayKey: DayKey): DayKey[] {
  const start = weekStartKey(dayKey);
  return Array.from({ length: 7 }, (_, i) => addDaysToKey(start, i));
}

/** The `n` day keys ending at `endKey` inclusive, oldest first. */
export function lastNDayKeys(endKey: DayKey, n: number): DayKey[] {
  return Array.from({ length: n }, (_, i) => addDaysToKey(endKey, i - (n - 1)));
}

const WEEKDAYS: Weekday[] = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'];

/** Weekday of a DayKey ('mon'..'sun'). */
export function weekdayOf(dayKey: DayKey): Weekday {
  // JS getDay(): 0 = Sunday … 6 = Saturday → map to Monday-first.
  const jsDay = fromDayKey(dayKey).getDay();
  const index = (jsDay + 6) % 7;
  const day = WEEKDAYS[index];
  if (!day) throw new Error(`Invalid weekday index ${index} for ${dayKey}`);
  return day;
}

export function isSameOrBefore(a: DayKey, b: DayKey): boolean {
  return a <= b; // yyyy-MM-dd sorts lexicographically
}
