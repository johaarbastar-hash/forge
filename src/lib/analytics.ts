// Analytics scores per SPEC §5.10 — formulas pinned. Days with zero logs are
// excluded from "tracked days", never counted as failures.

export type NutritionDay = {
  /** null/undefined = nothing logged that day (excluded from tracked days) */
  kcal: number | null;
  proteinG: number | null;
  kcalGoal: number;
  proteinGoal: number;
};

const clamp01 = (n: number) => Math.min(1, Math.max(0, n));

/**
 * Nutrition = 50 × (days protein ≥ goal ÷ tracked) + 50 × (days |kcal−goal| ≤ 10% ÷ tracked).
 * A day is tracked if it has any nutrition log.
 */
export function nutritionScore(days: NutritionDay[]): number {
  const tracked = days.filter((d) => d.kcal !== null || d.proteinG !== null);
  if (tracked.length === 0) return 0;
  const proteinDays = tracked.filter((d) => (d.proteinG ?? 0) >= d.proteinGoal).length;
  const kcalDays = tracked.filter(
    (d) => d.kcal !== null && Math.abs(d.kcal - d.kcalGoal) <= 0.1 * d.kcalGoal,
  ).length;
  return 50 * (proteinDays / tracked.length) + 50 * (kcalDays / tracked.length);
}

/** Consistency = 100 × min(1, done ÷ planned). No plan → nothing to miss → 100. */
export function consistencyScore(workoutsDone: number, workoutsPlanned: number): number {
  if (workoutsPlanned <= 0) return 100;
  return 100 * Math.min(1, workoutsDone / workoutsPlanned);
}

/** Recovery = 70 × min(1, avg sleep ÷ goal) + 30 × (≥1 rest day per week ? 1 : 0.5). */
export function recoveryScore(
  avgSleepH: number | null,
  sleepGoalH: number,
  hadRestDayEachWeek: boolean,
): number {
  const sleepPart = avgSleepH === null || sleepGoalH <= 0 ? 0 : clamp01(avgSleepH / sleepGoalH);
  return 70 * sleepPart + 30 * (hadRestDayEachWeek ? 1 : 0.5);
}

/** Hydration = 100 × min(1, avg water ÷ goal). */
export function hydrationScore(avgWaterMl: number | null, waterGoalMl: number): number {
  if (avgWaterMl === null || waterGoalMl <= 0) return 0;
  return 100 * clamp01(avgWaterMl / waterGoalMl);
}

/** Health = 0.3·Nutrition + 0.3·Consistency + 0.2·Recovery + 0.2·Hydration. */
export function healthScore(
  nutrition: number,
  consistency: number,
  recovery: number,
  hydration: number,
): number {
  return 0.3 * nutrition + 0.3 * consistency + 0.2 * recovery + 0.2 * hydration;
}

/** Mean of logged values only; null when nothing is logged. */
export function trackedAverage(values: (number | null | undefined)[]): number | null {
  const logged = values.filter((v): v is number => typeof v === 'number');
  if (logged.length === 0) return null;
  return logged.reduce((a, b) => a + b, 0) / logged.length;
}

/**
 * Centered-window rolling average used by the weight chart and gain rate.
 * Window trails (day and the `window-1` days before it); null points are skipped.
 */
export function rollingAverage(points: (number | null)[], window: number): (number | null)[] {
  return points.map((_, i) => {
    const slice = points.slice(Math.max(0, i - window + 1), i + 1);
    return trackedAverage(slice);
  });
}

/**
 * Weight-gain rate in kg/week: least-squares slope of the 7-day rolling
 * average over the period (per-day slope × 7). Only full 7-day windows count —
 * partial ramp-in windows aren't 7-day averages and would flatten the slope.
 * Needs ≥2 such points; callers pass enough leading context (e.g. the prior
 * week) to cover the report period.
 */
export function weightGainRatePerWeek(dailyWeights: (number | null)[]): number | null {
  const WINDOW = 7;
  const rolled = rollingAverage(dailyWeights, WINDOW);
  const points = rolled
    .map((value, index) => ({ index, value }))
    .filter((p): p is { index: number; value: number } => p.value !== null && p.index >= WINDOW - 1);
  if (points.length < 2) return null;
  const n = points.length;
  const meanX = points.reduce((s, p) => s + p.index, 0) / n;
  const meanY = points.reduce((s, p) => s + p.value, 0) / n;
  let num = 0;
  let den = 0;
  for (const p of points) {
    num += (p.index - meanX) * (p.value - meanY);
    den += (p.index - meanX) ** 2;
  }
  if (den === 0) return null;
  return (num / den) * 7;
}
