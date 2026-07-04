import 'fake-indexeddb/auto';

import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import { seedExercises } from '../data/exercises';
import { seedFoods } from '../data/foods';
import { seedHabits } from '../data/habits';
import { ForgeDB, db } from './db';
import { exportAll, importAll } from './export';
import { getGoalsForDay, saveGoals } from './repositories/goalsRepo';
import { addMeal, mealsByDay } from './repositories/mealsRepo';
import { unlockAchievement } from './repositories/achievementsRepo';
import { awardXp } from './repositories/xpRepo';

beforeEach(async () => {
  // start every test from a genuinely fresh database (re-triggers populate)
  await db.delete();
  await db.open();
});

afterEach(() => {
  db.close();
});

describe('seed loader', () => {
  it('a fresh DB seeds foods (19, SPEC §4.1), exercises (28), habits (8), settings', async () => {
    expect(await db.foods.count()).toBe(19);
    expect(await db.exercises.count()).toBe(28);
    expect(await db.habits.count()).toBe(8);
    expect(await db.settings.count()).toBe(1);
    expect(seedFoods).toHaveLength(19);
    expect(seedExercises).toHaveLength(28);
    expect(seedHabits).toHaveLength(8);

    const rice = await db.foods.get('food-rice');
    expect(rice?.per100).toEqual({ kcal: 130, proteinG: 2.7, carbsG: 28.2, fatG: 0.3, fiberG: 0.4 });
    const roti = await db.foods.get('food-roti');
    expect(roti?.unit).toBe('piece');
    expect(roti?.pieceGrams).toBe(40);
  });

  it('seeds exactly once — reopening the same DB never re-seeds', async () => {
    // user data marker
    await db.foods.update('food-rice', { isFavorite: true });
    db.close();

    const reopened = new ForgeDB();
    await reopened.open();
    expect(await reopened.foods.count()).toBe(19); // no duplicates
    const rice = await reopened.foods.get('food-rice');
    expect(rice?.isFavorite).toBe(true); // user data intact
    reopened.close();

    await db.open(); // restore for afterEach
  });
});

describe('XP idempotency (unique dayKey+type)', () => {
  it('awarding the same (day, type) twice writes once', async () => {
    expect(await awardXp('2026-07-04', 'PROTEIN_GOAL_HIT')).toBe(true);
    expect(await awardXp('2026-07-04', 'PROTEIN_GOAL_HIT')).toBe(false);
    const events = await db.xpEvents.toArray();
    expect(events).toHaveLength(1);
    expect(events[0]?.amount).toBe(30);
  });

  it('same type on different days, and different types same day, both award', async () => {
    await awardXp('2026-07-04', 'WATER_GOAL_HIT');
    await awardXp('2026-07-05', 'WATER_GOAL_HIT');
    await awardXp('2026-07-04', 'WEIGHT_LOGGED');
    expect(await db.xpEvents.count()).toBe(3);
  });
});

describe('achievement unlocks fire once ever', () => {
  it('re-unlocking is a no-op', async () => {
    expect(await unlockAchievement('first_workout', '2026-07-04')).toBe(true);
    expect(await unlockAchievement('first_workout', '2026-07-08')).toBe(false);
    expect(await db.achievementUnlocks.count()).toBe(1);
  });
});

describe('goals + goalHistory repo', () => {
  it('edits append history and resolve per-day (future days only)', async () => {
    await saveGoals(
      { calories: 3000, proteinG: 110, waterMl: 3000, sleepH: 8, workoutsPerWeek: 6, weightKg: 72 },
      '2026-07-01',
    );
    await saveGoals({ proteinG: 130 }, '2026-07-10');

    const before = await getGoalsForDay('2026-07-05');
    const after = await getGoalsForDay('2026-07-12');
    expect(before?.proteinG).toBe(110);
    expect(after?.proteinG).toBe(130);
    expect(before?.calories).toBe(3000);

    const history = await db.goalHistory.toArray();
    expect(history).toHaveLength(7); // 6 initial fields + 1 edit
  });

  it('unchanged values do not append history', async () => {
    await saveGoals({ calories: 3000 }, '2026-07-01');
    await saveGoals({ calories: 3000 }, '2026-07-02');
    expect(await db.goalHistory.count()).toBe(1);
  });
});

describe('exportAll / importAll', () => {
  it('exports every table and round-trips user data', async () => {
    const meal = await addMeal({
      dayKey: '2026-07-04',
      category: 'lunch',
      items: [
        { foodId: 'food-rice', grams: 150 },
        { foodId: 'food-dal', grams: 150 },
      ],
      time: '13:15',
    });
    expect(meal.cachedMacros.kcal).toBe(338); // 195 + 142.5 → rounded

    const dump = await exportAll();
    expect(dump.app).toBe('forge');
    expect(dump.schemaVersion).toBe(1);
    expect(Object.keys(dump.tables).sort()).toEqual(
      db.tables.map((t) => t.name).sort(),
    );
    expect(dump.tables['foods']).toHaveLength(19);
    expect(dump.tables['meals']).toHaveLength(1);
    // JSON-safe (no Blobs, no cycles)
    expect(() => JSON.stringify(dump)).not.toThrow();

    // wipe → import → data restored
    await db.meals.clear();
    await db.foods.clear();
    await importAll(dump);
    expect(await db.foods.count()).toBe(19);
    const restored = await mealsByDay('2026-07-04');
    expect(restored).toHaveLength(1);
    expect(restored[0]?.cachedMacros.kcal).toBe(338);
  });

  it('rejects non-forge dumps', async () => {
    await expect(
      importAll({ app: 'other' } as never),
    ).rejects.toThrow(/Not a Forge export/);
  });
});
