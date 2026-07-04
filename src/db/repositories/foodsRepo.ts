import { db, newId, nowIso } from '../db';
import type { Food, Timestamps } from '../../types';

export async function allFoods(): Promise<Food[]> {
  return db.foods.orderBy('name').toArray();
}

export async function getFood(id: string): Promise<Food | undefined> {
  return db.foods.get(id);
}

export async function getFoodsById(ids: string[]): Promise<Map<string, Food>> {
  const rows = await db.foods.bulkGet(ids);
  const map = new Map<string, Food>();
  rows.forEach((row) => {
    if (row) map.set(row.id, row);
  });
  return map;
}

export async function searchFoods(query: string): Promise<Food[]> {
  const q = query.trim().toLowerCase();
  if (!q) return allFoods();
  return db.foods.filter((f) => f.name.toLowerCase().includes(q)).toArray();
}

export async function favoriteFoods(): Promise<Food[]> {
  return db.foods.filter((f) => f.isFavorite).toArray();
}

export async function addCustomFood(
  data: Omit<Food, 'id' | 'isCustom' | keyof Timestamps>,
): Promise<Food> {
  const food: Food = { ...data, id: newId(), isCustom: true, createdAt: nowIso(), updatedAt: nowIso() };
  await db.foods.add(food);
  return food;
}

/** Seed foods are editable too (SPEC §5.3). */
export async function updateFood(
  id: string,
  data: Partial<Omit<Food, 'id' | keyof Timestamps>>,
): Promise<void> {
  await db.foods.update(id, { ...data, updatedAt: nowIso() });
}

export async function setFoodFavorite(id: string, isFavorite: boolean): Promise<void> {
  await db.foods.update(id, { isFavorite, updatedAt: nowIso() });
}

export async function deleteFood(id: string): Promise<void> {
  await db.foods.delete(id);
}
