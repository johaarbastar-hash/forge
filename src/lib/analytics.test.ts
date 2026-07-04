import { describe, expect, it } from 'vitest';

import {
  consistencyScore,
  healthScore,
  hydrationScore,
  nutritionScore,
  recoveryScore,
  rollingAverage,
  trackedAverage,
  weightGainRatePerWeek,
} from './analytics';

describe('analytics scores (SPEC §5.10, formulas pinned)', () => {
  it('nutrition: 50·(protein days/tracked) + 50·(kcal-within-10% days/tracked)', () => {
    const days = [
      { proteinG: 120, kcal: 3000, proteinGoal: 110, kcalGoal: 3000 }, // both hit
      { proteinG: 90, kcal: 3200, proteinGoal: 110, kcalGoal: 3000 }, // kcal within 10% only (diff 200 ≤ 300)
      { proteinG: 115, kcal: 3400, proteinGoal: 110, kcalGoal: 3000 }, // protein only (diff 400 > 300)
      { proteinG: null, kcal: null, proteinGoal: 110, kcalGoal: 3000 }, // untracked — excluded
    ];
    // tracked = 3; protein days = 2; kcal days = 2 → 50·(2/3) + 50·(2/3) = 66.67
    expect(nutritionScore(days)).toBeCloseTo(66.6667, 3);
  });

  it('nutrition: zero-log days never count as failures', () => {
    const days = [
      { proteinG: 120, kcal: 3000, proteinGoal: 110, kcalGoal: 3000 },
      { proteinG: null, kcal: null, proteinGoal: 110, kcalGoal: 3000 },
      { proteinG: null, kcal: null, proteinGoal: 110, kcalGoal: 3000 },
    ];
    expect(nutritionScore(days)).toBe(100);
    expect(nutritionScore([])).toBe(0);
  });

  it('consistency: 100·min(1, done/planned)', () => {
    expect(consistencyScore(3, 6)).toBe(50);
    expect(consistencyScore(7, 6)).toBe(100); // capped
    expect(consistencyScore(0, 6)).toBe(0);
    expect(consistencyScore(0, 0)).toBe(100); // nothing planned, nothing missed
  });

  it('recovery: 70·min(1, avg/goal) + 30·(rest day ? 1 : 0.5)', () => {
    expect(recoveryScore(8, 8, true)).toBe(100);
    expect(recoveryScore(7, 8, true)).toBeCloseTo(70 * (7 / 8) + 30, 5);
    expect(recoveryScore(8, 8, false)).toBe(85);
    expect(recoveryScore(null, 8, true)).toBe(30); // no sleep data → sleep part 0
  });

  it('hydration: 100·min(1, avg/goal)', () => {
    expect(hydrationScore(2500, 3000)).toBeCloseTo(83.3333, 3);
    expect(hydrationScore(3500, 3000)).toBe(100);
    expect(hydrationScore(null, 3000)).toBe(0);
  });

  it('health: 0.3·N + 0.3·C + 0.2·R + 0.2·H', () => {
    expect(healthScore(100, 100, 100, 100)).toBe(100);
    expect(healthScore(80, 50, 100, 60)).toBeCloseTo(0.3 * 80 + 0.3 * 50 + 0.2 * 100 + 0.2 * 60, 5);
  });
});

describe('averages and weight-gain rate', () => {
  it('trackedAverage ignores unlogged days', () => {
    expect(trackedAverage([2000, null, 3000, undefined])).toBe(2500);
    expect(trackedAverage([null, null])).toBeNull();
  });

  it('rollingAverage trails over the window, skipping nulls', () => {
    expect(rollingAverage([1, 2, 3, 4], 2)).toEqual([1, 1.5, 2.5, 3.5]);
    expect(rollingAverage([1, null, 3], 2)).toEqual([1, 1, 3]);
  });

  it('weightGainRate: steady +0.05 kg/day = +0.35 kg/week', () => {
    const daily = Array.from({ length: 21 }, (_, i) => 70 + 0.05 * i);
    expect(weightGainRatePerWeek(daily)).toBeCloseTo(0.35, 5);
  });

  it('weightGainRate needs at least two full-window points', () => {
    expect(weightGainRatePerWeek([70])).toBeNull();
    expect(weightGainRatePerWeek([null, null])).toBeNull();
    expect(weightGainRatePerWeek(Array.from({ length: 7 }, () => 70))).toBeNull(); // one full window only
  });
});
