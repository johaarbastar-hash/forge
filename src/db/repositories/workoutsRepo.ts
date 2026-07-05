import { db, newId, nowIso } from '../db';
import { bestE1rm, bestWeight } from '../../lib/e1rm';
import type { DayKey, Workout, WorkoutEntry, WorkoutSet } from '../../types';

export async function workoutByDay(dayKey: DayKey): Promise<Workout | undefined> {
  return db.workouts.where('dayKey').equals(dayKey).first();
}

export async function allWorkouts(): Promise<Workout[]> {
  return db.workouts.orderBy('dayKey').toArray();
}

export async function createWorkout(data: {
  dayKey: DayKey;
  splitDay: string;
  entries: WorkoutEntry[];
}): Promise<Workout> {
  const workout: Workout = {
    id: newId(),
    ...data,
    durationMin: 0,
    notes: '',
    completed: false,
    createdAt: nowIso(),
    updatedAt: nowIso(),
  };
  await db.workouts.add(workout);
  return workout;
}

export async function updateWorkout(
  id: string,
  data: Partial<Pick<Workout, 'entries' | 'notes' | 'durationMin' | 'completed' | 'splitDay'>>,
): Promise<void> {
  await db.workouts.update(id, { ...data, updatedAt: nowIso() });
}

export async function deleteWorkout(id: string): Promise<void> {
  await db.workouts.delete(id);
}

export type ExerciseSession = {
  workoutId: string;
  dayKey: DayKey;
  sets: WorkoutSet[];
  bestWeightKg: number;
  bestE1rm: number;
};

/**
 * Completed sessions containing an exercise, oldest→newest. `excludeWorkoutId`
 * drops the in-progress session so PR comparisons look only at prior history.
 */
export async function exerciseHistory(
  exerciseId: string,
  excludeWorkoutId?: string,
): Promise<ExerciseSession[]> {
  const workouts = await db.workouts.orderBy('dayKey').toArray();
  return workouts
    .filter((w) => w.completed && w.id !== excludeWorkoutId)
    .map((w) => {
      const sets = w.entries.filter((e) => e.exerciseId === exerciseId).flatMap((e) => e.sets);
      return {
        workoutId: w.id,
        dayKey: w.dayKey,
        sets,
        bestWeightKg: bestWeight(sets),
        bestE1rm: bestE1rm(sets),
      };
    })
    .filter((h) => h.sets.length > 0);
}

/** Best weight and best e1RM for an exercise across prior completed sessions. */
export async function previousBests(
  exerciseId: string,
  excludeWorkoutId?: string,
): Promise<{ bestWeightKg: number; bestE1rm: number }> {
  const history = await exerciseHistory(exerciseId, excludeWorkoutId);
  return {
    bestWeightKg: history.reduce((m, h) => Math.max(m, h.bestWeightKg), 0),
    bestE1rm: history.reduce((m, h) => Math.max(m, h.bestE1rm), 0),
  };
}

/** Sets from the most recent prior session of an exercise, for "same as last session" prefill. */
export async function lastSessionSets(
  exerciseId: string,
  excludeWorkoutId?: string,
): Promise<WorkoutSet[] | undefined> {
  const history = await exerciseHistory(exerciseId, excludeWorkoutId);
  return history.at(-1)?.sets;
}

/** Build initial entries for a new session, prefilling each exercise from its last session. */
export async function startEntriesFor(exerciseIds: string[]): Promise<WorkoutEntry[]> {
  return Promise.all(
    exerciseIds.map(async (exerciseId) => {
      const last = await lastSessionSets(exerciseId);
      return {
        exerciseId,
        sets: last && last.length > 0 ? last.map((s) => ({ ...s })) : [{ reps: 8, weightKg: 20 }],
      };
    }),
  );
}
