import { db, newId, nowIso } from '../db';
import type { DayKey, WeightLog } from '../../types';

export async function weightByDay(dayKey: DayKey): Promise<WeightLog | undefined> {
  return db.weightLogs.where('dayKey').equals(dayKey).first();
}

/** One weigh-in per day — upsert semantics. */
export async function logWeight(dayKey: DayKey, kg: number): Promise<WeightLog> {
  const existing = await weightByDay(dayKey);
  if (existing) {
    const updated: WeightLog = { ...existing, kg, updatedAt: nowIso() };
    await db.weightLogs.put(updated);
    return updated;
  }
  const created: WeightLog = { id: newId(), dayKey, kg, createdAt: nowIso(), updatedAt: nowIso() };
  await db.weightLogs.add(created);
  return created;
}

export async function allWeightLogs(): Promise<WeightLog[]> {
  return db.weightLogs.orderBy('dayKey').toArray();
}

export async function latestWeight(): Promise<WeightLog | undefined> {
  return db.weightLogs.orderBy('dayKey').last();
}

export async function deleteWeight(dayKey: DayKey): Promise<void> {
  const existing = await weightByDay(dayKey);
  if (existing) await db.weightLogs.delete(existing.id);
}
