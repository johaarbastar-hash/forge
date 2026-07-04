import type { Exercise, MuscleGroup, Timestamps } from '../types';

export type SeedExercise = Omit<Exercise, keyof Timestamps>;

const e = (id: string, name: string, muscleGroup: MuscleGroup, equipment: string): SeedExercise => ({
  id,
  name,
  muscleGroup,
  equipment,
  isCustom: false,
});

// SPEC §4.2 — 28 exercises.
export const seedExercises: SeedExercise[] = [
  // Push
  e('ex-bench-press', 'Barbell Bench Press', 'push', 'barbell'),
  e('ex-incline-db-press', 'Incline Dumbbell Press', 'push', 'dumbbell'),
  e('ex-overhead-press', 'Overhead Press', 'push', 'barbell'),
  e('ex-lateral-raise', 'Lateral Raise', 'push', 'dumbbell'),
  e('ex-cable-fly', 'Cable Fly', 'push', 'cable'),
  e('ex-tricep-pushdown', 'Tricep Rope Pushdown', 'push', 'cable'),
  e('ex-overhead-tricep-ext', 'Overhead Tricep Extension', 'push', 'dumbbell'),
  e('ex-dips', 'Dips', 'push', 'bodyweight'),
  // Pull
  e('ex-deadlift', 'Deadlift', 'pull', 'barbell'),
  e('ex-pull-up', 'Pull-up', 'pull', 'bodyweight'),
  e('ex-lat-pulldown', 'Lat Pulldown', 'pull', 'cable'),
  e('ex-barbell-row', 'Barbell Row', 'pull', 'barbell'),
  e('ex-seated-cable-row', 'Seated Cable Row', 'pull', 'cable'),
  e('ex-face-pull', 'Face Pull', 'pull', 'cable'),
  e('ex-barbell-curl', 'Barbell Curl', 'pull', 'barbell'),
  e('ex-hammer-curl', 'Hammer Curl', 'pull', 'dumbbell'),
  // Legs
  e('ex-back-squat', 'Back Squat', 'legs', 'barbell'),
  e('ex-leg-press', 'Leg Press', 'legs', 'machine'),
  e('ex-rdl', 'Romanian Deadlift', 'legs', 'barbell'),
  e('ex-leg-extension', 'Leg Extension', 'legs', 'machine'),
  e('ex-seated-leg-curl', 'Seated Leg Curl', 'legs', 'machine'),
  e('ex-walking-lunge', 'Walking Lunge', 'legs', 'dumbbell'),
  e('ex-calf-raise', 'Standing Calf Raise', 'legs', 'machine'),
  e('ex-hip-thrust', 'Hip Thrust', 'legs', 'barbell'),
  // Core
  e('ex-plank', 'Plank', 'core', 'bodyweight'),
  e('ex-hanging-knee-raise', 'Hanging Knee Raise', 'core', 'bodyweight'),
  e('ex-cable-crunch', 'Cable Crunch', 'core', 'cable'),
  e('ex-russian-twist', 'Russian Twist', 'core', 'bodyweight'),
];
