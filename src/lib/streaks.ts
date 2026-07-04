import type { DayKey } from '../types';
import { addDaysToKey } from './dates';

/**
 * Current streak of consecutive days ending today or yesterday.
 *
 * "Today not yet logged" does not break the streak (SPEC: streaks are derived;
 * a run ending yesterday is still alive until today ends) — but today, when
 * logged, extends it. Month/year boundaries are handled by real date math.
 */
export function currentStreak(loggedDays: ReadonlySet<DayKey>, today: DayKey): number {
  const anchor = loggedDays.has(today) ? today : addDaysToKey(today, -1);
  let streak = 0;
  let cursor = anchor;
  while (loggedDays.has(cursor)) {
    streak += 1;
    cursor = addDaysToKey(cursor, -1);
  }
  return streak;
}

/** Longest run of consecutive logged days anywhere in history. */
export function bestStreak(loggedDays: ReadonlySet<DayKey>): number {
  let best = 0;
  for (const day of loggedDays) {
    // only start counting at run starts to stay O(n)
    if (loggedDays.has(addDaysToKey(day, -1))) continue;
    let length = 1;
    let cursor = addDaysToKey(day, 1);
    while (loggedDays.has(cursor)) {
      length += 1;
      cursor = addDaysToKey(cursor, 1);
    }
    best = Math.max(best, length);
  }
  return best;
}
