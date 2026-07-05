import { db, newId, nowIso } from '../db';
import { aggregateMealMacros, roundMacros } from '../../lib/macros';
import type { DayKey, Meal, MealCategory, MealItem } from '../../types';

async function computeCachedMacros(items: MealItem[]) {
  const foods = await db.foods.bulkGet(items.map((i) => i.foodId));
  const byId = new Map(foods.filter((f) => !!f).map((f) => [f.id, f]));
  return roundMacros(aggregateMealMacros(items, byId));
}

export async function mealsByDay(dayKey: DayKey): Promise<Meal[]> {
  return db.meals.where('dayKey').equals(dayKey).sortBy('time');
}

export async function mealsByDays(dayKeys: DayKey[]): Promise<Meal[]> {
  return db.meals.where('dayKey').anyOf(dayKeys).toArray();
}

export async function allMeals(): Promise<Meal[]> {
  return db.meals.orderBy('dayKey').toArray();
}

export async function countMeals(): Promise<number> {
  return db.meals.count();
}

export async function addMeal(data: {
  dayKey: DayKey;
  category: MealCategory;
  items: MealItem[];
  time: string;
}): Promise<Meal> {
  const meal: Meal = {
    id: newId(),
    ...data,
    cachedMacros: await computeCachedMacros(data.items),
    createdAt: nowIso(),
    updatedAt: nowIso(),
  };
  await db.meals.add(meal);
  return meal;
}

export async function updateMeal(
  id: string,
  data: Partial<Pick<Meal, 'dayKey' | 'category' | 'items' | 'time'>>,
): Promise<void> {
  const patch: Partial<Meal> = { ...data, updatedAt: nowIso() };
  if (data.items) patch.cachedMacros = await computeCachedMacros(data.items);
  await db.meals.update(id, patch);
}

export async function deleteMeal(id: string): Promise<void> {
  await db.meals.delete(id);
}

/** Copy a meal to today or another day (SPEC §5.3). */
export async function duplicateMeal(id: string, targetDayKey: DayKey): Promise<Meal | undefined> {
  const source = await db.meals.get(id);
  if (!source) return undefined;
  const copy: Meal = {
    ...source,
    id: newId(),
    dayKey: targetDayKey,
    createdAt: nowIso(),
    updatedAt: nowIso(),
  };
  await db.meals.add(copy);
  return copy;
}

/** Last `limit` distinct foods used in meals, most recent first (SPEC §5.3 recents). */
export async function recentFoodIds(limit = 15): Promise<string[]> {
  const meals = await db.meals.orderBy('dayKey').reverse().toArray();
  const seen = new Set<string>();
  for (const meal of meals) {
    for (const item of meal.items) {
      if (!seen.has(item.foodId)) seen.add(item.foodId);
      if (seen.size >= limit) return [...seen];
    }
  }
  return [...seen];
}
