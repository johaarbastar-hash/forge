import { db, newId, nowIso } from '../db';
import type { DayKey, WaterLog } from '../../types';

export async function waterLogsByDay(dayKey: DayKey): Promise<WaterLog[]> {
  return db.waterLogs.where('dayKey').equals(dayKey).sortBy('createdAt');
}

export async function waterTotalForDay(dayKey: DayKey): Promise<number> {
  const logs = await waterLogsByDay(dayKey);
  return logs.reduce((sum, l) => sum + l.ml, 0);
}

export async function addWater(dayKey: DayKey, ml: number, time: string): Promise<WaterLog> {
  const log: WaterLog = { id: newId(), dayKey, ml, time, createdAt: nowIso(), updatedAt: nowIso() };
  await db.waterLogs.add(log);
  return log;
}

/** Undo the most recent entry of the day (SPEC §5.4). */
export async function undoLastWater(dayKey: DayKey): Promise<WaterLog | undefined> {
  const logs = await waterLogsByDay(dayKey);
  const last = logs[logs.length - 1];
  if (last) await db.waterLogs.delete(last.id);
  return last;
}
