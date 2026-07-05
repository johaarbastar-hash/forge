import { useLiveQuery } from 'dexie-react-hooks';
import { useState } from 'react';

import { Card } from '../../components/Card';
import { ScreenHeader } from '../../components/ScreenHeader';
import { IconChevronLeft, IconChevronRight } from '../../components/icons';
import { getGoals } from '../../db/repositories/goalsRepo';
import { mealsByDays } from '../../db/repositories/mealsRepo';
import { waterTotalsByDays } from '../../db/repositories/waterRepo';
import { allWeightLogs } from '../../db/repositories/weightRepo';
import { allWorkouts } from '../../db/repositories/workoutsRepo';
import { todayKey } from '../../lib/dates';
import type { DayKey } from '../../types';
import { monthGrid, monthLabel, shiftMonth } from './calendarGrid';
import { DayDetailSheet } from './DayDetailSheet';

const WEEKDAYS = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];

export function CalendarScreen() {
  const today = todayKey();
  const [{ year, month }, setYm] = useState(() => {
    const [y, m] = today.split('-').map(Number);
    return { year: y ?? 2026, month: m ?? 1 };
  });
  const [selected, setSelected] = useState<DayKey | null>(null);

  const weeks = monthGrid(year, month);
  const monthDays = weeks.flat().map((c) => c.dayKey);

  const dots = useLiveQuery(async () => {
    const [goals, meals, water, weightLogs, workouts] = await Promise.all([
      getGoals(),
      mealsByDays(monthDays),
      waterTotalsByDays(monthDays),
      allWeightLogs(),
      allWorkouts(),
    ]);
    const goalMl = goals?.waterMl ?? 0;
    const monthSet = new Set(monthDays);
    return {
      meal: new Set(meals.map((m) => m.dayKey)),
      workout: new Set(workouts.filter((w) => w.completed).map((w) => w.dayKey)),
      water: new Set([...water.entries()].filter(([, ml]) => goalMl > 0 && ml >= goalMl).map(([d]) => d)),
      weight: new Set(weightLogs.filter((w) => monthSet.has(w.dayKey)).map((w) => w.dayKey)),
    };
    // monthDays is derived from year/month, so keying on those is sufficient
  }, [year, month]);

  const DOTS: { key: 'meal' | 'workout' | 'water' | 'weight'; color: string }[] = [
    { key: 'meal', color: 'bg-warning' },
    { key: 'workout', color: 'bg-accent' },
    { key: 'water', color: 'bg-[#38bdf8]' },
    { key: 'weight', color: 'bg-success' },
  ];

  return (
    <div className="flex flex-col gap-4">
      <ScreenHeader title="Calendar" subtitle="Your month, day by day" back />

      <Card className="flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <button
            type="button"
            aria-label="Previous month"
            onClick={() => setYm((s) => shiftMonth(s.year, s.month, -1))}
            className="flex h-9 w-9 items-center justify-center rounded-control text-muted hover:bg-white/5 hover:text-text"
          >
            <IconChevronLeft size={20} />
          </button>
          <span className="font-display text-sm font-semibold">{monthLabel(year, month)}</span>
          <button
            type="button"
            aria-label="Next month"
            onClick={() => setYm((s) => shiftMonth(s.year, s.month, 1))}
            className="flex h-9 w-9 items-center justify-center rounded-control text-muted hover:bg-white/5 hover:text-text"
          >
            <IconChevronRight size={20} />
          </button>
        </div>

        <div className="grid grid-cols-7 gap-1 text-center text-[10px] text-muted">
          {WEEKDAYS.map((d, i) => (
            <span key={i}>{d}</span>
          ))}
        </div>

        <div className="grid grid-cols-7 gap-1">
          {weeks.flat().map((cell) => {
            const isToday = cell.dayKey === today;
            const isFuture = cell.dayKey > today;
            return (
              <button
                key={cell.dayKey}
                type="button"
                disabled={isFuture}
                onClick={() => setSelected(cell.dayKey)}
                className={`flex aspect-square flex-col items-center justify-center gap-0.5 rounded-control text-xs transition-colors ${
                  cell.inMonth ? 'text-text' : 'text-muted/30'
                } ${isToday ? 'bg-accent/15 font-bold text-accent' : 'hover:bg-white/5'} ${
                  isFuture ? 'opacity-40' : ''
                }`}
              >
                <span>{Number(cell.dayKey.slice(8))}</span>
                <span className="flex h-1.5 items-center gap-0.5">
                  {DOTS.map(({ key, color }) =>
                    dots?.[key].has(cell.dayKey) ? (
                      <span key={key} className={`h-1 w-1 rounded-full ${color}`} />
                    ) : null,
                  )}
                </span>
              </button>
            );
          })}
        </div>

        <div className="flex flex-wrap gap-x-3 gap-y-1 pt-1 text-[10px] text-muted">
          {DOTS.map(({ key, color }) => (
            <span key={key} className="flex items-center gap-1 capitalize">
              <span className={`h-1.5 w-1.5 rounded-full ${color}`} />
              {key === 'water' ? 'water goal' : key}
            </span>
          ))}
        </div>
      </Card>

      <DayDetailSheet
        open={selected !== null}
        onClose={() => setSelected(null)}
        dayKey={selected ?? today}
      />
    </div>
  );
}
