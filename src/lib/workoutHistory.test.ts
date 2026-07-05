import { describe, expect, it } from 'vitest';

import type { Workout } from '../types';
import { isPr } from './e1rm';
import { historyByExercise, setsVolume } from './workoutHistory';

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

describe('historyByExercise', () => {
  it('aggregates best weight, best e1RM and newest-session sets', () => {
    const history = historyByExercise([
      workout('w1', '2026-06-01', [{ reps: 8, weightKg: 100 }]),
      workout('w2', '2026-06-08', [{ reps: 3, weightKg: 115 }]),
      workout('w3', '2026-06-15', [{ reps: 10, weightKg: 90 }]),
    ]);
    const bench = history.get('ex-bench-press');
    expect(bench?.bestWeightKg).toBe(115);
    expect(bench?.bestE1rm).toBeCloseTo(126.6667, 3); // 100×(1+8/30)
    expect(bench?.lastSets).toEqual([{ reps: 10, weightKg: 90 }]); // most recent session
  });

  it('drives PR detection against prior bests', () => {
    const prior = historyByExercise([workout('w1', '2026-06-01', [{ reps: 8, weightKg: 100 }])]);
    const bench = prior.get('ex-bench-press');
    expect(bench).toBeDefined();
    if (!bench) return;
    // heavier top set → weight PR
    expect(isPr([{ reps: 1, weightKg: 120 }], bench).pr).toBe(true);
    // same weight, more reps than the 8×100 baseline → e1RM PR
    expect(isPr([{ reps: 12, weightKg: 100 }], bench).byE1rm).toBe(true);
    // weaker session → no PR
    expect(isPr([{ reps: 5, weightKg: 90 }], bench).pr).toBe(false);
  });

  it('ignores empty entries and unseen exercises', () => {
    const history = historyByExercise([workout('w1', '2026-06-01', [])]);
    expect(history.get('ex-bench-press')).toBeUndefined();
  });
});

describe('setsVolume', () => {
  it('sums reps × weight', () => {
    expect(setsVolume([{ reps: 8, weightKg: 100 }, { reps: 5, weightKg: 120 }])).toBe(1400);
    expect(setsVolume([])).toBe(0);
  });
});
