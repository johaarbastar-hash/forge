import 'fake-indexeddb/auto';

import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import { db } from './db';
import { evaluateProteinGoal } from './repositories/awardsRepo';
import { addFavoriteMeal, allFavoriteMeals } from './repositories/favoriteMealsRepo';
import { saveGoals } from './repositories/goalsRepo';
import { addMeal, deleteMeal, duplicateMeal, recentFoodIds } from './repositories/mealsRepo';

beforeEach(async () => {
  await db.delete();
  await db.open();
});

afterEach(() => {
  db.close();
});

describe('favorite meals (schema v2)', () => {
  it('saves and lists named combos', async () => {
    await addFavoriteMeal({
      name: 'Post-workout shake',
      category: 'postWorkout',
      items: [
        { foodId: 'food-whey', grams: 30 },
        { foodId: 'food-milk', grams: 250 },
      ],
    });
    const favs = await allFavoriteMeals();
    expect(favs).toHaveLength(1);
    expect(favs[0]?.name).toBe('Post-workout shake');
    expect(favs[0]?.items).toHaveLength(2);
  });
});

describe('PROTEIN_GOAL_HIT award (idempotent, day-scoped)', () => {
  beforeEach(async () => {
    await saveGoals(
      { calories: 2750, proteinG: 110, waterMl: 2000, sleepH: 8, workoutsPerWeek: 6, weightKg: 68 },
      '2026-07-01',
    );
  });

  it('does not award below goal', async () => {
    // 30 g whey → 24 g protein, well under 110
    await addMeal({
      dayKey: '2026-07-04',
      category: 'snack',
      items: [{ foodId: 'food-whey', grams: 30 }],
      time: '10:00',
    });
    expect(await evaluateProteinGoal('2026-07-04')).toBe(false);
    expect(await db.xpEvents.count()).toBe(0);
  });

  it('awards once when the day crosses the goal, never twice', async () => {
    // chicken 300 g → 93 g, paneer 100 g → 18 g, whey 30 g → 24 g = 135 g ≥ 110
    await addMeal({
      dayKey: '2026-07-04',
      category: 'lunch',
      items: [
        { foodId: 'food-chicken', grams: 300 },
        { foodId: 'food-paneer', grams: 100 },
        { foodId: 'food-whey', grams: 30 },
      ],
      time: '13:00',
    });
    expect(await evaluateProteinGoal('2026-07-04')).toBe(true);
    expect(await evaluateProteinGoal('2026-07-04')).toBe(false); // idempotent
    const events = await db.xpEvents.toArray();
    expect(events).toHaveLength(1);
    expect(events[0]?.amount).toBe(30);
  });

  it('uses the goal active on that day (goalHistory)', async () => {
    await saveGoals({ proteinG: 130 }, '2026-07-10');
    // 120 g protein: clears the old 110 goal but not the new 130 goal
    const items = [
      { foodId: 'food-chicken', grams: 300 }, // 93
      { foodId: 'food-whey', grams: 30 }, // 24
    ]; // ≈ 117 g
    await addMeal({ dayKey: '2026-07-05', category: 'lunch', items, time: '13:00' });
    await addMeal({ dayKey: '2026-07-12', category: 'lunch', items, time: '13:00' });
    expect(await evaluateProteinGoal('2026-07-05')).toBe(true); // vs 110
    expect(await evaluateProteinGoal('2026-07-12')).toBe(false); // vs 130
  });
});

describe('recents reflect meal deletes', () => {
  it('recentFoodIds lists distinct foods, most recent day first', async () => {
    await addMeal({
      dayKey: '2026-07-03',
      category: 'breakfast',
      items: [{ foodId: 'food-oats', grams: 40 }],
      time: '08:00',
    });
    const later = await addMeal({
      dayKey: '2026-07-05',
      category: 'lunch',
      items: [{ foodId: 'food-rice', grams: 150 }],
      time: '13:00',
    });
    expect(await recentFoodIds()).toEqual(['food-rice', 'food-oats']);
    await deleteMeal(later.id);
    expect(await recentFoodIds()).toEqual(['food-oats']);
  });

  it('duplicateMeal copies items to another day', async () => {
    const meal = await addMeal({
      dayKey: '2026-07-04',
      category: 'dinner',
      items: [{ foodId: 'food-rice', grams: 150 }],
      time: '20:00',
    });
    const copy = await duplicateMeal(meal.id, '2026-07-06');
    expect(copy?.dayKey).toBe('2026-07-06');
    expect(copy?.id).not.toBe(meal.id);
    expect(copy?.cachedMacros.kcal).toBe(meal.cachedMacros.kcal);
  });
});
