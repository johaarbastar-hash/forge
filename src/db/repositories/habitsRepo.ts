import { db, newId, nowIso } from '../db';
import type { DayKey, Habit, HabitLog } from '../../types';

export async function allHabits(): Promise<Habit[]> {
  return db.habits.toArray();
}

export async function activeHabits(): Promise<Habit[]> {
  return db.habits.filter((h) => h.isActive).toArray();
}

export async function addCustomHabit(name: string, icon: string): Promise<Habit> {
  const habit: Habit = {
    id: newId(),
    name,
    icon,
    target: 'daily',
    isActive: true,
    createdAt: nowIso(),
    updatedAt: nowIso(),
  };
  await db.habits.add(habit);
  return habit;
}

export async function setHabitActive(id: string, isActive: boolean): Promise<void> {
  await db.habits.update(id, { isActive, updatedAt: nowIso() });
}

export async function habitLogsByDay(dayKey: DayKey): Promise<HabitLog[]> {
  return db.habitLogs.where('dayKey').equals(dayKey).toArray();
}

export async function logsForHabit(habitId: string): Promise<HabitLog[]> {
  return db.habitLogs.where('habitId').equals(habitId).toArray();
}

/** Check/uncheck a habit for a day — one log row per (habit, day). */
export async function setHabitDone(habitId: string, dayKey: DayKey, done: boolean): Promise<void> {
  const existing = await db.habitLogs.where('[habitId+dayKey]').equals([habitId, dayKey]).first();
  if (existing) {
    await db.habitLogs.update(existing.id, { done, updatedAt: nowIso() });
    return;
  }
  await db.habitLogs.add({
    id: newId(),
    habitId,
    dayKey,
    done,
    createdAt: nowIso(),
    updatedAt: nowIso(),
  });
}
