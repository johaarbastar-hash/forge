import { db, newId, nowIso } from '../db';
import type { DayKey, Photo } from '../../types';

export async function allPhotos(): Promise<Photo[]> {
  return db.photos.orderBy('dayKey').toArray();
}

export async function photosByDay(dayKey: DayKey): Promise<Photo[]> {
  return db.photos.where('dayKey').equals(dayKey).toArray();
}

/** Caller passes an already-compressed blob (max edge 1280 px JPEG q0.8). */
export async function addPhoto(dayKey: DayKey, blob: Blob, note?: string): Promise<Photo> {
  const photo: Photo = {
    id: newId(),
    dayKey,
    blob,
    ...(note !== undefined ? { note } : {}),
    createdAt: nowIso(),
    updatedAt: nowIso(),
  };
  await db.photos.add(photo);
  return photo;
}

export async function deletePhoto(id: string): Promise<void> {
  await db.photos.delete(id);
}
