import { useLiveQuery } from 'dexie-react-hooks';
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';

import { Button } from '../../components/Button';
import { Card } from '../../components/Card';
import { useToast } from '../../components/Toast';
import { IconChevronRight, IconClose, IconPlus } from '../../components/icons';
import { awardWorkoutCompleted } from '../../db/repositories/awardsRepo';
import { allWorkouts, updateWorkout } from '../../db/repositories/workoutsRepo';
import { isPr } from '../../lib/e1rm';
import { historyByExercise } from '../../lib/workoutHistory';
import type { Exercise, Workout, WorkoutEntry, WorkoutSet } from '../../types';
import { ExercisePickerSheet } from './ExercisePickerSheet';
import { RestTimer } from './RestTimer';

type SessionLoggerProps = {
  workout: Workout;
  exercisesById: Map<string, Exercise>;
};

const DEFAULT_SET: WorkoutSet = { reps: 8, weightKg: 20 };
const round2 = (n: number) => Math.round(n * 100) / 100;

function MiniStepper({
  value,
  onChange,
  step,
  format,
  ariaLabel,
  unit,
}: {
  value: number;
  onChange: (n: number) => void;
  step: number;
  format: (n: number) => string;
  ariaLabel: string;
  unit?: string;
}) {
  return (
    <div className="flex items-center gap-0.5">
      <button
        type="button"
        aria-label={`Decrease ${ariaLabel}`}
        onClick={() => onChange(Math.max(0, round2(value - step)))}
        className="flex h-9 w-8 items-center justify-center rounded-control border bg-surface text-lg leading-none hover:bg-white/10"
      >
        −
      </button>
      <span className="metric w-12 text-center text-sm font-semibold tabular-nums">
        {format(value)}
        {unit ? <span className="text-[10px] font-normal text-muted"> {unit}</span> : null}
      </span>
      <button
        type="button"
        aria-label={`Increase ${ariaLabel}`}
        onClick={() => onChange(round2(value + step))}
        className="flex h-9 w-8 items-center justify-center rounded-control border bg-surface text-lg leading-none hover:bg-white/10"
      >
        +
      </button>
    </div>
  );
}

export function SessionLogger({ workout, exercisesById }: SessionLoggerProps) {
  const { showToast } = useToast();
  const [entries, setEntries] = useState<WorkoutEntry[]>(workout.entries);
  const [notes, setNotes] = useState(workout.notes);
  const [addOpen, setAddOpen] = useState(false);
  const [swapIndex, setSwapIndex] = useState<number | null>(null);
  const [finishing, setFinishing] = useState(false);

  // Prior sessions only (exclude this one) → PR baselines + prefill sets.
  const history = useLiveQuery(async () => {
    const completed = (await allWorkouts()).filter((w) => w.completed && w.id !== workout.id);
    return historyByExercise(completed);
  }, [workout.id]);

  // Persist entry edits to the in-progress workout so navigating away is safe.
  const commit = (next: WorkoutEntry[]) => {
    setEntries(next);
    void updateWorkout(workout.id, { entries: next });
  };

  const mutateSet = (ei: number, si: number, patch: Partial<WorkoutSet>) => {
    commit(
      entries.map((e, i) =>
        i === ei ? { ...e, sets: e.sets.map((s, j) => (j === si ? { ...s, ...patch } : s)) } : e,
      ),
    );
  };

  const copyLastSet = (ei: number) => {
    commit(
      entries.map((e, i) => {
        if (i !== ei) return e;
        const last = e.sets.at(-1) ?? DEFAULT_SET;
        return { ...e, sets: [...e.sets, { ...last }] };
      }),
    );
  };

  const removeSet = (ei: number, si: number) => {
    commit(entries.map((e, i) => (i === ei ? { ...e, sets: e.sets.filter((_, j) => j !== si) } : e)));
  };

  const prefillLastSession = (ei: number) => {
    const exId = entries[ei]?.exerciseId;
    const last = exId ? history?.get(exId)?.lastSets : undefined;
    if (!last || last.length === 0) {
      showToast('No previous session for this exercise', 'info');
      return;
    }
    commit(entries.map((e, i) => (i === ei ? { ...e, sets: last.map((s) => ({ ...s })) } : e)));
  };

  const removeExercise = (ei: number) => {
    commit(entries.filter((_, i) => i !== ei));
  };

  const addExercise = (exerciseId: string) => {
    const last = history?.get(exerciseId)?.lastSets;
    commit([
      ...entries,
      { exerciseId, sets: last && last.length ? last.map((s) => ({ ...s })) : [{ ...DEFAULT_SET }] },
    ]);
  };

  const swapExercise = (exerciseId: string) => {
    if (swapIndex === null) return;
    const last = history?.get(exerciseId)?.lastSets;
    commit(
      entries.map((e, i) =>
        i === swapIndex
          ? { exerciseId, sets: last && last.length ? last.map((s) => ({ ...s })) : e.sets }
          : e,
      ),
    );
    setSwapIndex(null);
  };

  const finish = async () => {
    setFinishing(true);
    try {
      const startedMs = Date.parse(workout.createdAt);
      const durationMin = Math.max(1, Math.round((Date.now() - startedMs) / 60000));
      await updateWorkout(workout.id, { entries, notes, completed: true, durationMin });
      const awarded = await awardWorkoutCompleted(workout.dayKey);
      showToast(awarded ? 'Workout complete +50 XP' : 'Workout complete', 'success');
    } finally {
      setFinishing(false);
    }
  };

  useEffect(() => {
    setEntries(workout.entries);
    setNotes(workout.notes);
  }, [workout.id]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className="flex flex-col gap-4">
      <RestTimer />

      <div className="flex flex-col gap-3">
        {entries.map((entry, ei) => {
          const exercise = exercisesById.get(entry.exerciseId);
          // No prior history → baseline of 0, so a first-ever record still counts as a PR.
          const prev = history?.get(entry.exerciseId) ?? { bestWeightKg: 0, bestE1rm: 0 };
          const pr = isPr(entry.sets, prev);
          return (
            <Card key={`${entry.exerciseId}-${ei}`} className="flex flex-col gap-3 p-3">
              <div className="flex items-center justify-between gap-2">
                <Link
                  to={`/workout/history/${entry.exerciseId}`}
                  className="flex items-center gap-1.5 text-sm font-semibold hover:text-accent"
                >
                  {exercise?.name ?? 'Exercise'}
                  <IconChevronRight size={14} className="text-muted" />
                </Link>
                <div className="flex items-center gap-2">
                  {pr.pr ? (
                    <span className="rounded-full bg-ember/15 px-2 py-0.5 text-[10px] font-semibold uppercase text-ember">
                      PR
                    </span>
                  ) : null}
                  <button
                    type="button"
                    onClick={() => setSwapIndex(ei)}
                    className="text-[11px] text-muted hover:text-text"
                  >
                    Swap
                  </button>
                  <button
                    type="button"
                    aria-label={`Remove ${exercise?.name ?? 'exercise'}`}
                    onClick={() => removeExercise(ei)}
                    className="text-muted hover:text-accent"
                  >
                    <IconClose size={16} />
                  </button>
                </div>
              </div>

              <div className="flex flex-col gap-2">
                <div className="flex items-center gap-2 pl-6 pr-6 text-[10px] uppercase tracking-wide text-muted">
                  <span className="flex-1 text-center">reps</span>
                  <span className="flex-1 text-center">weight</span>
                </div>
                {entry.sets.map((set, si) => (
                  <div key={si} className="flex items-center gap-2">
                    <span className="w-5 text-xs text-muted">#{si + 1}</span>
                    <div className="flex flex-1 justify-center">
                      <MiniStepper
                        value={set.reps}
                        onChange={(n) => mutateSet(ei, si, { reps: n })}
                        step={1}
                        format={(n) => String(Math.round(n))}
                        ariaLabel={`reps set ${si + 1}`}
                      />
                    </div>
                    <div className="flex flex-1 justify-center">
                      <MiniStepper
                        value={set.weightKg}
                        onChange={(n) => mutateSet(ei, si, { weightKg: n })}
                        step={2.5}
                        format={(n) => (Number.isInteger(n) ? String(n) : n.toFixed(1))}
                        ariaLabel={`weight set ${si + 1}`}
                        unit="kg"
                      />
                    </div>
                    <button
                      type="button"
                      aria-label={`Remove set ${si + 1}`}
                      onClick={() => removeSet(ei, si)}
                      disabled={entry.sets.length <= 1}
                      className="w-5 text-muted hover:text-accent disabled:opacity-30"
                    >
                      <IconClose size={14} />
                    </button>
                  </div>
                ))}
              </div>

              <div className="flex gap-2">
                <Button size="sm" variant="secondary" onClick={() => copyLastSet(ei)}>
                  Copy last set
                </Button>
                <Button size="sm" variant="ghost" onClick={() => prefillLastSession(ei)}>
                  Last session
                </Button>
              </div>
            </Card>
          );
        })}
      </div>

      <Button variant="secondary" onClick={() => setAddOpen(true)} fullWidth>
        <IconPlus size={16} /> Add exercise
      </Button>

      <div className="flex flex-col gap-1.5">
        <label htmlFor="workout-notes" className="text-xs font-medium uppercase tracking-wide text-muted">
          Notes
        </label>
        <textarea
          id="workout-notes"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          onBlur={() => updateWorkout(workout.id, { notes })}
          rows={2}
          placeholder="How did it feel? Anything to remember?"
          className="w-full rounded-control border bg-surface-2 p-3 text-sm focus:border-accent/60 focus:outline-none"
        />
      </div>

      <Button onClick={finish} disabled={finishing || entries.length === 0} size="lg" fullWidth>
        {finishing ? 'Finishing…' : 'Finish workout'}
      </Button>

      <ExercisePickerSheet
        open={addOpen}
        onClose={() => setAddOpen(false)}
        onPick={addExercise}
        title="Add exercise"
        excludeIds={entries.map((e) => e.exerciseId)}
      />
      <ExercisePickerSheet
        open={swapIndex !== null}
        onClose={() => setSwapIndex(null)}
        onPick={swapExercise}
        title="Swap exercise"
        excludeIds={entries.map((e) => e.exerciseId)}
      />
    </div>
  );
}
