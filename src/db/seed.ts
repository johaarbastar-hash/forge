import type { Transaction } from 'dexie';

import { seedExercises } from '../data/exercises';
import { seedFavoriteMeals } from '../data/favoriteMeals';
import { seedFoods } from '../data/foods';
import { seedHabits } from '../data/habits';
import type { Settings, Timestamps } from '../types';

export function stamp<T>(row: T): T & Timestamps {
  const now = new Date().toISOString();
  return { ...row, createdAt: now, updatedAt: now };
}

export const DEFAULT_SETTINGS: Omit<Settings, keyof Timestamps> = {
  id: 'settings',
  reminders: {
    water: { enabled: false, intervalMin: 120 },
    meals: { enabled: false, time: '13:00' },
    workout: { enabled: false, time: '17:30' },
    sleep: { enabled: false, time: '22:30' },
    weighIn: { enabled: false, time: '08:00' },
  },
  developer: {},
};

/**
 * Seeds static tables. Runs inside Dexie's `populate` event, which fires
 * exactly once — when the database is first created — so a fresh DB seeds
 * once and an existing DB is never re-seeded.
 */
export function seedDatabase(tx: Transaction): void {
  void tx.table('foods').bulkAdd(seedFoods.map(stamp));
  void tx.table('exercises').bulkAdd(seedExercises.map(stamp));
  void tx.table('habits').bulkAdd(seedHabits.map(stamp));
  void tx.table('favoriteMeals').bulkAdd(seedFavoriteMeals.map(stamp));
  void tx.table('settings').add(stamp(DEFAULT_SETTINGS));
}
