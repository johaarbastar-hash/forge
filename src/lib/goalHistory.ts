import type { DayKey, GoalField, Goals, GoalHistoryEntry } from '../types';

/**
 * SPEC §5.9 — goal edits affect future days only. Each day is evaluated
 * against the latest history entry whose effectiveFromDayKey ≤ that day.
 */
export function goalValueOn(
  history: Pick<GoalHistoryEntry, 'field' | 'value' | 'effectiveFromDayKey' | 'createdAt'>[],
  field: GoalField,
  dayKey: DayKey,
): number | undefined {
  const candidates = history.filter(
    (h) => h.field === field && h.effectiveFromDayKey <= dayKey,
  );
  if (candidates.length === 0) return undefined;
  // latest effective date wins; same-day edits resolved by createdAt (last write wins)
  candidates.sort((a, b) =>
    a.effectiveFromDayKey === b.effectiveFromDayKey
      ? a.createdAt.localeCompare(b.createdAt)
      : a.effectiveFromDayKey.localeCompare(b.effectiveFromDayKey),
  );
  return candidates[candidates.length - 1]?.value;
}

const GOAL_FIELDS: GoalField[] = [
  'weightKg',
  'calories',
  'proteinG',
  'waterMl',
  'sleepH',
  'workoutsPerWeek',
];

/**
 * The full goal set active on `dayKey`. Fields with no entry effective yet
 * fall back to `fallback` (current goals) so pre-history days stay evaluable.
 */
export function goalsOn(
  history: Pick<GoalHistoryEntry, 'field' | 'value' | 'effectiveFromDayKey' | 'createdAt'>[],
  dayKey: DayKey,
  fallback: Pick<Goals, GoalField>,
): Pick<Goals, GoalField> {
  const result = { ...fallback };
  for (const field of GOAL_FIELDS) {
    const value = goalValueOn(history, field, dayKey);
    if (value !== undefined) result[field] = value;
  }
  return result;
}
