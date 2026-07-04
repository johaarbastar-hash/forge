import { useLiveQuery } from 'dexie-react-hooks';
import { useState } from 'react';
import type { FormEvent } from 'react';

import { Button } from '../../components/Button';
import { Card } from '../../components/Card';
import { Input } from '../../components/Input';
import { ScreenHeader } from '../../components/ScreenHeader';
import { Sheet } from '../../components/Sheet';
import { useToast } from '../../components/Toast';
import {
  IconChart,
  IconDrop,
  IconDumbbell,
  IconMoon,
  IconScale,
  IconUtensils,
} from '../../components/icons';
import { getGoals, saveGoals } from '../../db/repositories/goalsRepo';
import { mealsByDay } from '../../db/repositories/mealsRepo';
import { getProfile } from '../../db/repositories/profileRepo';
import { sleepByDay } from '../../db/repositories/sleepRepo';
import { waterTotalForDay } from '../../db/repositories/waterRepo';
import { latestWeight } from '../../db/repositories/weightRepo';
import { allWorkouts } from '../../db/repositories/workoutsRepo';
import { todayKey, weekKeys } from '../../lib/dates';
import type { GoalField } from '../../types';
import type { ComponentType, SVGProps } from 'react';

type GoalRow = {
  field: GoalField;
  label: string;
  unit: string;
  step: number;
  min: number;
  icon: ComponentType<SVGProps<SVGSVGElement> & { size?: number }>;
  /** current progress value and its display text */
  current: number;
  target: number;
  detail: string;
};

function ProgressBar({ fraction, done }: { fraction: number; done: boolean }) {
  const width = `${Math.round(Math.min(1, Math.max(0, fraction)) * 100)}%`;
  return (
    <div className="h-1.5 w-full overflow-hidden rounded-full bg-white/10">
      <div
        className={`h-full rounded-full transition-[width] duration-200 ease-out ${done ? 'bg-success' : 'bg-accent'}`}
        style={{ width }}
      />
    </div>
  );
}

export function GoalsScreen() {
  const { showToast } = useToast();
  const [editing, setEditing] = useState<GoalRow | null>(null);
  const [draft, setDraft] = useState('');
  const today = todayKey();

  const data = useLiveQuery(async () => {
    const [goals, profile, meals, waterMl, sleep, weight, workouts] = await Promise.all([
      getGoals(),
      getProfile(),
      mealsByDay(today),
      waterTotalForDay(today),
      sleepByDay(today),
      latestWeight(),
      allWorkouts(),
    ]);
    const week = new Set(weekKeys(today));
    const workoutsThisWeek = workouts.filter((w) => w.completed && week.has(w.dayKey)).length;
    const kcalToday = meals.reduce((s, m) => s + m.cachedMacros.kcal, 0);
    const proteinToday = meals.reduce((s, m) => s + m.cachedMacros.proteinG, 0);
    return {
      goals: goals ?? null,
      startKg: profile?.startWeightKg ?? null,
      currentKg: weight?.kg ?? profile?.startWeightKg ?? null,
      kcalToday,
      proteinToday,
      waterMl,
      sleepH: sleep?.hours ?? 0,
      workoutsThisWeek,
    };
  }, [today]);

  if (!data) {
    return (
      <div>
        <ScreenHeader title="Goals" subtitle="Targets that shape each day" back />
        <div className="flex h-40 items-center justify-center" role="status" aria-label="Loading">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-white/10 border-t-accent" />
        </div>
      </div>
    );
  }

  const goals = data.goals;
  if (!goals) return null; // unreachable behind the onboarding guard

  const weightProgress = (() => {
    if (data.currentKg === null || data.startKg === null) return 0;
    const span = goals.weightKg - data.startKg;
    if (span === 0) return 1;
    return (data.currentKg - data.startKg) / span;
  })();

  const rows: GoalRow[] = [
    {
      field: 'calories',
      label: 'Calories',
      unit: 'kcal',
      step: 50,
      min: 1200,
      icon: IconUtensils,
      current: data.kcalToday,
      target: goals.calories,
      detail: `${Math.round(data.kcalToday)} / ${goals.calories} kcal today`,
    },
    {
      field: 'proteinG',
      label: 'Protein',
      unit: 'g',
      step: 5,
      min: 30,
      icon: IconChart,
      current: data.proteinToday,
      target: goals.proteinG,
      detail: `${Math.round(data.proteinToday)} / ${goals.proteinG} g today`,
    },
    {
      field: 'waterMl',
      label: 'Water',
      unit: 'ml',
      step: 250,
      min: 500,
      icon: IconDrop,
      current: data.waterMl,
      target: goals.waterMl,
      detail: `${data.waterMl} / ${goals.waterMl} ml today`,
    },
    {
      field: 'sleepH',
      label: 'Sleep',
      unit: 'h',
      step: 0.5,
      min: 4,
      icon: IconMoon,
      current: data.sleepH,
      target: goals.sleepH,
      detail: `${data.sleepH} / ${goals.sleepH} h last night`,
    },
    {
      field: 'workoutsPerWeek',
      label: 'Workouts',
      unit: '/week',
      step: 1,
      min: 1,
      icon: IconDumbbell,
      current: data.workoutsThisWeek,
      target: goals.workoutsPerWeek,
      detail: `${data.workoutsThisWeek} / ${goals.workoutsPerWeek} this week`,
    },
    {
      field: 'weightKg',
      label: 'Goal weight',
      unit: 'kg',
      step: 0.5,
      min: 25,
      icon: IconScale,
      current: weightProgress,
      target: 1,
      detail:
        data.currentKg !== null
          ? `${data.currentKg} kg now → ${goals.weightKg} kg goal`
          : `Goal ${goals.weightKg} kg`,
    },
  ];

  const openEditor = (row: GoalRow) => {
    setDraft(String(goals[row.field]));
    setEditing(row);
  };

  const submitEdit = async (e: FormEvent) => {
    e.preventDefault();
    if (!editing) return;
    const value = Number(draft);
    if (!Number.isFinite(value) || value < editing.min) {
      showToast(`Enter a value of at least ${editing.min}`, 'error');
      return;
    }
    await saveGoals({ [editing.field]: value }, today);
    setEditing(null);
    showToast(`${editing.label} goal updated from today onward`, 'success');
  };

  return (
    <div className="flex flex-col gap-4">
      <ScreenHeader title="Goals" subtitle="Targets that shape each day" back />

      <p className="text-xs text-muted">
        Edits apply from today forward — past days keep the goals they were logged against.
      </p>

      <div className="flex flex-col gap-3">
        {rows.map((row) => {
          const fraction = row.target > 0 ? row.current / row.target : 0;
          const done = fraction >= 1;
          const Icon = row.icon;
          return (
            <Card key={row.field} className="p-0">
              <button
                type="button"
                onClick={() => openEditor(row)}
                className="flex w-full flex-col gap-2.5 rounded-card p-4 text-left transition-colors duration-150 hover:bg-white/5"
                aria-label={`Edit ${row.label} goal`}
              >
                <div className="flex items-center gap-3">
                  <span className="flex h-9 w-9 items-center justify-center rounded-control bg-surface-2 text-muted">
                    <Icon size={18} />
                  </span>
                  <span className="flex-1">
                    <span className="block text-sm font-medium">{row.label}</span>
                    <span className="block text-xs text-muted">{row.detail}</span>
                  </span>
                  <span className="metric text-sm font-semibold text-muted">
                    {goals[row.field]}
                    <span className="ml-0.5 text-xs font-normal">{row.unit}</span>
                  </span>
                </div>
                <ProgressBar fraction={fraction} done={done} />
              </button>
            </Card>
          );
        })}
      </div>

      <Sheet open={editing !== null} onClose={() => setEditing(null)} title={editing ? `${editing.label} goal` : ''}>
        {editing ? (
          <form onSubmit={submitEdit} className="flex flex-col gap-4" noValidate>
            <Input
              label={`${editing.label} (${editing.unit.replace('/', 'per ')})`}
              type="number"
              inputMode="decimal"
              step={String(editing.step)}
              autoFocus
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
            />
            <p className="text-xs text-muted">
              Applies from today forward; earlier days keep their old goal.
            </p>
            <Button type="submit" fullWidth>
              Save goal
            </Button>
          </form>
        ) : null}
      </Sheet>
    </div>
  );
}
