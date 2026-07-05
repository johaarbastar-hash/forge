import { describe, expect, it } from 'vitest';

import type { AchievementState, MissionContext, WeeklyContext } from './gamification';
import {
  allMissionsDone,
  dailyMissionStatus,
  detectRealPr,
  satisfiedAchievements,
  weeklyChallengeStatus,
} from './gamification';
import type { Workout } from '../types';

const baseState: AchievementState = {
  hasCompletedWorkout: false,
  bestAnyLogStreak: 0,
  hasLegDay: false,
  hasChestDay: false,
  maxWaterDayMl: 0,
  hasProteinGoalHit: false,
  maxWeightKg: 0,
  startWeightKg: 60,
  hasRealPr: false,
  mealCount: 0,
  level: 1,
  hasEarlyBird: false,
};

describe('satisfiedAchievements', () => {
  it('none satisfied for a blank slate', () => {
    expect(satisfiedAchievements(baseState)).toEqual([]);
  });

  it('fires each achievement at its threshold', () => {
    const s: AchievementState = {
      hasCompletedWorkout: true,
      bestAnyLogStreak: 30,
      hasLegDay: true,
      hasChestDay: true,
      maxWaterDayMl: 3000,
      hasProteinGoalHit: true,
      maxWeightKg: 61,
      startWeightKg: 60,
      hasRealPr: true,
      mealCount: 50,
      level: 5,
      hasEarlyBird: true,
    };
    expect(satisfiedAchievements(s).sort()).toEqual(
      [
        'first_workout',
        'streak_7',
        'streak_30',
        'first_leg_day',
        'first_chest_day',
        'water_3l',
        'first_protein_goal',
        'gain_1kg',
        'first_pr',
        'meals_50',
        'level_5',
        'early_bird',
      ].sort(),
    );
  });

  it('respects boundaries', () => {
    expect(satisfiedAchievements({ ...baseState, bestAnyLogStreak: 6 })).not.toContain('streak_7');
    expect(satisfiedAchievements({ ...baseState, bestAnyLogStreak: 7 })).toContain('streak_7');
    expect(satisfiedAchievements({ ...baseState, maxWaterDayMl: 2999 })).not.toContain('water_3l');
    expect(satisfiedAchievements({ ...baseState, maxWeightKg: 60.9 })).not.toContain('gain_1kg');
    expect(satisfiedAchievements({ ...baseState, maxWeightKg: 61 })).toContain('gain_1kg');
  });
});

const workout = (id: string, dayKey: string, sets: { reps: number; weightKg: number }[]): Workout => ({
  id,
  dayKey,
  splitDay: 'Push',
  entries: [{ exerciseId: 'ex-bench-press', sets }],
  durationMin: 45,
  notes: '',
  completed: true,
  createdAt: `${dayKey}T10:00:00Z`,
  updatedAt: `${dayKey}T11:00:00Z`,
});

describe('detectRealPr', () => {
  it('is false for a single session (no prior best to beat)', () => {
    expect(detectRealPr([workout('w1', '2026-06-01', [{ reps: 8, weightKg: 100 }])])).toBe(false);
  });

  it('is true when a later session beats an earlier one', () => {
    expect(
      detectRealPr([
        workout('w1', '2026-06-01', [{ reps: 8, weightKg: 100 }]),
        workout('w2', '2026-06-08', [{ reps: 8, weightKg: 105 }]),
      ]),
    ).toBe(true);
  });

  it('is false when later sessions never improve', () => {
    expect(
      detectRealPr([
        workout('w1', '2026-06-01', [{ reps: 8, weightKg: 100 }]),
        workout('w2', '2026-06-08', [{ reps: 5, weightKg: 90 }]),
      ]),
    ).toBe(false);
  });
});

describe('daily missions', () => {
  const ctx: MissionContext = {
    waterHit: true,
    proteinHit: true,
    sleepHit: true,
    workoutDone: false,
    isRestDay: true,
  };

  it('workout mission is not applicable on rest days', () => {
    const statuses = dailyMissionStatus(ctx);
    expect(statuses.find((m) => m.id === 'workout')?.applicable).toBe(false);
    // all applicable done → complete even though the workout is undone
    expect(allMissionsDone(ctx)).toBe(true);
  });

  it('a training day needs the workout done too', () => {
    const training: MissionContext = { ...ctx, isRestDay: false };
    expect(allMissionsDone(training)).toBe(false);
    expect(allMissionsDone({ ...training, workoutDone: true })).toBe(true);
  });
});

describe('weekly challenges', () => {
  it('reports progress and completion', () => {
    const ctx: WeeklyContext = {
      workoutsThisWeek: 4,
      workoutsTarget: 6,
      proteinHitDays: 5,
      trackedDays: 5,
      weightLogsThisWeek: 3,
    };
    const s = weeklyChallengeStatus(ctx);
    expect(s.find((c) => c.id === 'train_n_days')).toMatchObject({ current: 4, target: 6, done: false });
    expect(s.find((c) => c.id === 'protein_every_tracked_day')?.done).toBe(true);
    expect(s.find((c) => c.id === 'log_weight_3x')?.done).toBe(true);
  });

  it('protein challenge needs at least one tracked day', () => {
    const s = weeklyChallengeStatus({
      workoutsThisWeek: 0,
      workoutsTarget: 3,
      proteinHitDays: 0,
      trackedDays: 0,
      weightLogsThisWeek: 0,
    });
    expect(s.find((c) => c.id === 'protein_every_tracked_day')?.done).toBe(false);
  });
});
