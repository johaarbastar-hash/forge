import { useLiveQuery } from 'dexie-react-hooks';
import { useEffect, useRef } from 'react';

import { db } from '../db/db';
import { evaluateAchievements, evaluateDay } from '../db/repositories/gamificationRepo';
import { todayKey } from '../lib/dates';
import { levelForXp } from '../lib/xp';
import { useCelebrations } from '../stores/celebrations';

const LAST_LEVEL_KEY = 'forge-last-level';

/**
 * Single global watcher: whenever any tracked data changes it awards the
 * day-level XP (STREAK_DAY / ALL_MISSIONS_DONE), unlocks newly-earned
 * achievements, and queues a full-screen celebration for level-ups and first
 * unlocks. Mounted once in the app shell. All awards are idempotent, so the
 * write-back that this triggers settles without looping.
 */
export function useGamification() {
  const enqueue = useCelebrations((s) => s.enqueue);
  const running = useRef(false);

  // A compact signal that changes on any relevant write (incl. in-place edits).
  const signal = useLiveQuery(async () => {
    const [meals, water, sleep, weight, workouts, habitDone, xp, unlocks] = await Promise.all([
      db.meals.toArray(),
      db.waterLogs.toArray(),
      db.sleepLogs.toArray(),
      db.weightLogs.toArray(),
      db.workouts.toArray(),
      db.habitLogs.filter((h) => h.done).count(),
      db.xpEvents.toArray(),
      db.achievementUnlocks.count(),
    ]);
    const proteinSum = meals.reduce((s, m) => s + m.cachedMacros.proteinG, 0);
    const waterSum = water.reduce((s, w) => s + w.ml, 0);
    const sleepSum = sleep.reduce((s, l) => s + l.hours, 0);
    const weightSum = weight.reduce((s, l) => s + l.kg, 0);
    const workoutSig = workouts.reduce(
      (s, w) => s + (w.completed ? 1 : 0) + w.entries.reduce((n, e) => n + e.sets.length, 0),
      0,
    );
    const xpTotal = xp.reduce((s, e) => s + e.amount, 0);
    return [proteinSum, waterSum, sleepSum, weightSum, workoutSig, habitDone, xpTotal, unlocks].join(':');
  }, []);

  useEffect(() => {
    if (signal === undefined || running.current) return;
    running.current = true;
    void (async () => {
      try {
        const today = todayKey();
        await evaluateDay(today);
        const fired = await evaluateAchievements(today);

        // level-up after any XP the evaluations may have added
        const xpTotal = (await db.xpEvents.toArray()).reduce((s, e) => s + e.amount, 0);
        const level = levelForXp(xpTotal);
        const storedRaw = localStorage.getItem(LAST_LEVEL_KEY);
        if (storedRaw === null) {
          localStorage.setItem(LAST_LEVEL_KEY, String(level));
        } else {
          const last = Number(storedRaw);
          if (level > last) {
            localStorage.setItem(LAST_LEVEL_KEY, String(level));
            enqueue({ kind: 'level', level });
          }
        }

        for (const id of fired) enqueue({ kind: 'achievement', id });
      } finally {
        running.current = false;
      }
    })();
  }, [signal, enqueue]);
}
