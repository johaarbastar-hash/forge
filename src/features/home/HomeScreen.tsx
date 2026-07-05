import { useLiveQuery } from 'dexie-react-hooks';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

import { Button } from '../../components/Button';
import { Card } from '../../components/Card';
import { ProgressRing } from '../../components/ProgressRing';
import { ScreenHeader } from '../../components/ScreenHeader';
import { Sheet } from '../../components/Sheet';
import { useToast } from '../../components/Toast';
import { IconDrop, IconDumbbell, IconFlame, IconPlus, IconSparkles } from '../../components/icons';
import { quotes } from '../../data/quotes';
import { getSplitTemplate } from '../../data/splits';
import { evaluateWaterGoal } from '../../db/repositories/awardsRepo';
import { buildCoachInput } from '../../db/repositories/analyticsRepo';
import { addWater } from '../../db/repositories/waterRepo';
import { getGoals } from '../../db/repositories/goalsRepo';
import { mealsByDay, mealsByDays } from '../../db/repositories/mealsRepo';
import { getProfile } from '../../db/repositories/profileRepo';
import { allWorkouts, workoutByDay } from '../../db/repositories/workoutsRepo';
import { waterTotalForDay } from '../../db/repositories/waterRepo';
import { allWeightLogs } from '../../db/repositories/weightRepo';
import { allXpEvents } from '../../db/repositories/xpRepo';
import { trackedAverage } from '../../lib/analytics';
import { bmi } from '../../lib/bmi';
import { addDaysToKey, todayKey, weekKeys, weekdayOf } from '../../lib/dates';
import { quoteForDay } from '../../lib/quotes';
import { coachInsights } from '../../lib/coach';
import { currentStreak } from '../../lib/streaks';
import { levelProgress } from '../../lib/xp';
import type { Macros, XpEventType } from '../../types';
import { MacroBars } from '../nutrition/MacroBars';
import { WeightQuickPanel } from '../weight/WeightQuickPanel';

function greeting(hour: number): string {
  if (hour < 5) return 'Late night';
  if (hour < 12) return 'Good morning';
  if (hour < 17) return 'Good afternoon';
  return 'Good evening';
}

const ZERO: Macros = { kcal: 0, proteinG: 0, carbsG: 0, fatG: 0, fiberG: 0 };

/** Weight trend over ~7 days: sign + magnitude between the latest weigh-in and the nearest one ≥7 days earlier. */
function weightTrend(logs: { dayKey: string; kg: number }[]): { delta: number; kg: number } | null {
  if (logs.length === 0) return null;
  const sorted = [...logs].sort((a, b) => a.dayKey.localeCompare(b.dayKey));
  const latest = sorted[sorted.length - 1];
  if (!latest) return null;
  const cutoff = addDaysToKey(latest.dayKey, -7);
  const prior = [...sorted].reverse().find((l) => l.dayKey <= cutoff) ?? sorted[0];
  if (!prior || prior.dayKey === latest.dayKey) return { delta: 0, kg: latest.kg };
  return { delta: Math.round((latest.kg - prior.kg) * 10) / 10, kg: latest.kg };
}

export function HomeScreen() {
  const navigate = useNavigate();
  const { showToast } = useToast();
  const [weightOpen, setWeightOpen] = useState(false);
  const now = new Date();
  const today = todayKey(now);
  const dateLabel = new Intl.DateTimeFormat('en-GB', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  }).format(now);

  const data = useLiveQuery(async () => {
    const week = weekKeys(today);
    const [profile, goals, todayMeals, weekMeals, waterMl, xpEvents, weightLogs, workouts, todayWorkout] =
      await Promise.all([
        getProfile(),
        getGoals(),
        mealsByDay(today),
        mealsByDays(week),
        waterTotalForDay(today),
        allXpEvents(),
        allWeightLogs(),
        allWorkouts(),
        workoutByDay(today),
      ]);

    const macros = todayMeals.reduce<Macros>(
      (acc, m) => ({
        kcal: acc.kcal + m.cachedMacros.kcal,
        proteinG: acc.proteinG + m.cachedMacros.proteinG,
        carbsG: acc.carbsG + m.cachedMacros.carbsG,
        fatG: acc.fatG + m.cachedMacros.fatG,
        fiberG: acc.fiberG + m.cachedMacros.fiberG,
      }),
      { ...ZERO },
    );

    const streakSet = (type: XpEventType) =>
      new Set(xpEvents.filter((e) => e.type === type).map((e) => e.dayKey));

    // weekly averages over days that actually have meals
    const weekSet = new Set(week);
    const perDayKcal = new Map<string, number>();
    const perDayProtein = new Map<string, number>();
    for (const m of weekMeals) {
      if (!weekSet.has(m.dayKey)) continue;
      perDayKcal.set(m.dayKey, (perDayKcal.get(m.dayKey) ?? 0) + m.cachedMacros.kcal);
      perDayProtein.set(m.dayKey, (perDayProtein.get(m.dayKey) ?? 0) + m.cachedMacros.proteinG);
    }
    const workoutsThisWeek = workouts.filter((w) => w.completed && weekSet.has(w.dayKey)).length;
    const totalXp = xpEvents.reduce((s, e) => s + e.amount, 0);
    const coachInput = await buildCoachInput(now);
    const topInsights = coachInput ? coachInsights(coachInput).slice(0, 3) : [];

    return {
      topInsights,
      profile: profile ?? null,
      goals: goals ?? null,
      macros,
      waterMl,
      currentKg: weightLogs.at(-1)?.kg ?? profile?.startWeightKg ?? null,
      trend: weightTrend(weightLogs),
      streaks: {
        workout: currentStreak(streakSet('WORKOUT_COMPLETED'), today),
        protein: currentStreak(streakSet('PROTEIN_GOAL_HIT'), today),
        water: currentStreak(streakSet('WATER_GOAL_HIT'), today),
      },
      totalXp,
      weeklyAvgKcal: trackedAverage([...perDayKcal.values()]),
      weeklyAvgProtein: trackedAverage([...perDayProtein.values()]),
      workoutsThisWeek,
      todayWorkout: todayWorkout ?? null,
    };
  }, [today]);

  const goals = data?.goals ?? null;
  const macros = data?.macros ?? ZERO;
  const name = data?.profile?.name;
  const bmiValue =
    data?.currentKg != null && data.profile ? bmi(data.currentKg, data.profile.heightCm) : null;

  const splitDay = data?.profile
    ? getSplitTemplate(data.profile.splitId)?.schedule[weekdayOf(today)]
    : undefined;
  const isRestDay = !splitDay || !('exerciseIds' in splitDay);
  const level = levelProgress(data?.totalXp ?? 0);

  return (
    <div className="flex flex-col gap-4">
      <ScreenHeader
        title={name ? `${greeting(now.getHours())}, ${name}` : greeting(now.getHours())}
        subtitle={dateLabel}
      />
      <p className="-mt-2 text-sm italic text-muted">“{quoteForDay(today, quotes)}”</p>

      {/* calorie ring + macro bars */}
      <Card className="flex flex-col items-center gap-2 py-6">
        <ProgressRing
          value={goals && goals.calories > 0 ? macros.kcal / goals.calories : 0}
          aria-label="Calories today"
        >
          <span className="metric text-4xl font-bold">{Math.round(macros.kcal)}</span>
          <span className="text-xs text-muted">{goals ? `of ${goals.calories} kcal` : 'kcal today'}</span>
        </ProgressRing>
        <div className="mt-3 w-full px-1">
          <MacroBars totals={macros} proteinGoal={goals?.proteinG} />
        </div>
      </Card>

      {/* water card with quick +250 */}
      <Card className="flex items-center gap-4">
        <button
          type="button"
          onClick={() => navigate('/water')}
          className="flex flex-1 items-center gap-3 text-left"
          aria-label="Open water"
        >
          <span className="flex h-10 w-10 items-center justify-center rounded-control bg-surface-2 text-[#38bdf8]">
            <IconDrop size={20} />
          </span>
          <span>
            <span className="metric block text-lg font-semibold">
              {data?.waterMl ?? 0}
              <span className="ml-1 text-sm font-normal text-muted">
                {goals ? `/ ${goals.waterMl} ml` : 'ml'}
              </span>
            </span>
            <span className="block text-xs text-muted">Water today</span>
          </span>
        </button>
        <Button
          size="sm"
          variant="secondary"
          onClick={async () => {
            const t = todayKey();
            const d = new Date();
            const time = `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
            await addWater(t, 250, time);
            const awarded = await evaluateWaterGoal(t);
            showToast(awarded ? 'Water goal hit +20 XP' : '+250 ml logged', 'success');
          }}
        >
          <IconPlus size={16} /> 250
        </Button>
      </Card>

      {/* today's workout card */}
      <Card className="flex items-center gap-3">
        <span className="flex h-10 w-10 items-center justify-center rounded-control bg-surface-2 text-muted">
          <IconDumbbell size={20} />
        </span>
        <div className="flex-1">
          <p className="text-sm font-medium">
            {isRestDay ? 'Rest day' : splitDay && 'label' in splitDay ? `${splitDay.label} day` : ''}
          </p>
          <p className="text-xs text-muted">
            {isRestDay
              ? 'Recovery is part of the plan.'
              : data?.todayWorkout?.completed
                ? 'Session complete — nice work.'
                : data?.todayWorkout
                  ? 'Session in progress'
                  : splitDay && 'exerciseIds' in splitDay
                    ? `${splitDay.exerciseIds.length} exercises planned`
                    : ''}
          </p>
        </div>
        {!isRestDay ? (
          <Button size="sm" onClick={() => navigate('/workout')}>
            {data?.todayWorkout?.completed ? 'View' : data?.todayWorkout ? 'Resume' : 'Start'}
          </Button>
        ) : null}
      </Card>

      {/* streak row */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: 'Workout', value: data?.streaks.workout ?? 0 },
          { label: 'Protein', value: data?.streaks.protein ?? 0 },
          { label: 'Water', value: data?.streaks.water ?? 0 },
        ].map((s) => (
          <Card key={s.label} className="flex flex-col items-center gap-1 py-3">
            <span className="flex items-center gap-1">
              <span className={s.value > 0 ? 'text-ember' : 'text-muted/50'}>
                <IconFlame size={18} />
              </span>
              <span className="metric text-xl font-bold">{s.value}</span>
            </span>
            <span className="text-[11px] text-muted">{s.label}</span>
          </Card>
        ))}
      </div>

      {/* weight card with trend arrow */}
      <button type="button" onClick={() => setWeightOpen(true)} className="text-left" aria-label="Log weight">
        <Card className="flex items-center gap-4">
          <div className="flex-1">
            <p className="text-xs font-medium uppercase tracking-wide text-muted">Weight</p>
            <p className="metric text-2xl font-semibold">
              {data?.currentKg ?? '—'}
              <span className="ml-1 text-sm font-normal text-muted">kg</span>
            </p>
            <p className="text-xs text-muted">
              {goals ? `goal ${goals.weightKg} kg · ` : ''}BMI {bmiValue ?? '—'} (reference only)
            </p>
          </div>
          {data?.trend ? (
            <div
              className={`flex flex-col items-center ${
                data.trend.delta > 0.05
                  ? 'text-success'
                  : data.trend.delta < -0.05
                    ? 'text-accent'
                    : 'text-muted'
              }`}
            >
              <span className="text-xl leading-none">
                {data.trend.delta > 0.05 ? '↑' : data.trend.delta < -0.05 ? '↓' : '→'}
              </span>
              <span className="metric text-xs">
                {data.trend.delta > 0 ? '+' : ''}
                {data.trend.delta} kg
              </span>
              <span className="text-[10px] text-muted">7-day</span>
            </div>
          ) : null}
        </Card>
      </button>

      {/* XP level card */}
      <Card className="flex flex-col gap-2">
        <div className="flex items-baseline justify-between">
          <div>
            <span className="font-display text-sm font-semibold">Level {level.level}</span>
            <span className="ml-2 text-xs text-muted">{data?.totalXp ?? 0} XP</span>
          </div>
          <span className="text-xs text-muted">
            {Math.max(0, level.nextThreshold - (data?.totalXp ?? 0))} XP to level {level.level + 1}
          </span>
        </div>
        <div className="h-2 w-full overflow-hidden rounded-full bg-white/10">
          <div
            className="h-full rounded-full bg-ember transition-[width] duration-300 ease-out"
            style={{ width: `${Math.round(level.fraction * 100)}%` }}
          />
        </div>
      </Card>

      {/* Coach top-3 insights */}
      {data && data.topInsights.length > 0 ? (
        <button type="button" onClick={() => navigate('/more/coach')} className="text-left" aria-label="Open coach">
          <Card className="flex flex-col gap-2">
            <div className="flex items-center gap-2">
              <span className="text-accent">
                <IconSparkles size={16} />
              </span>
              <p className="text-xs font-medium uppercase tracking-wide text-muted">Coach</p>
            </div>
            {data.topInsights.map((insight) => (
              <p key={insight.id} className="text-sm text-text">
                {insight.message}
              </p>
            ))}
          </Card>
        </button>
      ) : null}

      {/* weekly mini-summary */}
      <Card className="flex flex-col gap-2">
        <p className="text-xs font-medium uppercase tracking-wide text-muted">This week</p>
        <div className="grid grid-cols-3 gap-2 text-center">
          <div>
            <p className="metric text-lg font-semibold">
              {data?.workoutsThisWeek ?? 0}
              <span className="text-sm font-normal text-muted">/{goals?.workoutsPerWeek ?? 0}</span>
            </p>
            <p className="text-[11px] text-muted">workouts</p>
          </div>
          <div>
            <p className="metric text-lg font-semibold">
              {data?.weeklyAvgKcal != null ? Math.round(data.weeklyAvgKcal) : '—'}
            </p>
            <p className="text-[11px] text-muted">avg kcal</p>
          </div>
          <div>
            <p className="metric text-lg font-semibold">
              {data?.weeklyAvgProtein != null ? Math.round(data.weeklyAvgProtein) : '—'}
              {data?.weeklyAvgProtein != null ? <span className="text-sm font-normal text-muted"> g</span> : null}
            </p>
            <p className="text-[11px] text-muted">avg protein</p>
          </div>
        </div>
      </Card>

      <Sheet open={weightOpen} onClose={() => setWeightOpen(false)} title="Log weight">
        <Card variant="surface-2">
          <WeightQuickPanel dayKey={today} onSaved={() => setWeightOpen(false)} />
        </Card>
      </Sheet>
    </div>
  );
}
