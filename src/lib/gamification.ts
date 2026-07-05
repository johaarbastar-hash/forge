import type { AchievementId, Workout } from '../types';
import { bestE1rm, bestWeight } from './e1rm';

// ---- Achievements (SPEC §5.11) ----

export type AchievementState = {
  hasCompletedWorkout: boolean;
  bestAnyLogStreak: number;
  hasLegDay: boolean;
  hasChestDay: boolean;
  maxWaterDayMl: number;
  hasProteinGoalHit: boolean;
  maxWeightKg: number;
  startWeightKg: number;
  hasRealPr: boolean;
  mealCount: number;
  level: number;
  hasEarlyBird: boolean;
};

/** Which of the 12 achievements are currently satisfied by the given state. */
export function satisfiedAchievements(s: AchievementState): AchievementId[] {
  const out: AchievementId[] = [];
  if (s.hasCompletedWorkout) out.push('first_workout');
  if (s.bestAnyLogStreak >= 7) out.push('streak_7');
  if (s.bestAnyLogStreak >= 30) out.push('streak_30');
  if (s.hasLegDay) out.push('first_leg_day');
  if (s.hasChestDay) out.push('first_chest_day');
  if (s.maxWaterDayMl >= 3000) out.push('water_3l');
  if (s.hasProteinGoalHit) out.push('first_protein_goal');
  if (s.startWeightKg > 0 && s.maxWeightKg >= s.startWeightKg + 1.0) out.push('gain_1kg');
  if (s.hasRealPr) out.push('first_pr');
  if (s.mealCount >= 50) out.push('meals_50');
  if (s.level >= 5) out.push('level_5');
  if (s.hasEarlyBird) out.push('early_bird');
  return out;
}

/** Exercise ids counted as a "chest day" (SPEC §5.11: bench / incline / fly). */
export const CHEST_EXERCISE_IDS = ['ex-bench-press', 'ex-incline-db-press', 'ex-cable-fly'];

/**
 * A "real" PR: some exercise had a later completed session beat the running
 * best of its earlier sessions (a genuine improvement, not just the first log).
 */
export function detectRealPr(completedWorkouts: Workout[]): boolean {
  const byExercise = new Map<string, Workout[]>();
  for (const w of completedWorkouts) {
    for (const entry of w.entries) {
      if (entry.sets.length === 0) continue;
      const list = byExercise.get(entry.exerciseId) ?? [];
      list.push(w);
      byExercise.set(entry.exerciseId, list);
    }
  }
  for (const [exerciseId, workouts] of byExercise) {
    const sorted = [...workouts].sort((a, b) => a.dayKey.localeCompare(b.dayKey));
    let runWeight = 0;
    let runE1rm = 0;
    let first = true;
    for (const w of sorted) {
      const sets = w.entries.filter((e) => e.exerciseId === exerciseId).flatMap((e) => e.sets);
      const bw = bestWeight(sets);
      const be = bestE1rm(sets);
      if (!first && (bw > runWeight + 1e-9 || be > runE1rm + 1e-9)) return true;
      runWeight = Math.max(runWeight, bw);
      runE1rm = Math.max(runE1rm, be);
      first = false;
    }
  }
  return false;
}

// ---- Daily missions (SPEC §5.11) ----

export type MissionContext = {
  waterHit: boolean;
  proteinHit: boolean;
  sleepHit: boolean;
  workoutDone: boolean;
  isRestDay: boolean;
};

export type MissionStatus = {
  id: 'water_goal' | 'protein_goal' | 'workout' | 'sleep_goal';
  title: string;
  done: boolean;
  applicable: boolean;
};

export function dailyMissionStatus(ctx: MissionContext): MissionStatus[] {
  return [
    { id: 'water_goal', title: 'Drink your water goal', done: ctx.waterHit, applicable: true },
    { id: 'protein_goal', title: 'Hit your protein goal', done: ctx.proteinHit, applicable: true },
    { id: 'workout', title: 'Finish the scheduled workout', done: ctx.workoutDone, applicable: !ctx.isRestDay },
    { id: 'sleep_goal', title: 'Sleep your goal or more', done: ctx.sleepHit, applicable: true },
  ];
}

/** All *applicable* daily missions complete (drives ALL_MISSIONS_DONE). */
export function allMissionsDone(ctx: MissionContext): boolean {
  return dailyMissionStatus(ctx)
    .filter((m) => m.applicable)
    .every((m) => m.done);
}

// ---- Weekly challenges (Mon–Sun, SPEC §5.11) ----

export type WeeklyContext = {
  workoutsThisWeek: number;
  workoutsTarget: number;
  proteinHitDays: number;
  trackedDays: number;
  weightLogsThisWeek: number;
};

export type ChallengeStatus = {
  id: 'train_n_days' | 'protein_every_tracked_day' | 'log_weight_3x';
  title: string;
  current: number;
  target: number;
  done: boolean;
};

export function weeklyChallengeStatus(ctx: WeeklyContext): ChallengeStatus[] {
  return [
    {
      id: 'train_n_days',
      title: `Train ${ctx.workoutsTarget} days this week`,
      current: ctx.workoutsThisWeek,
      target: ctx.workoutsTarget,
      done: ctx.workoutsThisWeek >= ctx.workoutsTarget,
    },
    {
      id: 'protein_every_tracked_day',
      title: 'Hit protein on every tracked day',
      current: ctx.proteinHitDays,
      target: ctx.trackedDays,
      done: ctx.trackedDays > 0 && ctx.proteinHitDays >= ctx.trackedDays,
    },
    {
      id: 'log_weight_3x',
      title: 'Log your weight 3 times',
      current: ctx.weightLogsThisWeek,
      target: 3,
      done: ctx.weightLogsThisWeek >= 3,
    },
  ];
}
