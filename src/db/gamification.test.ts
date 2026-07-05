import 'fake-indexeddb/auto';

import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import { db } from './db';
import { evaluateProteinGoal, evaluateWaterGoal } from './repositories/awardsRepo';
import { evaluateAchievements, evaluateDay } from './repositories/gamificationRepo';
import { saveGoals } from './repositories/goalsRepo';
import { addMeal } from './repositories/mealsRepo';
import { saveProfile } from './repositories/profileRepo';
import { addWater } from './repositories/waterRepo';
import { logWeight } from './repositories/weightRepo';
import { createWorkout, updateWorkout } from './repositories/workoutsRepo';
import { newId, nowIso } from './db';

async function seedGoals() {
  await saveProfile({ startWeightKg: 60, splitId: 'split-ppl', onboarded: true });
  await saveGoals(
    { calories: 2750, proteinG: 110, waterMl: 3000, sleepH: 8, workoutsPerWeek: 6, weightKg: 68 },
    '2026-06-01',
  );
}

beforeEach(async () => {
  await db.delete();
  await db.open();
  await seedGoals();
});

afterEach(() => {
  db.close();
});

describe('STREAK_DAY (consecutive day with any log)', () => {
  it('awards only when the previous day also has a log; idempotent', async () => {
    await addWater('2026-07-04', 500, '10:00');
    await addWater('2026-07-05', 500, '10:00');
    // 07-04 has no prior-day log → no streak award
    expect((await evaluateDay('2026-07-04')).streakAwarded).toBe(false);
    // 07-05 continues from 07-04 → award
    expect((await evaluateDay('2026-07-05')).streakAwarded).toBe(true);
    expect((await evaluateDay('2026-07-05')).streakAwarded).toBe(false); // idempotent
    const streaks = (await db.xpEvents.toArray()).filter((e) => e.type === 'STREAK_DAY');
    expect(streaks).toHaveLength(1);
    expect(streaks[0]?.amount).toBe(15);
  });
});

describe('ALL_MISSIONS_DONE', () => {
  it('awards +30 once when every applicable mission is done', async () => {
    const day = '2026-06-01'; // Monday = a PPL Push training day
    // protein: chicken 300g (93) + whey 30g×... need ≥110
    await addMeal({
      dayKey: day,
      category: 'lunch',
      items: [
        { foodId: 'food-chicken', grams: 300 },
        { foodId: 'food-paneer', grams: 100 },
        { foodId: 'food-whey', grams: 30 },
      ],
      time: '13:00',
    });
    await evaluateProteinGoal(day);
    // water ≥ 3000
    await addWater(day, 3000, '12:00');
    await evaluateWaterGoal(day);
    // sleep ≥ 8
    await db.sleepLogs.add({ id: newId(), dayKey: day, hours: 8, createdAt: nowIso(), updatedAt: nowIso() });
    // workout completed (training day requires it)
    const w = await createWorkout({ dayKey: day, splitDay: 'Push', entries: [{ exerciseId: 'ex-bench-press', sets: [{ reps: 8, weightKg: 60 }] }] });
    await updateWorkout(w.id, { completed: true });

    const res = await evaluateDay(day);
    expect(res.allMissionsAwarded).toBe(true);
    expect((await evaluateDay(day)).allMissionsAwarded).toBe(false); // idempotent
    const events = (await db.xpEvents.toArray()).filter((e) => e.type === 'ALL_MISSIONS_DONE');
    expect(events).toHaveLength(1);
    expect(events[0]?.amount).toBe(30);
  });

  it('does not award when a training day has no workout', async () => {
    const day = '2026-06-01';
    await addMeal({ dayKey: day, category: 'lunch', items: [{ foodId: 'food-chicken', grams: 400 }], time: '13:00' });
    await evaluateProteinGoal(day);
    await addWater(day, 3000, '12:00');
    await evaluateWaterGoal(day);
    await db.sleepLogs.add({ id: newId(), dayKey: day, hours: 8, createdAt: nowIso(), updatedAt: nowIso() });
    expect((await evaluateDay(day)).allMissionsAwarded).toBe(false);
  });
});

describe('achievement unlocks', () => {
  it('unlocks first_workout + first_chest_day once and never re-fires', async () => {
    const w = await createWorkout({
      dayKey: '2026-06-01',
      splitDay: 'Push',
      entries: [{ exerciseId: 'ex-bench-press', sets: [{ reps: 8, weightKg: 60 }] }],
    });
    await updateWorkout(w.id, { completed: true });

    const first = await evaluateAchievements('2026-06-01');
    expect(first).toContain('first_workout');
    expect(first).toContain('first_chest_day');
    // replay never re-fires
    expect(await evaluateAchievements('2026-06-02')).toEqual([]);
    expect(await db.achievementUnlocks.count()).toBe(first.length);
  });

  it('unlocks gain_1kg only at start + 1.0 kg', async () => {
    await logWeight('2026-06-10', 60.5);
    expect(await evaluateAchievements('2026-06-10')).not.toContain('gain_1kg');
    await logWeight('2026-06-20', 61.2);
    expect(await evaluateAchievements('2026-06-20')).toContain('gain_1kg');
  });
});
