import { getSplitTemplate } from '../../data/splits';
import { addDaysToKey, weekdayOf } from '../../lib/dates';
import {
  type AchievementState,
  type MissionContext,
  CHEST_EXERCISE_IDS,
  allMissionsDone,
  detectRealPr,
  satisfiedAchievements,
} from '../../lib/gamification';
import { bestStreak } from '../../lib/streaks';
import { levelForXp } from '../../lib/xp';
import type { AchievementId, DayKey } from '../../types';
import { db } from '../db';
import { unlockAchievement } from './achievementsRepo';
import { getGoalsForDay } from './goalsRepo';
import { getProfile } from './profileRepo';
import { awardXp } from './xpRepo';

/** Every day that has at least one log of any kind. */
export async function collectAnyLogDays(): Promise<Set<DayKey>> {
  const days = new Set<DayKey>();
  const add = (rows: { dayKey: DayKey }[]) => rows.forEach((r) => days.add(r.dayKey));
  const [meals, water, sleep, weight, workouts, habitLogs] = await Promise.all([
    db.meals.toArray(),
    db.waterLogs.toArray(),
    db.sleepLogs.toArray(),
    db.weightLogs.toArray(),
    db.workouts.toArray(),
    db.habitLogs.toArray(),
  ]);
  add(meals);
  add(water);
  add(sleep);
  add(weight);
  add(workouts);
  habitLogs.forEach((h) => h.done && days.add(h.dayKey));
  return days;
}

function finishedBefore8(createdAtIso: string, durationMin: number): boolean {
  const start = new Date(createdAtIso).getTime();
  const finish = new Date(start + durationMin * 60_000);
  return finish.getHours() < 8;
}

export async function collectAchievementState(): Promise<AchievementState> {
  const [profile, workouts, exercises, water, weightLogs, xpEvents, mealCount, anyLogDays] =
    await Promise.all([
      getProfile(),
      db.workouts.toArray(),
      db.exercises.toArray(),
      db.waterLogs.toArray(),
      db.weightLogs.toArray(),
      db.xpEvents.toArray(),
      db.meals.count(),
      collectAnyLogDays(),
    ]);

  const completed = workouts.filter((w) => w.completed);
  const groupById = new Map(exercises.map((e) => [e.id, e.muscleGroup]));

  const hasLegDay = completed.some((w) =>
    w.entries.some((e) => groupById.get(e.exerciseId) === 'legs'),
  );
  const hasChestDay = completed.some((w) =>
    w.entries.some((e) => CHEST_EXERCISE_IDS.includes(e.exerciseId)),
  );

  const waterByDay = new Map<DayKey, number>();
  for (const log of water) waterByDay.set(log.dayKey, (waterByDay.get(log.dayKey) ?? 0) + log.ml);

  return {
    hasCompletedWorkout: completed.length > 0,
    bestAnyLogStreak: bestStreak(anyLogDays),
    hasLegDay,
    hasChestDay,
    maxWaterDayMl: Math.max(0, ...waterByDay.values()),
    hasProteinGoalHit: xpEvents.some((e) => e.type === 'PROTEIN_GOAL_HIT'),
    maxWeightKg: weightLogs.reduce((m, w) => Math.max(m, w.kg), 0),
    startWeightKg: profile?.startWeightKg ?? 0,
    hasRealPr: detectRealPr(completed),
    mealCount,
    level: levelForXp(xpEvents.reduce((s, e) => s + e.amount, 0)),
    hasEarlyBird: completed.some((w) => finishedBefore8(w.createdAt, w.durationMin)),
  };
}

/**
 * Unlock any newly-satisfied achievements (idempotent) and return the ids that
 * were unlocked *this call*, so the UI can animate them exactly once.
 */
export async function evaluateAchievements(dayKey: DayKey): Promise<AchievementId[]> {
  const [state, unlocked] = await Promise.all([
    collectAchievementState(),
    db.achievementUnlocks.toArray(),
  ]);
  const already = new Set(unlocked.map((u) => u.achievementId));
  const newlySatisfied = satisfiedAchievements(state).filter((id) => !already.has(id));
  const fired: AchievementId[] = [];
  for (const id of newlySatisfied) {
    if (await unlockAchievement(id, dayKey)) fired.push(id);
  }
  return fired;
}

/** Mission completion context for a day, evaluated against that day's active goals. */
export async function missionContextFor(dayKey: DayKey): Promise<MissionContext> {
  const [goals, profile, meals, water, sleep, workout] = await Promise.all([
    getGoalsForDay(dayKey),
    getProfile(),
    db.meals.where('dayKey').equals(dayKey).toArray(),
    db.waterLogs.where('dayKey').equals(dayKey).toArray(),
    db.sleepLogs.where('dayKey').equals(dayKey).first(),
    db.workouts.where('dayKey').equals(dayKey).first(),
  ]);
  const proteinTotal = meals.reduce((s, m) => s + m.cachedMacros.proteinG, 0);
  const waterTotal = water.reduce((s, w) => s + w.ml, 0);
  const plan = profile ? getSplitTemplate(profile.splitId)?.schedule[weekdayOf(dayKey)] : undefined;
  const isRestDay = !plan || !('exerciseIds' in plan);
  return {
    waterHit: !!goals && goals.waterMl > 0 && waterTotal >= goals.waterMl,
    proteinHit: !!goals && goals.proteinG > 0 && proteinTotal + 1e-6 >= goals.proteinG,
    sleepHit: !!goals && goals.sleepH > 0 && !!sleep && sleep.hours + 1e-6 >= goals.sleepH,
    workoutDone: !!workout?.completed,
    isRestDay,
  };
}

/**
 * Award the day-level XP events: STREAK_DAY (a day with any log whose previous
 * day also had a log) and ALL_MISSIONS_DONE (every applicable mission done).
 * Idempotent. `anyLogDays` may be passed to avoid a rescan (demo generation).
 */
export async function evaluateDay(
  dayKey: DayKey,
  anyLogDays?: Set<DayKey>,
): Promise<{ streakAwarded: boolean; allMissionsAwarded: boolean }> {
  const days = anyLogDays ?? (await collectAnyLogDays());
  let streakAwarded = false;
  if (days.has(dayKey) && days.has(addDaysToKey(dayKey, -1))) {
    streakAwarded = await awardXp(dayKey, 'STREAK_DAY');
  }
  const ctx = await missionContextFor(dayKey);
  let allMissionsAwarded = false;
  if (allMissionsDone(ctx)) {
    allMissionsAwarded = await awardXp(dayKey, 'ALL_MISSIONS_DONE');
  }
  return { streakAwarded, allMissionsAwarded };
}
