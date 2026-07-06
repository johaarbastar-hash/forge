import type { FavoriteMeal, Timestamps } from '../types';

export type SeedFavoriteMeal = Omit<FavoriteMeal, keyof Timestamps>;

// Ready-made combos loggable in one tap, built only from seed foods. Added in
// schema v3. Users can delete or add their own.
export const seedFavoriteMeals: SeedFavoriteMeal[] = [
  {
    id: 'fav-oats-breakfast',
    name: 'Oats power breakfast',
    category: 'breakfast',
    items: [
      { foodId: 'food-oats', grams: 60 },
      { foodId: 'food-milk', grams: 250 },
      { foodId: 'food-banana', grams: 120 },
      { foodId: 'food-peanut-butter', grams: 16 },
    ],
  },
  {
    id: 'fav-postworkout-shake',
    name: 'Post-workout shake',
    category: 'postWorkout',
    items: [
      { foodId: 'food-whey', grams: 30 },
      { foodId: 'food-milk', grams: 250 },
      { foodId: 'food-banana', grams: 120 },
    ],
  },
  {
    id: 'fav-dal-chawal',
    name: 'Dal chawal',
    category: 'lunch',
    items: [
      { foodId: 'food-rice', grams: 150 },
      { foodId: 'food-dal', grams: 150 },
    ],
  },
  {
    id: 'fav-rajma-chawal',
    name: 'Rajma chawal',
    category: 'lunch',
    items: [
      { foodId: 'food-rice', grams: 150 },
      { foodId: 'food-rajma', grams: 150 },
    ],
  },
  {
    id: 'fav-paneer-dinner',
    name: 'Paneer roti dinner',
    category: 'dinner',
    items: [
      { foodId: 'food-roti', grams: 80 },
      { foodId: 'food-paneer', grams: 100 },
      { foodId: 'food-curd', grams: 150 },
    ],
  },
  {
    id: 'fav-yogurt-almonds',
    name: 'Yogurt & almonds',
    category: 'snack',
    items: [
      { foodId: 'food-greek-yogurt', grams: 150 },
      { foodId: 'food-almonds', grams: 30 },
    ],
  },
];
