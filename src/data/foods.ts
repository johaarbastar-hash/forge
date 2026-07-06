import type { Food, Timestamps } from '../types';

export type SeedFood = Omit<Food, keyof Timestamps>;

const f = (
  id: string,
  name: string,
  unit: Food['unit'],
  kcal: number,
  proteinG: number,
  carbsG: number,
  fatG: number,
  fiberG: number,
  defaultServing: Food['defaultServing'],
  pieceGrams?: number,
): SeedFood => ({
  id,
  name,
  unit,
  per100: { kcal, proteinG, carbsG, fatG, fiberG },
  ...(pieceGrams !== undefined ? { pieceGrams } : {}),
  defaultServing,
  isCustom: false,
  isFavorite: false,
});

// SPEC §4.1 verbatim — 19 items, values per the stated base. Do not edit here;
// users may edit their own copies in-app ("approximate values — editable").
export const originalSeedFoods: SeedFood[] = [
  f('food-rice', 'Rice, white, cooked', 'g', 130, 2.7, 28.2, 0.3, 0.4, { label: '1 katori', grams: 150 }),
  f('food-roti', 'Roti (whole wheat)', 'piece', 115, 4.0, 23.0, 1.0, 3.5, { label: '1 piece', grams: 40 }, 40),
  f('food-dal', 'Dal (toor, cooked)', 'g', 95, 5.5, 14.5, 1.8, 3.0, { label: '1 katori', grams: 150 }),
  f('food-paneer', 'Paneer', 'g', 290, 18.0, 4.0, 22.0, 0, { label: '50 g', grams: 50 }),
  f('food-chicken', 'Chicken breast, cooked', 'g', 165, 31.0, 0, 3.6, 0, { label: '100 g', grams: 100 }),
  f('food-egg', 'Egg, whole, boiled', 'piece', 75, 6.3, 0.5, 5.0, 0, { label: '1 piece', grams: 50 }, 50),
  f('food-milk', 'Milk, full-fat', 'ml', 64, 3.2, 4.8, 3.6, 0, { label: '1 glass', grams: 250 }),
  f('food-banana', 'Banana', 'piece', 105, 1.3, 27.0, 0.4, 3.1, { label: '1 piece', grams: 120 }, 120),
  f('food-apple', 'Apple', 'piece', 95, 0.5, 25.0, 0.3, 4.4, { label: '1 piece', grams: 180 }, 180),
  f('food-oats', 'Oats, dry', 'g', 389, 14.0, 66.0, 7.0, 10.0, { label: '40 g', grams: 40 }),
  f('food-peanut-butter', 'Peanut butter', 'g', 590, 25.0, 20.0, 50.0, 6.0, { label: '1 tbsp', grams: 16 }),
  f('food-sattu', 'Sattu', 'g', 410, 22.0, 60.0, 6.0, 16.0, { label: '30 g', grams: 30 }),
  f('food-chole', 'Chole (chickpea curry)', 'g', 150, 6.0, 18.0, 6.0, 5.0, { label: '1 katori', grams: 150 }),
  f('food-rajma', 'Rajma (curry)', 'g', 140, 6.0, 17.5, 5.5, 5.5, { label: '1 katori', grams: 150 }),
  f('food-bhatura', 'Bhatura', 'piece', 290, 5.5, 34.0, 14.5, 1.5, { label: '1 piece', grams: 70 }, 70),
  f('food-muesli', 'Muesli', 'g', 390, 9.5, 70.0, 7.0, 7.5, { label: '45 g', grams: 45 }),
  f('food-dry-fruits', 'Mixed dry fruits & nuts', 'g', 580, 17.0, 22.0, 47.0, 8.0, { label: '30 g', grams: 30 }),
  f('food-whey', 'Whey protein shake', 'piece', 120, 24.0, 3.0, 1.5, 0, { label: '1 scoop', grams: 30 }, 30),
  f('food-curd', 'Curd (full-fat dahi)', 'g', 65, 3.5, 4.5, 3.8, 0, { label: '1 katori', grams: 150 }),
];

// Extension beyond SPEC §4.1 — common Indian/gym foods. Approximate
// IFCT/USDA-based values, editable in-app like the rest. Added in schema v3.
export const extraSeedFoods: SeedFood[] = [
  f('food-poha', 'Poha (cooked)', 'g', 130, 2.5, 27.0, 1.5, 1.0, { label: '1 katori', grams: 150 }),
  f('food-idli', 'Idli', 'piece', 58, 2.0, 12.0, 0.4, 0.6, { label: '2 pieces', grams: 80 }, 40),
  f('food-dosa', 'Dosa, plain', 'piece', 168, 3.5, 29.0, 4.0, 1.2, { label: '1 piece', grams: 80 }, 80),
  f('food-upma', 'Upma', 'g', 130, 3.0, 20.0, 4.0, 1.5, { label: '1 katori', grams: 150 }),
  f('food-moong-dal', 'Moong dal (cooked)', 'g', 105, 7.0, 15.0, 0.5, 4.0, { label: '1 katori', grams: 150 }),
  f('food-soya-chunks', 'Soya chunks, dry', 'g', 345, 52.0, 33.0, 0.5, 13.0, { label: '30 g', grams: 30 }),
  f('food-greek-yogurt', 'Greek yogurt', 'g', 59, 10.0, 3.6, 0.4, 0, { label: '1 katori', grams: 150 }),
  f('food-tofu', 'Tofu', 'g', 76, 8.0, 1.9, 4.8, 0.3, { label: '100 g', grams: 100 }),
  f('food-almonds', 'Almonds', 'g', 579, 21.0, 22.0, 50.0, 12.5, { label: '30 g', grams: 30 }),
  f('food-peanuts', 'Peanuts, roasted', 'g', 567, 26.0, 16.0, 49.0, 8.5, { label: '30 g', grams: 30 }),
  f('food-ghee', 'Ghee', 'g', 900, 0, 0, 100.0, 0, { label: '1 tsp', grams: 5 }),
  f('food-chicken-thigh', 'Chicken thigh, cooked', 'g', 209, 26.0, 0, 10.9, 0, { label: '100 g', grams: 100 }),
  f('food-fish-rohu', 'Fish (rohu), cooked', 'g', 97, 16.6, 0, 3.0, 0, { label: '100 g', grams: 100 }),
  f('food-brown-rice', 'Brown rice, cooked', 'g', 111, 2.6, 23.0, 0.9, 1.8, { label: '1 katori', grams: 150 }),
  f('food-sweet-potato', 'Sweet potato, boiled', 'g', 86, 1.6, 20.0, 0.1, 3.0, { label: '1 katori', grams: 150 }),
];

export const seedFoods: SeedFood[] = [...originalSeedFoods, ...extraSeedFoods];
