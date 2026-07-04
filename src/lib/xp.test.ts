import { describe, expect, it } from 'vitest';

import { XP_VALUES, levelForXp, levelProgress, threshold, totalXp } from './xp';

describe('XP values (SPEC §5.11, pinned)', () => {
  it('matches the spec table exactly', () => {
    expect(XP_VALUES).toEqual({
      WORKOUT_COMPLETED: 50,
      PROTEIN_GOAL_HIT: 30,
      WATER_GOAL_HIT: 20,
      SLEEP_GOAL_HIT: 20,
      WEIGHT_LOGGED: 10,
      ALL_MISSIONS_DONE: 30,
      STREAK_DAY: 15,
    });
  });
});

describe('level curve threshold(n) = round(200·n^1.5/10)·10', () => {
  it('computes pinned thresholds', () => {
    expect(threshold(1)).toBe(200);
    expect(threshold(2)).toBe(570); // 565.685 → 56.57 → 57 → 570
    expect(threshold(3)).toBe(1040); // 1039.23
    expect(threshold(4)).toBe(1600);
    expect(threshold(5)).toBe(2240); // 2236.07
    expect(threshold(10)).toBe(6320); // 6324.55 → 632.46 → 632 → 6320
  });

  it('level 1 at 0 XP, boundaries inclusive', () => {
    expect(levelForXp(0)).toBe(1);
    expect(levelForXp(199)).toBe(1);
    expect(levelForXp(200)).toBe(1); // threshold(1) reached, still level 1
    expect(levelForXp(569)).toBe(1);
    expect(levelForXp(570)).toBe(2);
    expect(levelForXp(1039)).toBe(2);
    expect(levelForXp(1040)).toBe(3);
    expect(levelForXp(2240)).toBe(5);
  });

  it('levelProgress reports fraction toward next threshold', () => {
    const p = levelProgress(570);
    expect(p.level).toBe(2);
    expect(p.nextThreshold).toBe(1040);
    expect(p.fraction).toBe(0);
    const mid = levelProgress(805);
    expect(mid.fraction).toBeCloseTo((805 - 570) / (1040 - 570), 5);
  });

  it('totalXp sums event amounts', () => {
    expect(totalXp([{ amount: 50 }, { amount: 30 }, { amount: 15 }])).toBe(95);
    expect(totalXp([])).toBe(0);
  });
});
