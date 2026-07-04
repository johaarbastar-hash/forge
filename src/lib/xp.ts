import type { XpEvent, XpEventType } from '../types';

// SPEC §5.11 XP table — pinned values, do not change.
export const XP_VALUES: Record<XpEventType, number> = {
  WORKOUT_COMPLETED: 50,
  PROTEIN_GOAL_HIT: 30,
  WATER_GOAL_HIT: 20,
  SLEEP_GOAL_HIT: 20,
  WEIGHT_LOGGED: 10,
  ALL_MISSIONS_DONE: 30,
  STREAK_DAY: 15,
};

/**
 * Cumulative XP needed to reach level `n`:
 * `threshold(n) = round(200 × n^1.5 / 10) × 10`. Level 1 is the floor (0 XP).
 */
export function threshold(n: number): number {
  return Math.round((200 * Math.pow(n, 1.5)) / 10) * 10;
}

export function totalXp(events: Pick<XpEvent, 'amount'>[]): number {
  return events.reduce((sum, e) => sum + e.amount, 0);
}

/** Level = largest n with cumulative XP ≥ threshold(n); never below 1. */
export function levelForXp(xp: number): number {
  let level = 1;
  let n = 1;
  while (threshold(n) <= xp) {
    level = n;
    n += 1;
  }
  return level;
}

/** Progress data for the XP card: current level, next threshold, 0–1 fraction. */
export function levelProgress(xp: number): {
  level: number;
  nextThreshold: number;
  prevThreshold: number;
  fraction: number;
} {
  const level = levelForXp(xp);
  // the XP where the current level began: threshold(level), except level 1 (floor at 0)
  const prevThreshold = threshold(level) <= xp ? threshold(level) : 0;
  const nextThreshold = threshold(level + 1);
  const span = nextThreshold - prevThreshold;
  const fraction = span > 0 ? Math.min(1, Math.max(0, (xp - prevThreshold) / span)) : 0;
  return { level, nextThreshold, prevThreshold, fraction };
}
