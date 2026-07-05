import type { DayKey } from '../types';

export type Insight = {
  id: string;
  priority: number; // 1 (most urgent) … 5
  message: string;
  metric?: string;
};

export type CoachGoals = {
  calories: number;
  proteinG: number;
  waterMl: number;
  sleepH: number;
  workoutsPerWeek: number;
};

/**
 * Fully-aggregated input for the coach. The DB→input assembly lives in a repo;
 * this module is pure so all 12 rules (SPEC §5.12) are deterministic + tested.
 */
export type CoachInput = {
  hour: number; // local hour 0–23 of `now`
  today: DayKey;
  goals: CoachGoals;
  todayProteinG: number;
  todayWaterMl: number;
  loggedToday: boolean;
  currentStreak: number;
  last3SleepH: (number | null)[];
  last3Kcal: (number | null)[];
  recent7WeightAvg: number | null;
  prior7WeightAvg: number | null;
  daysOfWeightData: number;
  /** Label of yesterday's scheduled training day IF it was a training day with no completed workout. */
  yesterdaySkippedLabel: string | null;
  weekWorkoutsDone: number;
  weekWorkoutsTarget: number;
  newPr: { exercise: string; weightKg: number; reps: number } | null;
  consecutiveTrainingDays: number;
};

function mean(values: (number | null)[]): number | null {
  const nums = values.filter((v): v is number => typeof v === 'number');
  if (nums.length === 0) return null;
  return nums.reduce((a, b) => a + b, 0) / nums.length;
}

const signed = (n: number) => `${n >= 0 ? '+' : ''}${n.toFixed(1)}`;

/** All applicable insights, sorted most-urgent first (priority ascending). */
export function coachInsights(input: CoachInput): Insight[] {
  const out: Insight[] = [];
  const g = input.goals;

  if (input.hour >= 18 && g.proteinG > 0 && input.todayProteinG < g.proteinG) {
    const gap = Math.round(g.proteinG - input.todayProteinG);
    out.push({
      id: 'protein_gap',
      priority: 2,
      message: `You're ${gap} g short on protein — a shake or 100 g paneer covers it.`,
      metric: `${Math.round(input.todayProteinG)}/${g.proteinG} g`,
    });
  }

  if (input.hour >= 18 && g.waterMl > 0 && input.todayWaterMl < g.waterMl) {
    const gap = Math.round((g.waterMl - input.todayWaterMl) / 50) * 50;
    out.push({
      id: 'water_gap',
      priority: 3,
      message: `Drink another ${gap} ml to hit your water goal.`,
      metric: `${input.todayWaterMl}/${g.waterMl} ml`,
    });
  }

  if (input.recent7WeightAvg !== null && input.prior7WeightAvg !== null) {
    const delta = input.recent7WeightAvg - input.prior7WeightAvg;
    if (delta >= 0.2 && delta <= 0.6) {
      out.push({
        id: 'weight_on_track',
        priority: 4,
        message: `Weight up ${delta.toFixed(1)} kg this week — right in the lean-gain zone.`,
        metric: `${signed(delta)} kg/wk`,
      });
    } else if (delta > 0.8 && input.daysOfWeightData >= 14) {
      out.push({
        id: 'weight_too_fast',
        priority: 2,
        message: `Gaining fast — trim ~150 kcal/day to keep it lean.`,
        metric: `${signed(delta)} kg/wk`,
      });
    } else if (Math.abs(delta) <= 0.1 && input.daysOfWeightData >= 14) {
      out.push({
        id: 'weight_stalled',
        priority: 2,
        message: `Weight's been flat 2 weeks. Add ~200 kcal/day and reassess.`,
        metric: `${signed(delta)} kg/wk`,
      });
    }
  }

  if (input.yesterdaySkippedLabel) {
    out.push({
      id: 'skipped_day',
      priority: 3,
      message: `You skipped ${input.yesterdaySkippedLabel} day. Slot it in today or tomorrow.`,
    });
  }

  if (input.weekWorkoutsTarget > 0 && input.weekWorkoutsDone >= input.weekWorkoutsTarget) {
    out.push({
      id: 'consistency_praise',
      priority: 4,
      message: `That's ${input.weekWorkoutsDone}/${input.weekWorkoutsTarget} sessions this week. Great consistency.`,
    });
  }

  const sleepAvg = mean(input.last3SleepH);
  if (sleepAvg !== null && g.sleepH > 0 && sleepAvg < g.sleepH - 1) {
    out.push({
      id: 'sleep_low',
      priority: 3,
      message: `Averaging ${sleepAvg.toFixed(1)} h sleep. Muscle grows when you rest.`,
      metric: `${sleepAvg.toFixed(1)} h avg`,
    });
  }

  const kcalAvg = mean(input.last3Kcal);
  if (kcalAvg !== null && g.calories > 0 && kcalAvg < g.calories * 0.85) {
    out.push({
      id: 'calories_low',
      priority: 2,
      message: `Eating well under target 3 days running — gaining needs fuel.`,
      metric: `${Math.round(kcalAvg)} kcal avg`,
    });
  }

  if (input.currentStreak >= 3 && !input.loggedToday && input.hour >= 20) {
    out.push({
      id: 'streak_risk',
      priority: 1,
      message: `Your ${input.currentStreak}-day streak is on the line — log anything today.`,
    });
  }

  if (input.newPr) {
    out.push({
      id: 'pr_congrats',
      priority: 4,
      message: `New PR on ${input.newPr.exercise}: ${input.newPr.weightKg} kg × ${input.newPr.reps}. Strong.`,
    });
  }

  if (input.consecutiveTrainingDays >= 6) {
    out.push({
      id: 'rest_reminder',
      priority: 2,
      message: `Six days straight — schedule a rest day, recovery is training too.`,
    });
  }

  return out.sort((a, b) => a.priority - b.priority);
}
