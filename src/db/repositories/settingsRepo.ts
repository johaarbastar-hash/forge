import { db, nowIso } from '../db';
import { DEFAULT_SETTINGS } from '../seed';
import type { Settings } from '../../types';

const SETTINGS_ID = 'settings';

/** Settings row is created by the seed; self-heals if missing (e.g. import of a partial dump). */
export async function getSettings(): Promise<Settings> {
  const existing = await db.settings.get(SETTINGS_ID);
  if (existing) return existing;
  const created: Settings = { ...DEFAULT_SETTINGS, createdAt: nowIso(), updatedAt: nowIso() };
  await db.settings.put(created);
  return created;
}

export async function updateSettings(
  patch: Partial<Pick<Settings, 'reminders' | 'developer'>>,
): Promise<Settings> {
  const current = await getSettings();
  const updated: Settings = {
    ...current,
    ...patch,
    reminders: { ...current.reminders, ...(patch.reminders ?? {}) },
    developer: { ...current.developer, ...(patch.developer ?? {}) },
    updatedAt: nowIso(),
  };
  await db.settings.put(updated);
  return updated;
}
