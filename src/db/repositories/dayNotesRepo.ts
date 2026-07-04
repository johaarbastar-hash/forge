import { db, newId, nowIso } from '../db';
import type { DayKey, DayNote } from '../../types';

export async function noteByDay(dayKey: DayKey): Promise<DayNote | undefined> {
  return db.dayNotes.where('dayKey').equals(dayKey).first();
}

/** One note+mood per day — upsert semantics. */
export async function setDayNote(
  dayKey: DayKey,
  note: string,
  mood: DayNote['mood'],
): Promise<DayNote> {
  const existing = await noteByDay(dayKey);
  if (existing) {
    const updated: DayNote = { ...existing, note, mood, updatedAt: nowIso() };
    await db.dayNotes.put(updated);
    return updated;
  }
  const created: DayNote = { id: newId(), dayKey, note, mood, createdAt: nowIso(), updatedAt: nowIso() };
  await db.dayNotes.add(created);
  return created;
}
