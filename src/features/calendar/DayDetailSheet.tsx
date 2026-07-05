import { useLiveQuery } from 'dexie-react-hooks';
import { useEffect, useState } from 'react';

import { Button } from '../../components/Button';
import { Sheet } from '../../components/Sheet';
import { Stepper } from '../../components/Stepper';
import { useToast } from '../../components/Toast';
import { IconPlus } from '../../components/icons';
import { evaluateSleepGoal } from '../../db/repositories/awardsRepo';
import { setDayNote, noteByDay } from '../../db/repositories/dayNotesRepo';
import { allFoods } from '../../db/repositories/foodsRepo';
import { mealsByDay } from '../../db/repositories/mealsRepo';
import { setSleep, sleepByDay } from '../../db/repositories/sleepRepo';
import { workoutByDay } from '../../db/repositories/workoutsRepo';
import { fromDayKey } from '../../lib/dates';
import { setsVolume } from '../../lib/workoutHistory';
import type { DayNote, Meal } from '../../types';
import { MealBuilderSheet, type BuilderTarget } from '../nutrition/MealBuilderSheet';
import { CATEGORY_LABELS, mealTitle } from '../nutrition/mealFormatting';
import { WaterQuickPanel } from '../water/WaterQuickPanel';
import { WeightQuickPanel } from '../weight/WeightQuickPanel';

const MOODS = ['😞', '😐', '🙂', '😀', '🤩'];

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-2">
      <p className="text-xs font-medium uppercase tracking-wide text-muted">{title}</p>
      {children}
    </div>
  );
}

export function DayDetailSheet({
  open,
  onClose,
  dayKey,
}: {
  open: boolean;
  onClose: () => void;
  dayKey: string;
}) {
  const { showToast } = useToast();
  const [builder, setBuilder] = useState<BuilderTarget | null>(null);
  const [sleepH, setSleepH] = useState<number | null>(null);
  const [note, setNoteText] = useState('');
  const [mood, setMood] = useState<DayNote['mood']>(3);

  const data = useLiveQuery(async () => {
    const [meals, workout, sleep, dayNote, foods] = await Promise.all([
      mealsByDay(dayKey),
      workoutByDay(dayKey),
      sleepByDay(dayKey),
      noteByDay(dayKey),
      allFoods(),
    ]);
    return {
      meals,
      workout: workout ?? null,
      sleep: sleep ?? null,
      dayNote: dayNote ?? null,
      foodsById: new Map(foods.map((f) => [f.id, f])),
    };
  }, [dayKey]);

  // Seed editable fields when the sheet opens for a day.
  useEffect(() => {
    if (!open || !data) return;
    setSleepH((h) => (h === null ? (data.sleep?.hours ?? 8) : h));
    setNoteText((n) => (n === '' ? (data.dayNote?.note ?? '') : n));
    setMood(data.dayNote?.mood ?? 3);
  }, [open, data]);

  // Reset local edit state each time the day changes.
  useEffect(() => {
    setSleepH(null);
    setNoteText('');
    setMood(3);
  }, [dayKey]);

  const title = new Intl.DateTimeFormat('en-GB', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  }).format(fromDayKey(dayKey));

  const saveSleep = async () => {
    if (sleepH === null) return;
    await setSleep(dayKey, sleepH);
    await evaluateSleepGoal(dayKey);
    showToast('Sleep saved', 'success');
  };

  const saveNote = async () => {
    await setDayNote(dayKey, note.trim(), mood);
    showToast('Note saved', 'success');
  };

  const kcalTotal = (data?.meals ?? []).reduce((s, m) => s + m.cachedMacros.kcal, 0);

  return (
    <>
      <Sheet open={open} onClose={onClose} title={title}>
        <div className="flex max-h-[72vh] flex-col gap-5 overflow-y-auto pb-2">
          <Section title={`Meals · ${Math.round(kcalTotal)} kcal`}>
            <div className="flex flex-col gap-1.5">
              {(data?.meals ?? []).map((meal: Meal) => (
                <button
                  key={meal.id}
                  type="button"
                  onClick={() => setBuilder({ mode: 'edit', meal })}
                  className="flex items-center justify-between rounded-control border bg-surface-2 px-3 py-2 text-left text-sm"
                >
                  <span>
                    <span className="block">{mealTitle(meal.items, data?.foodsById ?? new Map())}</span>
                    <span className="block text-[11px] text-muted">
                      {CATEGORY_LABELS[meal.category]} · {Math.round(meal.cachedMacros.kcal)} kcal
                    </span>
                  </span>
                </button>
              ))}
              <Button size="sm" variant="secondary" onClick={() => setBuilder({ mode: 'create' })}>
                <IconPlus size={16} /> Add meal
              </Button>
            </div>
          </Section>

          <Section title="Workout">
            {data?.workout ? (
              <div className="rounded-control border bg-surface-2 px-3 py-2 text-sm">
                {data.workout.splitDay} · {data.workout.entries.reduce((s, e) => s + e.sets.length, 0)} sets ·{' '}
                {Math.round(data.workout.entries.reduce((s, e) => s + setsVolume(e.sets), 0))} kg volume
                {data.workout.completed ? '' : ' · in progress'}
              </div>
            ) : (
              <p className="text-sm text-muted">No workout logged.</p>
            )}
          </Section>

          <Section title="Water">
            <WaterQuickPanel dayKey={dayKey} />
          </Section>

          <Section title="Weight">
            <WeightQuickPanel dayKey={dayKey} />
          </Section>

          <Section title="Sleep">
            <div className="flex items-end gap-3">
              <div className="flex-1">
                <Stepper
                  value={sleepH ?? data?.sleep?.hours ?? 8}
                  onChange={setSleepH}
                  step={0.5}
                  min={0}
                  max={14}
                  unit="h"
                  format={(v) => v.toFixed(1)}
                />
              </div>
              <Button size="sm" onClick={saveSleep}>
                Save
              </Button>
            </div>
          </Section>

          <Section title="Note & mood">
            <div className="flex gap-1.5">
              {MOODS.map((emoji, i) => {
                const value = (i + 1) as DayNote['mood'];
                return (
                  <button
                    key={value}
                    type="button"
                    aria-label={`Mood ${value}`}
                    aria-pressed={mood === value}
                    onClick={() => setMood(value)}
                    className={`flex h-10 flex-1 items-center justify-center rounded-control border text-lg transition-colors ${
                      mood === value ? 'border-accent/60 bg-accent/10' : 'bg-surface-2'
                    }`}
                  >
                    {emoji}
                  </button>
                );
              })}
            </div>
            <textarea
              value={note}
              onChange={(e) => setNoteText(e.target.value)}
              rows={2}
              placeholder="A line about the day…"
              className="w-full rounded-control border bg-surface-2 p-3 text-sm focus:border-accent/60 focus:outline-none"
            />
            <Button size="sm" variant="secondary" onClick={saveNote}>
              Save note
            </Button>
          </Section>
        </div>
      </Sheet>

      {builder ? (
        <MealBuilderSheet
          open={builder !== null}
          onClose={() => setBuilder(null)}
          dayKey={dayKey}
          target={builder}
        />
      ) : null}
    </>
  );
}
