import type { WorkoutSet } from '../types';

/** Epley estimated 1-rep max: `weight × (1 + reps/30)` (SPEC §5.5, pinned). */
export function e1rm(weightKg: number, reps: number): number {
  if (weightKg <= 0 || reps <= 0) return 0;
  return weightKg * (1 + reps / 30);
}

export function bestE1rm(sets: WorkoutSet[]): number {
  return sets.reduce((best, s) => Math.max(best, e1rm(s.weightKg, s.reps)), 0);
}

export function bestWeight(sets: WorkoutSet[]): number {
  return sets.reduce((best, s) => (s.reps > 0 ? Math.max(best, s.weightKg) : best), 0);
}

/**
 * PR detection (SPEC §5.5): a PR fires when best weight OR best e1RM improves
 * on everything before it.
 */
export function isPr(
  newSets: WorkoutSet[],
  previous: { bestWeightKg: number; bestE1rm: number },
): { pr: boolean; byWeight: boolean; byE1rm: boolean } {
  const byWeight = bestWeight(newSets) > previous.bestWeightKg;
  const byE1rm = bestE1rm(newSets) > previous.bestE1rm;
  return { pr: byWeight || byE1rm, byWeight, byE1rm };
}
