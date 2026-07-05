// Domain types per SPEC §3. Every stored row has `id` + timestamps.

export type Timestamps = {
  createdAt: string; // ISO datetime (metadata only — never used for day bucketing)
  updatedAt: string;
};

export type Entity = Timestamps & { id: string };

/** Local calendar day, `YYYY-MM-DD`, produced only by `toDayKey()`. */
export type DayKey = string;

export type Experience = 'beginner' | 'intermediate' | 'advanced';

export type Profile = Entity & {
  name: string;
  age: number;
  heightCm: number;
  startWeightKg: number;
  experience: Experience;
  splitId: string;
  onboarded: boolean;
};

export type Goals = Entity & {
  weightKg: number;
  calories: number;
  proteinG: number;
  waterMl: number;
  sleepH: number;
  workoutsPerWeek: number;
};

export type GoalField = 'weightKg' | 'calories' | 'proteinG' | 'waterMl' | 'sleepH' | 'workoutsPerWeek';

/** Append-only log per SPEC §5.9 — each day is evaluated against the goal active that day. */
export type GoalHistoryEntry = Entity & {
  field: GoalField;
  value: number;
  effectiveFromDayKey: DayKey;
};

export type Macros = {
  kcal: number;
  proteinG: number;
  carbsG: number;
  fatG: number;
  fiberG: number;
};

export type FoodUnit = 'g' | 'ml' | 'piece';

export type Food = Entity & {
  name: string;
  /**
   * Macro values per the food's stated base (SPEC §4.1): per 100 g for unit
   * 'g', per 100 ml for unit 'ml', per ONE piece for unit 'piece' (with
   * `pieceGrams` giving that piece's weight). Seed values are stored verbatim.
   */
  per100: Macros;
  unit: FoodUnit;
  pieceGrams?: number;
  defaultServing: { label: string; grams: number };
  isCustom: boolean;
  isFavorite: boolean;
};

export type MealCategory = 'breakfast' | 'lunch' | 'dinner' | 'snack' | 'preWorkout' | 'postWorkout';

export type MealItem = { foodId: string; grams: number };

export type Meal = Entity & {
  dayKey: DayKey;
  category: MealCategory;
  items: MealItem[];
  cachedMacros: Macros;
  time: string; // HH:mm local
};

/** Saved named combo, loggable in a couple of taps (SPEC §5.3). No §3 table — added in schema v2. */
export type FavoriteMeal = Entity & {
  name: string;
  category: MealCategory;
  items: MealItem[];
};

export type WaterLog = Entity & { dayKey: DayKey; ml: number; time: string };

export type SleepLog = Entity & { dayKey: DayKey; hours: number; bedtime?: string };

export type WeightLog = Entity & { dayKey: DayKey; kg: number };

export type MuscleGroup = 'push' | 'pull' | 'legs' | 'core';

export type Exercise = Entity & {
  name: string;
  muscleGroup: MuscleGroup;
  equipment: string;
  isCustom: boolean;
};

export type WorkoutSet = { reps: number; weightKg: number };

export type WorkoutEntry = { exerciseId: string; sets: WorkoutSet[] };

export type Workout = Entity & {
  dayKey: DayKey;
  splitDay: string;
  entries: WorkoutEntry[];
  durationMin: number;
  notes: string;
  completed: boolean;
};

export type Measurement = Entity & {
  dayKey: DayKey;
  chestCm?: number;
  waistCm?: number;
  armCm?: number;
  thighCm?: number;
  hipCm?: number;
  shoulderCm?: number;
};

export type Photo = Entity & {
  dayKey: DayKey;
  blob: Blob; // JPEG, max edge 1280 px, q0.8 (compression applied at capture)
  note?: string;
};

export type Habit = Entity & {
  name: string;
  icon: string;
  target: 'daily';
  isActive: boolean;
};

export type HabitLog = Entity & { habitId: string; dayKey: DayKey; done: boolean };

export type DayNote = Entity & { dayKey: DayKey; note: string; mood: 1 | 2 | 3 | 4 | 5 };

export type XpEventType =
  | 'WORKOUT_COMPLETED'
  | 'PROTEIN_GOAL_HIT'
  | 'WATER_GOAL_HIT'
  | 'SLEEP_GOAL_HIT'
  | 'WEIGHT_LOGGED'
  | 'ALL_MISSIONS_DONE'
  | 'STREAK_DAY';

export type XpEvent = Entity & { dayKey: DayKey; type: XpEventType; amount: number };

export type AchievementId =
  | 'first_workout'
  | 'streak_7'
  | 'streak_30'
  | 'first_leg_day'
  | 'first_chest_day'
  | 'water_3l'
  | 'first_protein_goal'
  | 'gain_1kg'
  | 'first_pr'
  | 'meals_50'
  | 'level_5'
  | 'early_bird';

export type AchievementUnlock = Entity & { achievementId: AchievementId; dayKey: DayKey };

export type ReminderType = 'water' | 'meals' | 'workout' | 'sleep' | 'weighIn';

export type ReminderConfig = {
  enabled: boolean;
  /** HH:mm for time-of-day reminders; water uses `intervalMin` instead. */
  time?: string;
  intervalMin?: number;
};

export type Settings = Entity & {
  reminders: Record<ReminderType, ReminderConfig>;
  developer: { demoDataLoadedAt?: string };
};

// ---- static definitions (shipped as data modules, no DB tables in SPEC §3) ----

export type Weekday = 'mon' | 'tue' | 'wed' | 'thu' | 'fri' | 'sat' | 'sun';

export type SplitDayPlan = { label: string; exerciseIds: string[] } | { label: 'Rest' };

export type SplitTemplate = {
  id: string;
  name: string;
  daysPerWeek: number;
  schedule: Record<Weekday, SplitDayPlan>;
};

export type AchievementDef = {
  id: AchievementId;
  title: string;
  description: string;
};

export type DailyMissionDef = {
  id: 'water_goal' | 'protein_goal' | 'workout' | 'sleep_goal';
  title: string;
  /** Skipped when the split schedules a rest day (SPEC §5.11). */
  skipOnRestDay: boolean;
};

export type WeeklyChallengeDef = {
  id: 'train_n_days' | 'protein_every_tracked_day' | 'log_weight_3x';
  title: string;
};
