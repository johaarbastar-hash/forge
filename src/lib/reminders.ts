import type { DayKey } from '../types';

/** Minutes since local midnight for an `HH:mm` string. */
export function timeToMinutes(time: string): number {
  const [h, m] = time.split(':').map(Number);
  return (h ?? 0) * 60 + (m ?? 0);
}

/**
 * A once-per-day time reminder is due when the current time has reached its
 * target and it hasn't already fired today.
 */
export function isTimeReminderDue(
  time: string,
  lastFiredDayKey: string | null,
  nowMinutes: number,
  today: DayKey,
): boolean {
  return nowMinutes >= timeToMinutes(time) && lastFiredDayKey !== today;
}

/** A repeating-interval reminder (water) is due once the interval has elapsed. */
export function isIntervalReminderDue(intervalMin: number, lastFiredMs: number, nowMs: number): boolean {
  return intervalMin > 0 && nowMs - lastFiredMs >= intervalMin * 60_000;
}

/** A weekly reminder is due at/after its time and at least 7 days since it last fired. */
export function isWeeklyReminderDue(
  time: string,
  lastFiredMs: number,
  nowMinutes: number,
  nowMs: number,
): boolean {
  return nowMinutes >= timeToMinutes(time) && nowMs - lastFiredMs >= 7 * 86_400_000;
}
