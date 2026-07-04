import { db, newId, nowIso } from '../db';
import type { Exercise, MuscleGroup, Timestamps } from '../../types';

export async function allExercises(): Promise<Exercise[]> {
  return db.exercises.orderBy('name').toArray();
}

export async function getExercise(id: string): Promise<Exercise | undefined> {
  return db.exercises.get(id);
}

export async function exercisesByGroup(group: MuscleGroup): Promise<Exercise[]> {
  return db.exercises.where('muscleGroup').equals(group).toArray();
}

export async function addCustomExercise(
  data: Omit<Exercise, 'id' | 'isCustom' | keyof Timestamps>,
): Promise<Exercise> {
  const exercise: Exercise = {
    ...data,
    id: newId(),
    isCustom: true,
    createdAt: nowIso(),
    updatedAt: nowIso(),
  };
  await db.exercises.add(exercise);
  return exercise;
}

export async function updateExercise(
  id: string,
  data: Partial<Omit<Exercise, 'id' | keyof Timestamps>>,
): Promise<void> {
  await db.exercises.update(id, { ...data, updatedAt: nowIso() });
}
