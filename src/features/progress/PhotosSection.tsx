import { useLiveQuery } from 'dexie-react-hooks';
import { useEffect, useMemo, useRef, useState } from 'react';

import { Button } from '../../components/Button';
import { EmptyState } from '../../components/EmptyState';
import { useToast } from '../../components/Toast';
import { IconClose, IconPlus } from '../../components/icons';
import { addPhoto, allPhotos, deletePhoto } from '../../db/repositories/photosRepo';
import { fromDayKey, todayKey } from '../../lib/dates';
import { compressImage } from '../../lib/image';
import type { Photo } from '../../types';

function fmtDate(dayKey: string): string {
  return new Intl.DateTimeFormat('en-GB', { day: 'numeric', month: 'short', year: '2-digit' }).format(
    fromDayKey(dayKey),
  );
}

export function PhotosSection() {
  const { showToast } = useToast();
  const photos = useLiveQuery(() => allPhotos(), []);
  const fileRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [selected, setSelected] = useState<string[]>([]);

  // Object URLs for the blobs; rebuilt when the photo set changes, revoked on cleanup.
  const sorted = useMemo(
    () => [...(photos ?? [])].sort((a, b) => b.dayKey.localeCompare(a.dayKey)),
    [photos],
  );
  const [urls, setUrls] = useState<Map<string, string>>(new Map());
  useEffect(() => {
    const map = new Map<string, string>();
    for (const p of sorted) map.set(p.id, URL.createObjectURL(p.blob));
    setUrls(map);
    return () => {
      for (const url of map.values()) URL.revokeObjectURL(url);
    };
  }, [sorted]);

  const onPick = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    setBusy(true);
    try {
      const blob = await compressImage(file);
      await addPhoto(todayKey(), blob);
      showToast('Photo saved', 'success');
    } catch {
      showToast('Could not process that image', 'error');
    } finally {
      setBusy(false);
    }
  };

  const toggleSelect = (id: string) => {
    setSelected((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id].slice(-2),
    );
  };

  const remove = async (id: string) => {
    if (!window.confirm('Delete this photo?')) return;
    await deletePhoto(id);
    setSelected((prev) => prev.filter((x) => x !== id));
    showToast('Photo deleted', 'info');
  };

  const compare = selected
    .map((id) => sorted.find((p) => p.id === id))
    .filter((p): p is Photo => !!p);

  return (
    <div className="flex flex-col gap-4">
      <input
        ref={fileRef}
        type="file"
        accept="image/*"
        capture="environment"
        onChange={onPick}
        className="hidden"
      />
      <Button onClick={() => fileRef.current?.click()} disabled={busy} fullWidth>
        <IconPlus size={18} /> {busy ? 'Processing…' : 'Add progress photo'}
      </Button>

      {compare.length === 2 ? (
        <div>
          <p className="mb-2 text-xs font-medium uppercase tracking-wide text-muted">Compare</p>
          <div className="grid grid-cols-2 gap-2">
            {compare.map((p) => (
              <figure key={p.id} className="overflow-hidden rounded-card border">
                <img src={urls.get(p.id)} alt={`Progress ${fmtDate(p.dayKey)}`} className="aspect-[3/4] w-full object-cover" />
                <figcaption className="bg-surface-2 px-2 py-1 text-center text-[11px] text-muted">
                  {fmtDate(p.dayKey)}
                </figcaption>
              </figure>
            ))}
          </div>
        </div>
      ) : selected.length === 1 ? (
        <p className="text-center text-xs text-muted">Pick one more photo to compare.</p>
      ) : null}

      {sorted.length === 0 ? (
        <EmptyState
          icon={<IconPlus size={24} />}
          title="No photos yet"
          body="Capture or upload a progress photo. Images are compressed and stored on this device only."
        />
      ) : (
        <div className="grid grid-cols-3 gap-2">
          {sorted.map((p) => {
            const isSel = selected.includes(p.id);
            return (
              <div key={p.id} className="relative">
                <button
                  type="button"
                  onClick={() => toggleSelect(p.id)}
                  className={`block w-full overflow-hidden rounded-control border-2 ${
                    isSel ? 'border-accent' : 'border-transparent'
                  }`}
                  aria-pressed={isSel}
                  aria-label={`Progress photo ${fmtDate(p.dayKey)}`}
                >
                  <img src={urls.get(p.id)} alt="" className="aspect-square w-full object-cover" />
                </button>
                <span className="pointer-events-none absolute bottom-1 left-1 rounded bg-black/60 px-1 text-[9px] text-white">
                  {fmtDate(p.dayKey)}
                </span>
                <button
                  type="button"
                  aria-label="Delete photo"
                  onClick={() => remove(p.id)}
                  className="absolute right-1 top-1 flex h-5 w-5 items-center justify-center rounded-full bg-black/60 text-white hover:bg-accent"
                >
                  <IconClose size={12} />
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
