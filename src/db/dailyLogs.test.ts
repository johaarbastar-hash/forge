import 'fake-indexeddb/auto';

import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import { db } from './db';
import {
  awardWeightLogged,
  evaluateSleepGoal,
  evaluateWaterGoal,
} from './repositories/awardsRepo';
import { saveGoals } from './repositories/goalsRepo';
import { addWater, undoLastWater, waterTotalForDay } from './repositories/waterRepo';
import { setSleep } from './repositories/sleepRepo';
import { logWeight } from './repositories/weightRepo';

beforeEach(async () => {
  await db.delete();
  await db.open();
  await saveGoals(
    { calories: 2750, proteinG: 110, waterMl: 3000, sleepH: 8, workoutsPerWeek: 6, weightKg: 68 },
    '2026-07-01',
  );
});

afterEach(() => {
  db.close();
});

describe('water logging + WATER_GOAL_HIT', () => {
  it('sums intake and undoes the last entry', async () => {
    await addWater('2026-07-04', 500, '09:00');
    await addWater('2026-07-04', 750, '12:00');
    expect(await waterTotalForDay('2026-07-04')).toBe(1250);
    await undoLastWater('2026-07-04');
    expect(await waterTotalForDay('2026-07-04')).toBe(500);
  });

  it('awards once when the day crosses the water goal', async () => {
    await addWater('2026-07-04', 1000, '09:00');
    expect(await evaluateWaterGoal('2026-07-04')).toBe(false); // 1000 < 3000
    await addWater('2026-07-04', 1000, '12:00');
    await addWater('2026-07-04', 1000, '18:00');
    expect(await evaluateWaterGoal('2026-07-04')).toBe(true); // 3000 ≥ 3000
    expect(await evaluateWaterGoal('2026-07-04')).toBe(false); // idempotent
    const events = (await db.xpEvents.toArray()).filter((e) => e.type === 'WATER_GOAL_HIT');
    expect(events).toHaveLength(1);
    expect(events[0]?.amount).toBe(20);
  });
});

describe('sleep logging + SLEEP_GOAL_HIT', () => {
  it('upserts one entry per day and awards at/above goal', async () => {
    await setSleep('2026-07-04', 6.5, '23:30');
    expect(await evaluateSleepGoal('2026-07-04')).toBe(false); // 6.5 < 8
    await setSleep('2026-07-04', 8, '22:30'); // corrected same-day entry
    expect(await db.sleepLogs.where('dayKey').equals('2026-07-04').count()).toBe(1);
    expect(await evaluateSleepGoal('2026-07-04')).toBe(true);
    expect(await evaluateSleepGoal('2026-07-04')).toBe(false); // idempotent
    expect((await db.xpEvents.toArray()).filter((e) => e.type === 'SLEEP_GOAL_HIT')).toHaveLength(1);
  });
});

describe('weight logging + WEIGHT_LOGGED', () => {
  it('upserts per day and awards once', async () => {
    await logWeight('2026-07-04', 60.2);
    expect(await awardWeightLogged('2026-07-04')).toBe(true);
    await logWeight('2026-07-04', 60.4); // correction, same day
    expect(await awardWeightLogged('2026-07-04')).toBe(false); // idempotent
    expect(await db.weightLogs.where('dayKey').equals('2026-07-04').count()).toBe(1);
    const events = (await db.xpEvents.toArray()).filter((e) => e.type === 'WEIGHT_LOGGED');
    expect(events).toHaveLength(1);
    expect(events[0]?.amount).toBe(10);
  });
});
