import { db, newId, nowIso } from '../db';
import { goalsOn } from '../../lib/goalHistory';
import type { DayKey, GoalField, GoalHistoryEntry, Goals } from '../../types';

const GOALS_ID = 'goals';

export async function getGoals(): Promise<Goals | undefined> {
  return db.goals.get(GOALS_ID);
}

export async function getGoalHistory(): Promise<GoalHistoryEntry[]> {
  return db.goalHistory.toArray();
}

/**
 * Upsert current goals; every changed field appends a goalHistory entry
 * effective from `effectiveFromDayKey` (SPEC §5.9 — future days only).
 */
export async function saveGoals(
  values: Partial<Pick<Goals, GoalField>>,
  effectiveFromDayKey: DayKey,
): Promise<Goals> {
  return db.transaction('rw', [db.goals, db.goalHistory], async () => {
    const existing = await db.goals.get(GOALS_ID);
    const changed = (Object.entries(values) as [GoalField, number][]).filter(
      ([field, value]) => value !== undefined && (!existing || existing[field] !== value),
    );

    const historyRows: GoalHistoryEntry[] = changed.map(([field, value]) => ({
      id: newId(),
      field,
      value,
      effectiveFromDayKey,
      createdAt: nowIso(),
      updatedAt: nowIso(),
    }));
    if (historyRows.length) await db.goalHistory.bulkAdd(historyRows);

    if (existing) {
      const updated: Goals = { ...existing, ...values, updatedAt: nowIso() };
      await db.goals.put(updated);
      return updated;
    }
    const created: Goals = {
      id: GOALS_ID,
      weightKg: 0,
      calories: 0,
      proteinG: 0,
      waterMl: 0,
      sleepH: 0,
      workoutsPerWeek: 0,
      ...values,
      createdAt: nowIso(),
      updatedAt: nowIso(),
    } as Goals;
    await db.goals.add(created);
    return created;
  });
}

/** Goals active on a given day, resolved from the append-only history. */
export async function getGoalsForDay(dayKey: DayKey): Promise<Pick<Goals, GoalField> | undefined> {
  const current = await getGoals();
  if (!current) return undefined;
  const history = await getGoalHistory();
  const { id: _id, createdAt: _c, updatedAt: _u, ...fallback } = current;
  return goalsOn(history, dayKey, fallback);
}
