import { getSplitTemplate } from '../../data/splits';
import {
  consistencyScore,
  healthScore,
  hydrationScore,
  nutritionScore,
  recoveryScore,
  trackedAverage,
  weightGainRatePerWeek,
} from '../../lib/analytics';
import type { CoachInput } from '../../lib/coach';
import { addDaysToKey, lastNDayKeys, toDayKey, weekKeys, weekStartKey, weekdayOf } from '../../lib/dates';
import { daysInMonth } from '../../features/calendar/calendarGrid';
import { historyByExercise } from '../../lib/workoutHistory';
import { bestE1rm, bestWeight } from '../../lib/e1rm';
import { currentStreak } from '../../lib/streaks';
import type { DayKey, Goals } from '../../types';
import { db } from '../db';
import { collectAnyLogDays } from './gamificationRepo';
import { getGoals } from './goalsRepo';
import { getProfile } from './profileRepo';

type DayMaps = {
  kcal: Map<DayKey, number>;
  protein: Map<DayKey, number>;
  water: Map<DayKey, number>;
  sleep: Map<DayKey, number>;
  weight: Map<DayKey, number>;
  completedWorkoutDays: Set<DayKey>;
};

async function mapsForDays(days: DayKey[]): Promise<DayMaps> {
  const set = new Set(days);
  const [meals, water, sleep, weight, workouts] = await Promise.all([
    db.meals.where('dayKey').anyOf(days).toArray(),
    db.waterLogs.where('dayKey').anyOf(days).toArray(),
    db.sleepLogs.where('dayKey').anyOf(days).toArray(),
    db.weightLogs.where('dayKey').anyOf(days).toArray(),
    db.workouts.where('dayKey').anyOf(days).toArray(),
  ]);
  const kcal = new Map<DayKey, number>();
  const protein = new Map<DayKey, number>();
  for (const m of meals) {
    kcal.set(m.dayKey, (kcal.get(m.dayKey) ?? 0) + m.cachedMacros.kcal);
    protein.set(m.dayKey, (protein.get(m.dayKey) ?? 0) + m.cachedMacros.proteinG);
  }
  const waterMap = new Map<DayKey, number>();
  for (const w of water) waterMap.set(w.dayKey, (waterMap.get(w.dayKey) ?? 0) + w.ml);
  const sleepMap = new Map<DayKey, number>();
  for (const s of sleep) sleepMap.set(s.dayKey, s.hours);
  const weightMap = new Map<DayKey, number>();
  for (const w of weight) if (set.has(w.dayKey)) weightMap.set(w.dayKey, w.kg);
  return {
    kcal,
    protein,
    water: waterMap,
    sleep: sleepMap,
    weight: weightMap,
    completedWorkoutDays: new Set(workouts.filter((w) => w.completed).map((w) => w.dayKey)),
  };
}

// ---- Reports (SPEC §5.10) ----

export type ReportPeriod = 'week' | 'month';

export type ReportMetric = { key: string; label: string; value: number | null; unit: string; delta: number | null };
export type ReportScore = { key: string; label: string; value: number };

export type Report = {
  periodLabel: string;
  metrics: ReportMetric[];
  scores: ReportScore[];
  healthDelta: number | null;
};

function periodDays(period: ReportPeriod, today: DayKey): { current: DayKey[]; previous: DayKey[]; label: string } {
  if (period === 'week') {
    const start = weekStartKey(today);
    const prevStart = addDaysToKey(start, -7);
    return {
      current: weekKeys(today),
      previous: Array.from({ length: 7 }, (_, i) => addDaysToKey(prevStart, i)),
      label: 'This week',
    };
  }
  const [y, m] = today.split('-').map(Number);
  const year = y ?? 2026;
  const month = m ?? 1;
  const dim = daysInMonth(year, month);
  const current = Array.from({ length: dim }, (_, i) => `${today.slice(0, 8)}${String(i + 1).padStart(2, '0')}`);
  const prevMonthLast = addDaysToKey(current[0]!, -1);
  const [py, pm] = prevMonthLast.split('-').map(Number);
  const pdim = daysInMonth(py ?? year, pm ?? month);
  const previous = Array.from(
    { length: pdim },
    (_, i) => `${prevMonthLast.slice(0, 8)}${String(i + 1).padStart(2, '0')}`,
  );
  return { current, previous, label: 'This month' };
}

function periodScores(days: DayKey[], maps: DayMaps, goals: Pick<Goals, 'calories' | 'proteinG' | 'waterMl' | 'sleepH' | 'workoutsPerWeek'>) {
  const nutritionDays = days
    .filter((d) => maps.kcal.has(d) || maps.protein.has(d))
    .map((d) => ({
      kcal: maps.kcal.get(d) ?? null,
      proteinG: maps.protein.get(d) ?? null,
      kcalGoal: goals.calories,
      proteinGoal: goals.proteinG,
    }));
  const workoutsDone = days.filter((d) => maps.completedWorkoutDays.has(d)).length;
  const planned = Math.max(1, Math.round((goals.workoutsPerWeek * days.length) / 7));
  const avgSleep = trackedAverage(days.map((d) => maps.sleep.get(d) ?? null));
  const avgWater = trackedAverage(days.map((d) => maps.water.get(d) ?? null));
  const hadRestDay = days.some((d) => !maps.completedWorkoutDays.has(d));

  const nutrition = nutritionScore(nutritionDays);
  const consistency = consistencyScore(workoutsDone, planned);
  const recovery = recoveryScore(avgSleep, goals.sleepH, hadRestDay);
  const hydration = hydrationScore(avgWater, goals.waterMl);
  return {
    nutrition,
    consistency,
    recovery,
    hydration,
    health: healthScore(nutrition, consistency, recovery, hydration),
  };
}

export async function buildReport(period: ReportPeriod, today: DayKey): Promise<Report> {
  const goals = await getGoals();
  const { current, previous, label } = periodDays(period, today);
  const [cur, prev] = await Promise.all([mapsForDays(current), mapsForDays(previous)]);
  const g = goals ?? { calories: 0, proteinG: 0, waterMl: 0, sleepH: 0, workoutsPerWeek: 0 };

  const avg = (maps: DayMaps, days: DayKey[], pick: (m: DayMaps) => Map<DayKey, number>) =>
    trackedAverage(days.map((d) => pick(maps).get(d) ?? null));

  const curKcal = avg(cur, current, (m) => m.kcal);
  const prevKcal = avg(prev, previous, (m) => m.kcal);
  const curProt = avg(cur, current, (m) => m.protein);
  const prevProt = avg(prev, previous, (m) => m.protein);
  const curWater = avg(cur, current, (m) => m.water);
  const prevWater = avg(prev, previous, (m) => m.water);
  const curSleep = avg(cur, current, (m) => m.sleep);
  const prevSleep = avg(prev, previous, (m) => m.sleep);

  const delta = (a: number | null, b: number | null) => (a !== null && b !== null ? a - b : null);

  // weight-gain rate over the period (with leading context so windows are full)
  const weightDays = lastNDayKeys(current.at(-1) ?? today, current.length + 7);
  const wMaps = await mapsForDays(weightDays);
  const gainRate = weightGainRatePerWeek(weightDays.map((d) => wMaps.weight.get(d) ?? null));

  const curScores = periodScores(current, cur, g);
  const prevScores = periodScores(previous, prev, g);

  const metrics: ReportMetric[] = [
    { key: 'kcal', label: 'Avg calories', value: curKcal, unit: 'kcal', delta: delta(curKcal, prevKcal) },
    { key: 'protein', label: 'Avg protein', value: curProt, unit: 'g', delta: delta(curProt, prevProt) },
    { key: 'water', label: 'Avg water', value: curWater, unit: 'ml', delta: delta(curWater, prevWater) },
    { key: 'sleep', label: 'Avg sleep', value: curSleep, unit: 'h', delta: delta(curSleep, prevSleep) },
    {
      key: 'consistency',
      label: 'Workout consistency',
      value: curScores.consistency,
      unit: '%',
      delta: delta(curScores.consistency, prevScores.consistency),
    },
    { key: 'gain', label: 'Weight-gain rate', value: gainRate, unit: 'kg/wk', delta: null },
  ];

  const scores: ReportScore[] = [
    { key: 'nutrition', label: 'Nutrition', value: Math.round(curScores.nutrition) },
    { key: 'consistency', label: 'Consistency', value: Math.round(curScores.consistency) },
    { key: 'recovery', label: 'Recovery', value: Math.round(curScores.recovery) },
    { key: 'hydration', label: 'Hydration', value: Math.round(curScores.hydration) },
    { key: 'health', label: 'Health', value: Math.round(curScores.health) },
  ];

  return { periodLabel: label, metrics, scores, healthDelta: delta(curScores.health, prevScores.health) };
}

// ---- Coach input (SPEC §5.12) ----

export async function buildCoachInput(now: Date): Promise<CoachInput | null> {
  const goals = await getGoals();
  if (!goals) return null;
  const profile = await getProfile();
  const today = toDayKey(now);
  const days14 = lastNDayKeys(today, 14);

  const [maps, anyLogDays, workouts, exercises] = await Promise.all([
    mapsForDays(days14),
    collectAnyLogDays(),
    db.workouts.toArray(),
    db.exercises.toArray(),
  ]);
  const exName = new Map(exercises.map((e) => [e.id, e.name]));

  const yesterday = addDaysToKey(today, -1);
  const last3 = [addDaysToKey(today, -2), yesterday, today];

  // weight averages: recent 7 vs prior 7 (tracked)
  const recent7 = lastNDayKeys(today, 7);
  const prior7 = Array.from({ length: 7 }, (_, i) => addDaysToKey(recent7[0]!, i - 7));
  const recent7WeightAvg = trackedAverage(recent7.map((d) => maps.weight.get(d) ?? null));
  const prior7WeightAvg = trackedAverage(prior7.map((d) => maps.weight.get(d) ?? null));
  const daysOfWeightData = days14.filter((d) => maps.weight.has(d)).length;

  // yesterday skipped?
  const yPlan = profile ? getSplitTemplate(profile.splitId)?.schedule[weekdayOf(yesterday)] : undefined;
  const yWasTraining = !!yPlan && 'exerciseIds' in yPlan;
  const yesterdaySkippedLabel =
    yWasTraining && !maps.completedWorkoutDays.has(yesterday) && yPlan && 'label' in yPlan
      ? yPlan.label
      : null;

  // week workouts
  const week = new Set(weekKeys(today));
  const weekWorkoutsDone = [...maps.completedWorkoutDays].filter((d) => week.has(d)).length;

  // consecutive training (completed) days ending today or yesterday
  const completedSet = maps.completedWorkoutDays;
  let cursor = completedSet.has(today) ? today : yesterday;
  let consecutiveTrainingDays = 0;
  while (completedSet.has(cursor)) {
    consecutiveTrainingDays += 1;
    cursor = addDaysToKey(cursor, -1);
  }

  // a PR this week: latest completed session that beat prior bests
  let newPr: CoachInput['newPr'] = null;
  const completed = workouts.filter((w) => w.completed);
  for (const w of completed.filter((x) => week.has(x.dayKey)).sort((a, b) => b.dayKey.localeCompare(a.dayKey))) {
    for (const entry of w.entries) {
      const prior = historyByExercise(completed.filter((x) => x.dayKey < w.dayKey));
      const prev = prior.get(entry.exerciseId) ?? { bestWeightKg: 0, bestE1rm: 0, lastSets: [] };
      if (bestWeight(entry.sets) > prev.bestWeightKg + 1e-9 || bestE1rm(entry.sets) > prev.bestE1rm + 1e-9) {
        const top = [...entry.sets].sort((a, b) => b.weightKg - a.weightKg)[0];
        if (top) {
          newPr = { exercise: exName.get(entry.exerciseId) ?? 'Exercise', weightKg: top.weightKg, reps: top.reps };
          break;
        }
      }
    }
    if (newPr) break;
  }

  return {
    hour: now.getHours(),
    today,
    goals,
    todayProteinG: maps.protein.get(today) ?? 0,
    todayWaterMl: maps.water.get(today) ?? 0,
    loggedToday: anyLogDays.has(today),
    currentStreak: currentStreak(anyLogDays, today),
    last3SleepH: last3.map((d) => maps.sleep.get(d) ?? null),
    last3Kcal: last3.map((d) => maps.kcal.get(d) ?? null),
    recent7WeightAvg,
    prior7WeightAvg,
    daysOfWeightData,
    yesterdaySkippedLabel,
    weekWorkoutsDone,
    weekWorkoutsTarget: goals.workoutsPerWeek,
    newPr,
    consecutiveTrainingDays,
  };
}
