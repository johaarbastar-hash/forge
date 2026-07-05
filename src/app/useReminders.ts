import { useLiveQuery } from 'dexie-react-hooks';
import { useEffect, useRef } from 'react';

import { useToast } from '../components/Toast';
import { getSettings } from '../db/repositories/settingsRepo';
import { todayKey } from '../lib/dates';
import {
  isIntervalReminderDue,
  isTimeReminderDue,
  isWeeklyReminderDue,
  timeToMinutes,
} from '../lib/reminders';
import type { ReminderType } from '../types';

const FIRED_KEY = 'forge-reminders-fired';
const CHECK_MS = 30_000;

const MESSAGES: Record<ReminderType, string> = {
  water: 'Water break — top up toward your goal.',
  meals: 'Meal reminder — log what you ate.',
  workout: 'Workout time — today’s session is waiting.',
  sleep: 'Wind down — log your sleep and rest up.',
  weighIn: 'Weekly weigh-in — step on the scale.',
};

type FiredMap = Partial<Record<ReminderType, string | number>>;

function loadFired(): FiredMap {
  try {
    return JSON.parse(localStorage.getItem(FIRED_KEY) ?? '{}') as FiredMap;
  } catch {
    return {};
  }
}

/**
 * In-app reminders (SPEC §5.15): while Forge is open, fires a banner (toast) and
 * a Notification when permission is granted. Timing decisions come from the
 * tested pure helpers; last-fired state is persisted so a reminder fires once.
 */
export function useReminders() {
  const { showToast } = useToast();
  const settings = useLiveQuery(() => getSettings(), []);
  const firedRef = useRef<FiredMap>(loadFired());
  const seeded = useRef(false);

  useEffect(() => {
    if (!settings) return;
    const reminders = settings.reminders;

    // On first run, don't retro-fire today's already-passed times; start water intervals now.
    if (!seeded.current) {
      seeded.current = true;
      const now = new Date();
      const nowMin = now.getHours() * 60 + now.getMinutes();
      const today = todayKey(now);
      const fired = firedRef.current;
      (Object.keys(reminders) as ReminderType[]).forEach((type) => {
        const cfg = reminders[type];
        if (type === 'water') {
          if (fired.water === undefined) fired.water = now.getTime();
        } else if (cfg.time && nowMin >= timeToMinutes(cfg.time) && fired[type] === undefined) {
          fired[type] = today;
        }
      });
      localStorage.setItem(FIRED_KEY, JSON.stringify(fired));
    }

    const tick = () => {
      const now = new Date();
      const nowMs = now.getTime();
      const nowMin = now.getHours() * 60 + now.getMinutes();
      const today = todayKey(now);
      const fired = firedRef.current;
      let changed = false;

      const fire = (type: ReminderType, stamp: string | number) => {
        fired[type] = stamp;
        changed = true;
        showToast(MESSAGES[type], 'info');
        if (typeof Notification !== 'undefined' && Notification.permission === 'granted') {
          try {
            new Notification('Forge', { body: MESSAGES[type] });
          } catch {
            // notification construction can throw on some platforms — ignore
          }
        }
      };

      (Object.keys(reminders) as ReminderType[]).forEach((type) => {
        const cfg = reminders[type];
        if (!cfg.enabled) return;
        if (type === 'water') {
          const last = typeof fired.water === 'number' ? fired.water : nowMs;
          if (isIntervalReminderDue(cfg.intervalMin ?? 0, last, nowMs)) fire('water', nowMs);
        } else if (type === 'weighIn') {
          const last = typeof fired.weighIn === 'number' ? fired.weighIn : 0;
          if (cfg.time && isWeeklyReminderDue(cfg.time, last, nowMin, nowMs)) fire('weighIn', nowMs);
        } else if (cfg.time) {
          const last = typeof fired[type] === 'string' ? (fired[type] as string) : null;
          if (isTimeReminderDue(cfg.time, last, nowMin, today)) fire(type, today);
        }
      });

      if (changed) localStorage.setItem(FIRED_KEY, JSON.stringify(fired));
    };

    const id = setInterval(tick, CHECK_MS);
    return () => clearInterval(id);
  }, [settings, showToast]);
}
