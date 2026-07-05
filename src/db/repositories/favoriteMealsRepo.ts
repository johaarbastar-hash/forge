import { db, newId, nowIso } from '../db';
import type { FavoriteMeal, MealCategory, MealItem } from '../../types';

export async function allFavoriteMeals(): Promise<FavoriteMeal[]> {
  return db.favoriteMeals.orderBy('name').toArray();
}

export async function addFavoriteMeal(data: {
  name: string;
  category: MealCategory;
  items: MealItem[];
}): Promise<FavoriteMeal> {
  const fav: FavoriteMeal = { id: newId(), ...data, createdAt: nowIso(), updatedAt: nowIso() };
  await db.favoriteMeals.add(fav);
  return fav;
}

export async function renameFavoriteMeal(id: string, name: string): Promise<void> {
  await db.favoriteMeals.update(id, { name, updatedAt: nowIso() });
}

export async function deleteFavoriteMeal(id: string): Promise<void> {
  await db.favoriteMeals.delete(id);
}
