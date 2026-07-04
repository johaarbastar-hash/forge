// Onboarding goal suggestions per SPEC §5.1 — always shown editable and
// labeled "suggestion, not medical advice".

const roundTo = (value: number, step: number) => Math.round(value / step) * step;

/**
 * Mifflin-St Jeor BMR. SPEC §3 has no sex field (single-user app for a
 * teenage gym-goer), so the +5 constant is used — see Decisions log.
 */
export function mifflinStJeor(weightKg: number, heightCm: number, age: number): number {
  return 10 * weightKg + 6.25 * heightCm - 5 * age + 5;
}

/** calories = BMR × 1.5 activity + 350 surplus, rounded to 50. */
export function suggestedCalories(weightKg: number, heightCm: number, age: number): number {
  return roundTo(mifflinStJeor(weightKg, heightCm, age) * 1.5 + 350, 50);
}

/** protein = 1.8 g × bodyweight kg, rounded to 5. */
export function suggestedProtein(weightKg: number): number {
  return roundTo(1.8 * weightKg, 5);
}

/** water = 35 ml × kg, rounded to 250. */
export function suggestedWater(weightKg: number): number {
  return roundTo(35 * weightKg, 250);
}

export const SUGGESTED_SLEEP_H = 8;

export type SuggestedGoals = {
  calories: number;
  proteinG: number;
  waterMl: number;
  sleepH: number;
  workoutsPerWeek: number;
};

/** Full suggestion set; workouts/week comes from the chosen split. */
export function suggestedGoals(
  weightKg: number,
  heightCm: number,
  age: number,
  splitDaysPerWeek: number,
): SuggestedGoals {
  return {
    calories: suggestedCalories(weightKg, heightCm, age),
    proteinG: suggestedProtein(weightKg),
    waterMl: suggestedWater(weightKg),
    sleepH: SUGGESTED_SLEEP_H,
    workoutsPerWeek: splitDaysPerWeek,
  };
}
