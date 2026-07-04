import { describe, expect, it } from 'vitest';

import { seedFoods } from '../data/foods';
import { aggregateMealMacros, macrosForGrams, roundMacros } from './macros';

const food = (id: string) => {
  const f = seedFoods.find((s) => s.id === id);
  if (!f) throw new Error(`seed food ${id} missing`);
  return f;
};

describe('macro aggregation (SPEC §4.1 semantics)', () => {
  it('per-100g food scales by grams (rice, 150 g katori)', () => {
    const m = macrosForGrams(food('food-rice'), 150);
    expect(m.kcal).toBeCloseTo(195, 5); // 130 × 1.5
    expect(m.proteinG).toBeCloseTo(4.05, 5);
    expect(m.carbsG).toBeCloseTo(42.3, 5);
  });

  it('per-100ml food scales by ml (milk, 250 ml glass)', () => {
    const m = macrosForGrams(food('food-milk'), 250);
    expect(m.kcal).toBeCloseTo(160, 5); // 64 × 2.5
    expect(m.proteinG).toBeCloseTo(8, 5);
    expect(m.fatG).toBeCloseTo(9, 5);
  });

  it('piece food scales by pieces via pieceGrams (2 rotis = 80 g)', () => {
    const m = macrosForGrams(food('food-roti'), 80);
    expect(m.kcal).toBeCloseTo(230, 5); // 115 per 40 g piece × 2
    expect(m.proteinG).toBeCloseTo(8, 5);
    expect(m.fiberG).toBeCloseTo(7, 5);
  });

  it('one whole piece returns the SPEC values exactly (egg)', () => {
    const m = macrosForGrams(food('food-egg'), 50);
    expect(m).toEqual({ kcal: 75, proteinG: 6.3, carbsG: 0.5, fatG: 5.0, fiberG: 0 });
  });

  it('whey scoop (30 g piece) matches SPEC per-scoop values', () => {
    const m = macrosForGrams(food('food-whey'), 30);
    expect(m.kcal).toBeCloseTo(120, 5);
    expect(m.proteinG).toBeCloseTo(24, 5);
  });

  it('aggregates a mixed meal and ignores missing foods', () => {
    const foodsById = new Map(seedFoods.map((f) => [f.id, f]));
    const total = aggregateMealMacros(
      [
        { foodId: 'food-rice', grams: 150 }, // 195 kcal
        { foodId: 'food-dal', grams: 150 }, // 142.5 kcal
        { foodId: 'food-roti', grams: 80 }, // 230 kcal
        { foodId: 'food-deleted', grams: 999 }, // contributes nothing
      ],
      foodsById,
    );
    expect(total.kcal).toBeCloseTo(567.5, 5);
    expect(total.proteinG).toBeCloseTo(4.05 + 8.25 + 8, 5);
  });

  it('roundMacros rounds kcal to whole and grams to 1 decimal', () => {
    expect(roundMacros({ kcal: 567.49, proteinG: 20.301, carbsG: 0.05, fatG: 9.949, fiberG: 0 })).toEqual({
      kcal: 567,
      proteinG: 20.3,
      carbsG: 0.1,
      fatG: 9.9,
      fiberG: 0,
    });
  });
});
