import type { Food, Macros, MealItem } from '../types';

export const ZERO_MACROS: Macros = { kcal: 0, proteinG: 0, carbsG: 0, fatG: 0, fiberG: 0 };

/** Scale a food's base macros (SPEC §4.1 semantics) to `grams` of it. */
export function macrosForGrams(food: Pick<Food, 'per100' | 'unit' | 'pieceGrams'>, grams: number): Macros {
  // 'g'/'ml': values are per 100 g / 100 ml. 'piece': values are per one
  // piece of `pieceGrams` grams, so scale by pieces, not by 100 g.
  const factor =
    food.unit === 'piece'
      ? grams / (food.pieceGrams && food.pieceGrams > 0 ? food.pieceGrams : 100)
      : grams / 100;
  return scaleMacros(food.per100, factor);
}

export function scaleMacros(m: Macros, factor: number): Macros {
  return {
    kcal: m.kcal * factor,
    proteinG: m.proteinG * factor,
    carbsG: m.carbsG * factor,
    fatG: m.fatG * factor,
    fiberG: m.fiberG * factor,
  };
}

export function addMacros(a: Macros, b: Macros): Macros {
  return {
    kcal: a.kcal + b.kcal,
    proteinG: a.proteinG + b.proteinG,
    carbsG: a.carbsG + b.carbsG,
    fatG: a.fatG + b.fatG,
    fiberG: a.fiberG + b.fiberG,
  };
}

export function sumMacros(list: Macros[]): Macros {
  return list.reduce(addMacros, ZERO_MACROS);
}

/**
 * Aggregate a meal's items to total macros. Items whose food is missing from
 * the lookup contribute nothing (deleted food edge case).
 */
export function aggregateMealMacros(
  items: MealItem[],
  foodsById: Map<string, Pick<Food, 'per100' | 'unit' | 'pieceGrams'>>,
): Macros {
  return sumMacros(
    items.map((item) => {
      const food = foodsById.get(item.foodId);
      return food ? macrosForGrams(food, item.grams) : ZERO_MACROS;
    }),
  );
}

/** Round macros for display/caching: kcal to whole, grams to 1 decimal. */
export function roundMacros(m: Macros): Macros {
  const r1 = (n: number) => Math.round(n * 10) / 10;
  return {
    kcal: Math.round(m.kcal),
    proteinG: r1(m.proteinG),
    carbsG: r1(m.carbsG),
    fatG: r1(m.fatG),
    fiberG: r1(m.fiberG),
  };
}
