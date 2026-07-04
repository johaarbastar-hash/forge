import { db, nowIso } from '../db';
import type { Profile, Timestamps } from '../../types';

const PROFILE_ID = 'profile';

export async function getProfile(): Promise<Profile | undefined> {
  return db.profile.get(PROFILE_ID);
}

/** Upsert the single profile row. */
export async function saveProfile(
  data: Partial<Omit<Profile, 'id' | keyof Timestamps>>,
): Promise<Profile> {
  const existing = await db.profile.get(PROFILE_ID);
  if (existing) {
    const updated: Profile = { ...existing, ...data, updatedAt: nowIso() };
    await db.profile.put(updated);
    return updated;
  }
  const created: Profile = {
    id: PROFILE_ID,
    name: '',
    age: 0,
    heightCm: 0,
    startWeightKg: 0,
    experience: 'beginner',
    splitId: '',
    onboarded: false,
    ...data,
    createdAt: nowIso(),
    updatedAt: nowIso(),
  };
  await db.profile.add(created);
  return created;
}
