import type Dexie from 'dexie';

/**
 * Versioned schema upgrades. Append a new `db.version(n)` block for every
 * schema change — never edit an existing version once shipped.
 */
export function applyMigrations(db: Dexie): void {
  db.version(1).stores({
    profile: 'id',
    goals: 'id',
    goalHistory: 'id, effectiveFromDayKey, [field+effectiveFromDayKey]',
    foods: 'id, name, isCustom, isFavorite',
    meals: 'id, dayKey, [dayKey+category]',
    waterLogs: 'id, dayKey',
    sleepLogs: 'id, &dayKey',
    weightLogs: 'id, &dayKey',
    exercises: 'id, name, muscleGroup',
    workouts: 'id, dayKey',
    measurements: 'id, dayKey',
    photos: 'id, dayKey',
    habits: 'id, isActive',
    habitLogs: 'id, habitId, dayKey, &[habitId+dayKey]',
    dayNotes: 'id, &dayKey',
    xpEvents: 'id, &[dayKey+type], dayKey',
    achievementUnlocks: 'id, &achievementId',
    settings: 'id',
  });

  // v2: favorite meal combos (SPEC §5.3). Existing tables carry over unchanged.
  db.version(2).stores({
    favoriteMeals: 'id, name',
  });
}
