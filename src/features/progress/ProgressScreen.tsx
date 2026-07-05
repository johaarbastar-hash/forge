import { useLiveQuery } from 'dexie-react-hooks';
import { useState } from 'react';

import { ScreenHeader } from '../../components/ScreenHeader';
import { getGoals } from '../../db/repositories/goalsRepo';
import { mealsByDays } from '../../db/repositories/mealsRepo';
import { waterTotalsByDays } from '../../db/repositories/waterRepo';
import { allWeightLogs } from '../../db/repositories/weightRepo';
import { allWorkouts } from '../../db/repositories/workoutsRepo';
import { todayKey } from '../../lib/dates';
import type { DayKey } from '../../types';
import {
  type ChartRange,
  dailySeries,
  rangeDayKeys,
  weeklyWorkoutCounts,
} from './chartData';
import { MeasurementsSection } from './MeasurementsSection';
import { PhotosSection } from './PhotosSection';
import {
  CaloriesChart,
  ProteinChart,
  WaterChart,
  WeightChart,
  WorkoutsChart,
} from './ProgressCharts';

type Tab = 'charts' | 'body' | 'photos';
const RANGES: ChartRange[] = [7, 30, 90];

function ChartsTab() {
  const [range, setRange] = useState<ChartRange>(30);
  const today = todayKey();

  const data = useLiveQuery(async () => {
    const days = rangeDayKeys(today, range);
    const daySet = new Set(days);
    const [goals, weightLogs, meals, waterByDay, workouts] = await Promise.all([
      getGoals(),
      allWeightLogs(),
      mealsByDays(days),
      waterTotalsByDays(days),
      allWorkouts(),
    ]);

    const weightByDay = new Map<DayKey, number>();
    for (const w of weightLogs) if (daySet.has(w.dayKey)) weightByDay.set(w.dayKey, w.kg);

    const kcalByDay = new Map<DayKey, number>();
    const proteinByDay = new Map<DayKey, number>();
    for (const m of meals) {
      kcalByDay.set(m.dayKey, (kcalByDay.get(m.dayKey) ?? 0) + m.cachedMacros.kcal);
      proteinByDay.set(m.dayKey, (proteinByDay.get(m.dayKey) ?? 0) + m.cachedMacros.proteinG);
    }

    const completedDays = workouts.filter((w) => w.completed).map((w) => w.dayKey);

    return {
      goals: goals ?? null,
      series: dailySeries(days, { weightByDay, kcalByDay, proteinByDay, waterByDay }),
      weekly: weeklyWorkoutCounts(days, completedDays),
    };
  }, [today, range]);

  return (
    <div className="flex flex-col gap-4">
      <div className="flex gap-2">
        {RANGES.map((r) => (
          <button
            key={r}
            type="button"
            onClick={() => setRange(r)}
            className={`flex-1 rounded-control border py-2 text-sm font-medium transition-colors duration-150 ${
              range === r ? 'border-accent/60 bg-accent/10 text-text' : 'bg-surface-2 text-muted'
            }`}
          >
            {r} days
          </button>
        ))}
      </div>

      {!data ? (
        <div className="flex h-40 items-center justify-center" role="status" aria-label="Loading">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-white/10 border-t-accent" />
        </div>
      ) : (
        <>
          <WeightChart data={data.series} />
          <CaloriesChart data={data.series} goal={data.goals?.calories} />
          <ProteinChart data={data.series} goal={data.goals?.proteinG} />
          <WaterChart data={data.series} goal={data.goals?.waterMl} />
          <WorkoutsChart data={data.weekly} />
        </>
      )}
    </div>
  );
}

export function ProgressScreen() {
  const [tab, setTab] = useState<Tab>('charts');
  const tabs: { key: Tab; label: string }[] = [
    { key: 'charts', label: 'Charts' },
    { key: 'body', label: 'Body' },
    { key: 'photos', label: 'Photos' },
  ];

  return (
    <div className="flex flex-col gap-4">
      <ScreenHeader title="Progress" subtitle="Charts, measurements and photos" />

      <div className="flex gap-1 rounded-control bg-surface-2 p-1">
        {tabs.map((t) => (
          <button
            key={t.key}
            type="button"
            onClick={() => setTab(t.key)}
            className={`flex-1 rounded-[8px] py-1.5 text-sm font-medium transition-colors duration-150 ${
              tab === t.key ? 'bg-white/10 text-text' : 'text-muted'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === 'charts' ? <ChartsTab /> : tab === 'body' ? <MeasurementsSection /> : <PhotosSection />}
    </div>
  );
}
