import type { Workout, WorkoutSet } from '../types';
import { bestE1rm, bestWeight } from './e1rm';

export type ExerciseBest = {
  bestWeightKg: number;
  bestE1rm: number;
  /** Sets from the most recent session containing the exercise (for prefill). */
  lastSets: WorkoutSet[];
};

/**
 * Aggregate completed workouts into per-exercise bests + last-session sets.
 * Pass only prior sessions (exclude the in-progress one) to get the baseline a
 * new set must beat for a PR. Order-independent for bests; lastSets follows the
 * newest dayKey.
 */
export function historyByExercise(completed: Workout[]): Map<string, ExerciseBest> {
  const sorted = [...completed].sort((a, b) => a.dayKey.localeCompare(b.dayKey));
  const map = new Map<string, ExerciseBest>();
  for (const workout of sorted) {
    for (const entry of workout.entries) {
      if (entry.sets.length === 0) continue;
      const prev = map.get(entry.exerciseId) ?? { bestWeightKg: 0, bestE1rm: 0, lastSets: [] };
      map.set(entry.exerciseId, {
        bestWeightKg: Math.max(prev.bestWeightKg, bestWeight(entry.sets)),
        bestE1rm: Math.max(prev.bestE1rm, bestE1rm(entry.sets)),
        lastSets: entry.sets, // ascending iteration → newest session wins
      });
    }
  }
  return map;
}

/** Total training volume (Σ reps × weight) for a set list. */
export function setsVolume(sets: WorkoutSet[]): number {
  return sets.reduce((sum, s) => sum + s.reps * s.weightKg, 0);
}
