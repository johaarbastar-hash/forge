import { describe, expect, it } from 'vitest';

import { bestE1rm, bestWeight, e1rm, isPr } from './e1rm';

describe('e1RM (Epley, SPEC §5.5 pinned)', () => {
  it('weight × (1 + reps/30)', () => {
    expect(e1rm(100, 8)).toBeCloseTo(126.6667, 3);
    expect(e1rm(60, 10)).toBeCloseTo(80, 5);
    expect(e1rm(80, 1)).toBeCloseTo(82.6667, 3);
  });

  it('zero/invalid input → 0', () => {
    expect(e1rm(0, 5)).toBe(0);
    expect(e1rm(100, 0)).toBe(0);
  });

  it('bestE1rm and bestWeight scan all sets', () => {
    const sets = [
      { reps: 8, weightKg: 100 }, // e1rm 126.67
      { reps: 3, weightKg: 115 }, // e1rm 126.5
      { reps: 12, weightKg: 85 }, // e1rm 119
    ];
    expect(bestWeight(sets)).toBe(115);
    expect(bestE1rm(sets)).toBeCloseTo(126.6667, 3);
  });

  it('PR fires when best weight OR best e1RM improves', () => {
    const previous = { bestWeightKg: 115, bestE1rm: 126.67 };
    // heavier top set, worse e1rm
    expect(isPr([{ reps: 1, weightKg: 120 }], previous)).toEqual({
      pr: true,
      byWeight: true,
      byE1rm: false,
    });
    // same weight, more reps → e1rm PR
    expect(isPr([{ reps: 6, weightKg: 115 }], previous).byE1rm).toBe(true);
    // no improvement
    expect(isPr([{ reps: 5, weightKg: 100 }], previous).pr).toBe(false);
  });
});
