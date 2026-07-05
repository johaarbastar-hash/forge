import type { Food, MealCategory, MealItem } from '../../types';

export const CATEGORY_LABELS: Record<MealCategory, string> = {
  breakfast: 'Breakfast',
  lunch: 'Lunch',
  dinner: 'Dinner',
  snack: 'Snack',
  preWorkout: 'Pre-workout',
  postWorkout: 'Post-workout',
};

export const CATEGORY_ORDER: MealCategory[] = [
  'breakfast',
  'lunch',
  'dinner',
  'snack',
  'preWorkout',
  'postWorkout',
];

/** Human summary of a meal's items, e.g. "Rice, Dal +1 more". */
export function mealTitle(items: MealItem[], foodsById: Map<string, Food>): string {
  const names = items.map((i) => foodsById.get(i.foodId)?.name ?? 'Unknown');
  if (names.length === 0) return 'Empty meal';
  if (names.length <= 2) return names.join(', ');
  return `${names[0]}, ${names[1]} +${names.length - 2} more`;
}

/** How a single item's quantity reads, e.g. "2 pieces" or "150 g". */
export function itemQuantityLabel(food: Food, grams: number): string {
  if (food.unit === 'piece' && food.pieceGrams) {
    const pieces = grams / food.pieceGrams;
    const rounded = Math.round(pieces * 100) / 100;
    return `${rounded} ${rounded === 1 ? 'piece' : 'pieces'}`;
  }
  return `${Math.round(grams)} ${food.unit}`;
}
