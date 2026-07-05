import { addDaysToKey, weekStartKey } from '../../lib/dates';
import { rollingAverage } from '../../lib/analytics';
import type { DayKey } from '../../types';

export type ChartRange = 7 | 30 | 90;

export type DailyPoint = {
  dayKey: DayKey;
  label: string;
  weight: number | null;
  weightAvg: number | null;
  kcal: number | null;
  protein: number | null;
  water: number | null;
};

export type WeeklyPoint = { weekStart: DayKey; label: string; workouts: number };

/** The `range` day keys ending at `today`, oldest first. */
export function rangeDayKeys(today: DayKey, range: number): DayKey[] {
  return Array.from({ length: range }, (_, i) => addDaysToKey(today, i - (range - 1)));
}

function shortLabel(dayKey: DayKey): string {
  // "MM-DD" → "D/M" without constructing a Date (labels only)
  const parts = dayKey.split('-');
  return `${Number(parts[2])}/${Number(parts[1])}`;
}

/**
 * Build the per-day series for the weight/kcal/protein/water charts. Missing
 * days are null (gaps in the line, not zeros). Weight also carries a trailing
 * 7-day rolling average.
 */
export function dailySeries(
  dayKeys: DayKey[],
  data: {
    weightByDay: Map<DayKey, number>;
    kcalByDay: Map<DayKey, number>;
    proteinByDay: Map<DayKey, number>;
    waterByDay: Map<DayKey, number>;
  },
): DailyPoint[] {
  const weights = dayKeys.map((d) => data.weightByDay.get(d) ?? null);
  const avg = rollingAverage(weights, 7);
  return dayKeys.map((dayKey, i) => ({
    dayKey,
    label: shortLabel(dayKey),
    weight: weights[i] ?? null,
    weightAvg: avg[i] ?? null,
    kcal: data.kcalByDay.get(dayKey) ?? null,
    protein: data.proteinByDay.get(dayKey) ?? null,
    water: data.waterByDay.get(dayKey) ?? null,
  }));
}

/** Completed-workout counts grouped by Monday-start week across the range. */
export function weeklyWorkoutCounts(dayKeys: DayKey[], completedWorkoutDays: DayKey[]): WeeklyPoint[] {
  const inRange = new Set(dayKeys);
  const counts = new Map<DayKey, number>();
  // seed every week in range so empty weeks render as zero bars
  for (const d of dayKeys) {
    const wk = weekStartKey(d);
    if (!counts.has(wk)) counts.set(wk, 0);
  }
  for (const day of completedWorkoutDays) {
    if (!inRange.has(day)) continue;
    const wk = weekStartKey(day);
    counts.set(wk, (counts.get(wk) ?? 0) + 1);
  }
  return [...counts.entries()]
    .sort((a, b) => a[0].localeCompare(b[0]))
    .map(([weekStart, workouts]) => ({ weekStart, label: shortLabel(weekStart), workouts }));
}
