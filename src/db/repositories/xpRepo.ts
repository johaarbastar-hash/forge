import { db, newId, nowIso } from '../db';
import { XP_VALUES } from '../../lib/xp';
import type { DayKey, XpEvent, XpEventType } from '../../types';

/**
 * Award XP for (dayKey, type). Idempotent: the unique `&[dayKey+type]` index
 * rejects duplicates, so calling this repeatedly awards exactly once.
 * Returns true when XP was newly awarded.
 */
export async function awardXp(dayKey: DayKey, type: XpEventType): Promise<boolean> {
  try {
    await db.xpEvents.add({
      id: newId(),
      dayKey,
      type,
      amount: XP_VALUES[type],
      createdAt: nowIso(),
      updatedAt: nowIso(),
    });
    return true;
  } catch (err) {
    if (err instanceof Error && err.name === 'ConstraintError') return false;
    throw err;
  }
}

export async function allXpEvents(): Promise<XpEvent[]> {
  return db.xpEvents.orderBy('dayKey').toArray();
}

export async function xpEventsByDay(dayKey: DayKey): Promise<XpEvent[]> {
  return db.xpEvents.where('dayKey').equals(dayKey).toArray();
}

export async function totalXpAmount(): Promise<number> {
  const events = await db.xpEvents.toArray();
  return events.reduce((sum, e) => sum + e.amount, 0);
}
