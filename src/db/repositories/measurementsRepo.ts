import { db, newId, nowIso } from '../db';
import type { DayKey, Measurement, Timestamps } from '../../types';

export async function allMeasurements(): Promise<Measurement[]> {
  return db.measurements.orderBy('dayKey').toArray();
}

export async function addMeasurement(
  data: Omit<Measurement, 'id' | keyof Timestamps>,
): Promise<Measurement> {
  const row: Measurement = { ...data, id: newId(), createdAt: nowIso(), updatedAt: nowIso() };
  await db.measurements.add(row);
  return row;
}

export async function updateMeasurement(
  id: string,
  data: Partial<Omit<Measurement, 'id' | keyof Timestamps>>,
): Promise<void> {
  await db.measurements.update(id, { ...data, updatedAt: nowIso() });
}

export async function deleteMeasurement(id: string): Promise<void> {
  await db.measurements.delete(id);
}

export async function measurementsByDay(dayKey: DayKey): Promise<Measurement[]> {
  return db.measurements.where('dayKey').equals(dayKey).toArray();
}
