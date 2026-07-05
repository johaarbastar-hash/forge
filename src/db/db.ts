import Dexie from 'dexie';
import type { Table } from 'dexie';

import type {
  AchievementUnlock,
  DayNote,
  Exercise,
  FavoriteMeal,
  Food,
  GoalHistoryEntry,
  Goals,
  Habit,
  HabitLog,
  Meal,
  Measurement,
  Photo,
  Profile,
  Settings,
  SleepLog,
  WaterLog,
  WeightLog,
  Workout,
  XpEvent,
} from '../types';
import { applyMigrations } from './migrations';
import { seedDatabase } from './seed';

export class ForgeDB extends Dexie {
  profile!: Table<Profile, string>;
  goals!: Table<Goals, string>;
  goalHistory!: Table<GoalHistoryEntry, string>;
  foods!: Table<Food, string>;
  meals!: Table<Meal, string>;
  favoriteMeals!: Table<FavoriteMeal, string>;
  waterLogs!: Table<WaterLog, string>;
  sleepLogs!: Table<SleepLog, string>;
  weightLogs!: Table<WeightLog, string>;
  exercises!: Table<Exercise, string>;
  workouts!: Table<Workout, string>;
  measurements!: Table<Measurement, string>;
  photos!: Table<Photo, string>;
  habits!: Table<Habit, string>;
  habitLogs!: Table<HabitLog, string>;
  dayNotes!: Table<DayNote, string>;
  xpEvents!: Table<XpEvent, string>;
  achievementUnlocks!: Table<AchievementUnlock, string>;
  settings!: Table<Settings, string>;

  constructor(name = 'forge') {
    super(name);
    applyMigrations(this);
    this.on('populate', seedDatabase);
  }
}

export const db = new ForgeDB();

/** Row id generator for user-created rows (seed rows use stable slugs). */
export function newId(): string {
  return crypto.randomUUID();
}

export function nowIso(): string {
  return new Date().toISOString();
}
