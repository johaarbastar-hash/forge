import { getGoalsForDay } from './goalsRepo';
import { mealsByDay } from './mealsRepo';
import { sleepByDay } from './sleepRepo';
import { waterTotalForDay } from './waterRepo';
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

/** Award WATER_GOAL_HIT when the day's water reaches the goal active that day. Idempotent. */
export async function evaluateWaterGoal(dayKey: DayKey): Promise<boolean> {
  const goals = await getGoalsForDay(dayKey);
  if (!goals || goals.waterMl <= 0) return false;
  const total = await waterTotalForDay(dayKey);
  if (total >= goals.waterMl) return awardXp(dayKey, 'WATER_GOAL_HIT');
  return false;
}

/** Award SLEEP_GOAL_HIT when logged sleep reaches the goal active that day. Idempotent. */
export async function evaluateSleepGoal(dayKey: DayKey): Promise<boolean> {
  const goals = await getGoalsForDay(dayKey);
  if (!goals || goals.sleepH <= 0) return false;
  const sleep = await sleepByDay(dayKey);
  if (sleep && sleep.hours + 1e-6 >= goals.sleepH) return awardXp(dayKey, 'SLEEP_GOAL_HIT');
  return false;
}

/** Award WEIGHT_LOGGED for any day a weigh-in exists. Idempotent (once per day). */
export async function awardWeightLogged(dayKey: DayKey): Promise<boolean> {
  return awardXp(dayKey, 'WEIGHT_LOGGED');
}
