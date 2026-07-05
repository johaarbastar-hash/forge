import { getGoalsForDay } from './goalsRepo';
import { mealsByDay } from './mealsRepo';
import { awardXp } from './xpRepo';
import type { DayKey } from '../../types';

/**
 * Award PROTEIN_GOAL_HIT if the day's logged protein reaches the goal active
 * that day (SPEC §5.9). Idempotent via the xpEvents unique index, so it's safe
 * to call after every meal write. Never revokes: XP stays once earned.
 * Returns true when XP was newly awarded.
 */
export async function evaluateProteinGoal(dayKey: DayKey): Promise<boolean> {
  const goals = await getGoalsForDay(dayKey);
  if (!goals || goals.proteinG <= 0) return false;
  const meals = await mealsByDay(dayKey);
  const protein = meals.reduce((sum, m) => sum + m.cachedMacros.proteinG, 0);
  if (protein + 1e-6 >= goals.proteinG) {
    return awardXp(dayKey, 'PROTEIN_GOAL_HIT');
  }
  return false;
}
