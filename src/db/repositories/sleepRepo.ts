import { db, newId, nowIso } from '../db';
import type { DayKey, SleepLog } from '../../types';

export async function sleepByDay(dayKey: DayKey): Promise<SleepLog | undefined> {
  return db.sleepLogs.where('dayKey').equals(dayKey).first();
}

/** One sleep entry per day — upsert semantics. */
export async function setSleep(dayKey: DayKey, hours: number, bedtime?: string): Promise<SleepLog> {
  const existing = await sleepByDay(dayKey);
  if (existing) {
    const updated: SleepLog = { ...existing, hours, updatedAt: nowIso() };
    if (bedtime !== undefined) updated.bedtime = bedtime;
    await db.sleepLogs.put(updated);
    return updated;
  }
  const created: SleepLog = {
    id: newId(),
    dayKey,
    hours,
    ...(bedtime !== undefined ? { bedtime } : {}),
    createdAt: nowIso(),
    updatedAt: nowIso(),
  };
  await db.sleepLogs.add(created);
  return created;
}

export async function allSleepLogs(): Promise<SleepLog[]> {
  return db.sleepLogs.orderBy('dayKey').toArray();
}
