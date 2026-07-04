import { describe, expect, it } from 'vitest';

import {
  SUGGESTED_SLEEP_H,
  mifflinStJeor,
  suggestedCalories,
  suggestedGoals,
  suggestedProtein,
  suggestedWater,
} from './suggestions';

describe('goal suggestions (SPEC §5.1 formulas)', () => {
  it('Mifflin-St Jeor BMR (+5 constant)', () => {
    // 60 kg, 170 cm, 16 y → 600 + 1062.5 − 80 + 5
    expect(mifflinStJeor(60, 170, 16)).toBeCloseTo(1587.5, 5);
  });

  it('calories = BMR × 1.5 + 350, rounded to 50', () => {
    // 1587.5 × 1.5 + 350 = 2731.25 → 2750
    expect(suggestedCalories(60, 170, 16)).toBe(2750);
    // 70 kg, 178 cm, 17 y → BMR 1732.5 → ×1.5 + 350 = 2948.75 → 2950
    expect(suggestedCalories(70, 178, 17)).toBe(2950);
  });

  it('protein = 1.8 × kg, rounded to 5', () => {
    expect(suggestedProtein(60)).toBe(110); // 108 → 110
    expect(suggestedProtein(70)).toBe(125); // 126 → 125
    expect(suggestedProtein(83)).toBe(150); // 149.4 → 150
  });

  it('water = 35 ml × kg, rounded to 250', () => {
    expect(suggestedWater(60)).toBe(2000); // 2100 → 2000
    expect(suggestedWater(72)).toBe(2500); // 2520 → 2500
    expect(suggestedWater(80)).toBe(2750); // 2800 → 2750
  });

  it('sleep fixed at 8 h; workouts/week from split', () => {
    const goals = suggestedGoals(60, 170, 16, 6);
    expect(goals).toEqual({
      calories: 2750,
      proteinG: 110,
      waterMl: 2000,
      sleepH: SUGGESTED_SLEEP_H,
      workoutsPerWeek: 6,
    });
    expect(SUGGESTED_SLEEP_H).toBe(8);
  });
});
