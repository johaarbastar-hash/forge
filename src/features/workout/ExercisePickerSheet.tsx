import { useLiveQuery } from 'dexie-react-hooks';
import { useMemo, useState } from 'react';

import { Sheet } from '../../components/Sheet';
import { allExercises } from '../../db/repositories/exercisesRepo';
import type { MuscleGroup } from '../../types';

const GROUP_LABELS: Record<MuscleGroup, string> = {
  push: 'Push',
  pull: 'Pull',
  legs: 'Legs',
  core: 'Core',
};

const GROUP_ORDER: MuscleGroup[] = ['push', 'pull', 'legs', 'core'];

type ExercisePickerSheetProps = {
  open: boolean;
  onClose: () => void;
  onPick: (exerciseId: string) => void;
  title?: string;
  excludeIds?: string[];
};

export function ExercisePickerSheet({
  open,
  onClose,
  onPick,
  title = 'Add exercise',
  excludeIds = [],
}: ExercisePickerSheetProps) {
  const [query, setQuery] = useState('');
  const exercises = useLiveQuery(() => allExercises(), []);

  const grouped = useMemo(() => {
    const q = query.trim().toLowerCase();
    const exclude = new Set(excludeIds);
    const list = (exercises ?? []).filter(
      (e) => !exclude.has(e.id) && (!q || e.name.toLowerCase().includes(q)),
    );
    return GROUP_ORDER.map((group) => ({
      group,
      items: list.filter((e) => e.muscleGroup === group),
    })).filter((g) => g.items.length > 0);
  }, [exercises, query, excludeIds]);

  return (
    <Sheet open={open} onClose={onClose} title={title}>
      <div className="flex max-h-[70vh] flex-col gap-3 overflow-y-auto">
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search exercises"
          className="h-11 w-full rounded-control border bg-surface-2 px-3 text-base focus:border-accent/60 focus:outline-none"
        />
        {grouped.map(({ group, items }) => (
          <div key={group}>
            <p className="mb-1.5 text-xs font-medium uppercase tracking-wide text-muted">
              {GROUP_LABELS[group]}
            </p>
            <div className="flex flex-col gap-1">
              {items.map((ex) => (
                <button
                  key={ex.id}
                  type="button"
                  onClick={() => {
                    onPick(ex.id);
                    onClose();
                  }}
                  className="flex items-center justify-between rounded-control border bg-surface-2 px-3 py-2.5 text-left text-sm transition-colors duration-150 hover:bg-white/10"
                >
                  <span>{ex.name}</span>
                  <span className="text-[11px] text-muted">{ex.equipment}</span>
                </button>
              ))}
            </div>
          </div>
        ))}
        {grouped.length === 0 ? (
          <p className="py-6 text-center text-sm text-muted">No exercises match.</p>
        ) : null}
      </div>
    </Sheet>
  );
}
