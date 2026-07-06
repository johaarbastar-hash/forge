import { getSplitTemplate } from '../data/splits';
import { addDaysToKey, todayKey, weekdayOf } from '../lib/dates';
import type { MealItem, WorkoutEntry } from '../types';
import { db, newId, nowIso } from './db';
import {
  awardWeightLogged,
  awardWorkoutCompleted,
  evaluateProteinGoal,
  evaluateSleepGoal,
  evaluateWaterGoal,
} from './repositories/awardsRepo';
import {
  collectAnyLogDays,
  evaluateAchievements,
  evaluateDay,
} from './repositories/gamificationRepo';
import { getProfile } from './repositories/profileRepo';

const DEMO_DAYS = 30;

// Log tables cleared before regenerating; definitions/profile/goals are kept.
const LOG_TABLES = [
  'meals',
  'waterLogs',
  'sleepLogs',
  'weightLogs',
  'workouts',
  'measurements',
  'photos',
  'habitLogs',
  'dayNotes',
  'xpEvents',
  'achievementUnlocks',
] as const;

const rand = (min: number, max: number) => min + Math.random() * (max - min);
const jitter = (base: number, spread: number) => base + (Math.random() - 0.5) * 2 * spread;

/** A plausible day of meals from seed foods, quantities jittered per day. */
const g = (foodId: string, grams: number): MealItem => ({ foodId, grams: Math.round(grams) });
const pick = <T,>(arr: T[]): T => arr[Math.floor(Math.random() * arr.length)]!;

// Rotating meal options per category so 30 days of demo data look varied while
// each day still lands near a ~2750 kcal / ~120 g protein gaining target.
const BREAKFASTS: (() => MealItem[])[] = [
  () => [g('food-oats', jitter(70, 8)), g('food-milk', 250), g('food-banana', 120), g('food-peanut-butter', 24)],
  () => [g('food-poha', jitter(150, 20)), g('food-curd', 150), g('food-banana', 120)],
  () => [g('food-idli', 120), g('food-moong-dal', jitter(150, 20)), g('food-peanuts', 20)],
  () => [g('food-dosa', 160), g('food-dal', 120), g('food-curd', 150)],
  () => [g('food-muesli', jitter(45, 8)), g('food-milk', 250), g('food-apple', 180)],
];
const LUNCHES: (() => MealItem[])[] = [
  () => [g('food-rice', jitter(250, 30)), g('food-dal', 150), g('food-chicken', jitter(180, 25))],
  () => [g('food-brown-rice', jitter(200, 25)), g('food-rajma', 150), g('food-curd', 150)],
  () => [g('food-rice', jitter(200, 25)), g('food-chole', 150), g('food-paneer', jitter(70, 15))],
  () => [g('food-rice', jitter(200, 25)), g('food-fish-rohu', jitter(150, 20)), g('food-moong-dal', 150)],
];
const DINNERS: (() => MealItem[])[] = [
  () => [g('food-roti', 160), g('food-paneer', jitter(80, 15)), g('food-curd', 150)],
  () => [g('food-roti', 120), g('food-soya-chunks', jitter(40, 8)), g('food-sweet-potato', jitter(150, 20))],
  () => [g('food-rice', 150), g('food-chicken-thigh', jitter(150, 20)), g('food-dal', 150)],
  () => [g('food-roti', 160), g('food-rajma', 150), g('food-tofu', jitter(100, 20))],
];
const POSTWORKOUTS: (() => MealItem[])[] = [
  () => [g('food-whey', 30), g('food-dry-fruits', jitter(35, 8))],
  () => [g('food-whey', 30), g('food-banana', 120)],
];
const SNACKS: (() => MealItem[])[] = [
  () => [g('food-banana', 120), g('food-sattu', jitter(30, 6))],
  () => [g('food-greek-yogurt', 150), g('food-almonds', 30)],
  () => [g('food-peanuts', 30), g('food-apple', 180)],
];

function mealsForDay(): MealItem[][] {
  return [pick(BREAKFASTS)(), pick(LUNCHES)(), pick(DINNERS)(), pick(POSTWORKOUTS)(), pick(SNACKS)()];
}

const MEAL_CATEGORIES = ['breakfast', 'lunch', 'dinner', 'postWorkout', 'snack'] as const;
const MEAL_TIMES = ['08:00', '13:00', '20:00', '17:00', '16:00'];

function workoutEntriesFor(exerciseIds: string[], progress: number): WorkoutEntry[] {
  return exerciseIds.map((exerciseId) => {
    // base weight grows slightly over the block; three sets
    const base = Math.round((40 + progress * 15) / 2.5) * 2.5;
    return {
      exerciseId,
      sets: [
        { reps: 8, weightKg: base },
        { reps: 8, weightKg: base },
        { reps: Math.round(rand(6, 10)), weightKg: base + 2.5 },
      ],
    };
  });
}

/**
 * Populate ~30 days of plausible logs so charts, analytics and gamification are
 * exercisable (SPEC §5.17). Idempotent-ish: clears log tables first, keeps the
 * user's profile/goals/definitions. Awards XP via the same evaluators the app
 * uses, so streaks and level reflect the generated data.
 */
export async function loadDemoData(): Promise<void> {
  const profile = await getProfile();
  const startWeight = profile?.startWeightKg ?? 60;
  const split = getSplitTemplate(profile?.splitId ?? 'split-ppl');
  const now = todayKey();

  await db.transaction('rw', LOG_TABLES.map((t) => db.table(t)), async () => {
    await Promise.all(LOG_TABLES.map((t) => db.table(t).clear()));
  });

  const habits = await db.habits.toArray();

  for (let i = DEMO_DAYS - 1; i >= 0; i--) {
    const day = addDaysToKey(now, -i);
    const dayIndex = DEMO_DAYS - 1 - i; // 0 = oldest
    const ts = nowIso();

    // weight: +0.3 kg/week trend + noise
    const weight = Math.round((startWeight + 0.3 * (dayIndex / 7) + jitter(0, 0.25)) * 10) / 10;
    await db.weightLogs.add({ id: newId(), dayKey: day, kg: weight, createdAt: ts, updatedAt: ts });

    // water 2.0–3.5 L across a couple of logs
    const waterTotal = Math.round(rand(2000, 3500) / 250) * 250;
    await db.waterLogs.bulkAdd([
      { id: newId(), dayKey: day, ml: Math.round(waterTotal * 0.6), time: '10:00', createdAt: ts, updatedAt: ts },
      { id: newId(), dayKey: day, ml: waterTotal - Math.round(waterTotal * 0.6), time: '18:00', createdAt: ts, updatedAt: ts },
    ]);

    // sleep 6.5–8.5 h
    const sleepH = Math.round(rand(6.5, 8.5) * 2) / 2;
    await db.sleepLogs.add({ id: newId(), dayKey: day, hours: sleepH, bedtime: '23:00', createdAt: ts, updatedAt: ts });

    // meals
    const template = mealsForDay();
    for (let m = 0; m < template.length; m++) {
      const items = template[m] ?? [];
      const foods = await db.foods.bulkGet(items.map((it) => it.foodId));
      const byId = new Map(foods.filter(Boolean).map((f) => [f!.id, f!]));
      const macros = items.reduce(
        (acc, it) => {
          const food = byId.get(it.foodId);
          if (!food) return acc;
          const factor = food.unit === 'piece' ? it.grams / (food.pieceGrams ?? 100) : it.grams / 100;
          return {
            kcal: acc.kcal + food.per100.kcal * factor,
            proteinG: acc.proteinG + food.per100.proteinG * factor,
            carbsG: acc.carbsG + food.per100.carbsG * factor,
            fatG: acc.fatG + food.per100.fatG * factor,
            fiberG: acc.fiberG + food.per100.fiberG * factor,
          };
        },
        { kcal: 0, proteinG: 0, carbsG: 0, fatG: 0, fiberG: 0 },
      );
      await db.meals.add({
        id: newId(),
        dayKey: day,
        category: MEAL_CATEGORIES[m] ?? 'snack',
        items,
        cachedMacros: {
          kcal: Math.round(macros.kcal),
          proteinG: Math.round(macros.proteinG * 10) / 10,
          carbsG: Math.round(macros.carbsG * 10) / 10,
          fatG: Math.round(macros.fatG * 10) / 10,
          fiberG: Math.round(macros.fiberG * 10) / 10,
        },
        time: MEAL_TIMES[m] ?? '12:00',
        createdAt: ts,
        updatedAt: ts,
      });
    }

    // workout on scheduled training days (skip ~1 in 6 to look human)
    const plan = split?.schedule[weekdayOf(day)];
    if (plan && 'exerciseIds' in plan && Math.random() > 0.15) {
      await db.workouts.add({
        id: newId(),
        dayKey: day,
        splitDay: plan.label,
        entries: workoutEntriesFor(plan.exerciseIds, dayIndex / 7),
        durationMin: Math.round(rand(40, 65)),
        notes: '',
        completed: true,
        createdAt: ts,
        updatedAt: ts,
      });
      await awardWorkoutCompleted(day);
    }

    // measurements every 7 days
    if (dayIndex % 7 === 0) {
      await db.measurements.add({
        id: newId(),
        dayKey: day,
        chestCm: Math.round(jitter(98 + dayIndex * 0.05, 0.5) * 10) / 10,
        waistCm: Math.round(jitter(80 - dayIndex * 0.02, 0.5) * 10) / 10,
        armCm: Math.round(jitter(34 + dayIndex * 0.03, 0.3) * 10) / 10,
        thighCm: Math.round(jitter(56 + dayIndex * 0.03, 0.4) * 10) / 10,
        createdAt: ts,
        updatedAt: ts,
      });
    }

    // habit check-offs (most habits, most days)
    for (const habit of habits) {
      if (Math.random() > 0.25) {
        await db.habitLogs.add({
          id: newId(),
          habitId: habit.id,
          dayKey: day,
          done: true,
          createdAt: ts,
          updatedAt: ts,
        });
      }
    }

    // day note + mood occasionally
    if (Math.random() > 0.7) {
      await db.dayNotes.add({
        id: newId(),
        dayKey: day,
        note: 'Solid day.',
        mood: (Math.round(rand(3, 5)) as 3 | 4 | 5),
        createdAt: ts,
        updatedAt: ts,
      });
    }

    // XP for goal hits, using the real evaluators
    await Promise.all([
      evaluateProteinGoal(day),
      evaluateWaterGoal(day),
      evaluateSleepGoal(day),
      awardWeightLogged(day),
    ]);
  }

  // Day-level XP (STREAK_DAY / ALL_MISSIONS_DONE) once all logs exist, then
  // unlock achievements silently (the live watcher won't re-fire them).
  const anyLogDays = await collectAnyLogDays();
  for (let i = DEMO_DAYS - 1; i >= 0; i--) {
    await evaluateDay(addDaysToKey(now, -i), anyLogDays);
  }
  await evaluateAchievements(now);
}
