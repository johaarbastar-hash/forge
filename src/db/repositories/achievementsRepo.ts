import { db, newId, nowIso } from '../db';
import type { AchievementId, AchievementUnlock, DayKey } from '../../types';

/**
 * Persist an unlock. Fires once ever per achievement (unique `&achievementId`
 * index) — replays never re-unlock. Returns true when newly unlocked.
 */
export async function unlockAchievement(id: AchievementId, dayKey: DayKey): Promise<boolean> {
  try {
    await db.achievementUnlocks.add({
      id: newId(),
      achievementId: id,
      dayKey,
      createdAt: nowIso(),
      updatedAt: nowIso(),
    });
    return true;
  } catch (err) {
    if (err instanceof Error && err.name === 'ConstraintError') return false;
    throw err;
  }
}

export async function allUnlocks(): Promise<AchievementUnlock[]> {
  return db.achievementUnlocks.toArray();
}

export async function isUnlocked(id: AchievementId): Promise<boolean> {
  const row = await db.achievementUnlocks.where('achievementId').equals(id).first();
  return !!row;
}
