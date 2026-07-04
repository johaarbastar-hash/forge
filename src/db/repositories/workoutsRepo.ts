import { db, newId, nowIso } from '../db';
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

/** All completed sets of one exercise across history, day-ordered (PRs, history). */
export async function setsForExercise(
  exerciseId: string,
): Promise<{ dayKey: DayKey; sets: WorkoutSet[] }[]> {
  const workouts = await db.workouts.orderBy('dayKey').toArray();
  return workouts
    .filter((w) => w.completed)
    .map((w) => ({
      dayKey: w.dayKey,
      sets: w.entries.filter((e) => e.exerciseId === exerciseId).flatMap((e) => e.sets),
    }))
    .filter((h) => h.sets.length > 0);
}
