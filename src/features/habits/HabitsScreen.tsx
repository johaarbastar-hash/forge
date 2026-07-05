import { useLiveQuery } from 'dexie-react-hooks';
import { useState } from 'react';

import { Button } from '../../components/Button';
import { Card } from '../../components/Card';
import { EmptyState } from '../../components/EmptyState';
import { Input } from '../../components/Input';
import { ScreenHeader } from '../../components/ScreenHeader';
import { Sheet } from '../../components/Sheet';
import { useToast } from '../../components/Toast';
import { IconCheck, IconClose, IconFlame, IconPlus } from '../../components/icons';
import {
  activeHabits,
  addCustomHabit,
  allHabitLogs,
  setHabitActive,
  setHabitDone,
} from '../../db/repositories/habitsRepo';
import { lastNDayKeys, todayKey } from '../../lib/dates';
import { bestStreak, currentStreak } from '../../lib/streaks';
import type { DayKey } from '../../types';

const DOW = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];

function dayInitial(dayKey: DayKey): string {
  // Monday-first index from the last-7 window is positional, but compute real DOW
  const day = new Date(`${dayKey}T00:00:00`).getDay(); // 0=Sun
  return DOW[(day + 6) % 7] ?? '';
}

export function HabitsScreen() {
  const { showToast } = useToast();
  const today = todayKey();
  const week = lastNDayKeys(today, 7);
  const [addOpen, setAddOpen] = useState(false);
  const [name, setName] = useState('');

  const data = useLiveQuery(async () => {
    const [habits, logs] = await Promise.all([activeHabits(), allHabitLogs()]);
    // per-habit set of done dayKeys
    const doneByHabit = new Map<string, Set<DayKey>>();
    for (const log of logs) {
      if (!log.done) continue;
      const set = doneByHabit.get(log.habitId) ?? new Set<DayKey>();
      set.add(log.dayKey);
      doneByHabit.set(log.habitId, set);
    }
    return { habits, doneByHabit };
  }, [today]);

  const toggle = (habitId: string, dayKey: DayKey, done: boolean) => {
    void setHabitDone(habitId, dayKey, !done);
  };

  const addHabit = async () => {
    if (!name.trim()) return;
    await addCustomHabit(name.trim(), 'check');
    setName('');
    setAddOpen(false);
    showToast('Habit added', 'success');
  };

  const hide = async (habitId: string) => {
    await setHabitActive(habitId, false);
    showToast('Habit hidden', 'info');
  };

  return (
    <div className="flex flex-col gap-4">
      <ScreenHeader
        title="Habits"
        subtitle="Small daily wins"
        back
        trailing={
          <Button size="sm" onClick={() => setAddOpen(true)}>
            <IconPlus size={16} /> New
          </Button>
        }
      />

      {!data ? (
        <div className="flex h-40 items-center justify-center" role="status" aria-label="Loading">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-white/10 border-t-accent" />
        </div>
      ) : data.habits.length === 0 ? (
        <EmptyState
          icon={<IconCheck size={24} />}
          title="No active habits"
          body="Add a habit like Gym, Stretching or Reading and check it off each day to build a streak."
          actionLabel="Add a habit"
          onAction={() => setAddOpen(true)}
        />
      ) : (
        <div className="flex flex-col gap-3">
          {/* weekday header */}
          <div className="flex items-center gap-2 px-1">
            <span className="flex-1" />
            {week.map((d) => (
              <span
                key={d}
                className={`w-7 text-center text-[10px] ${d === today ? 'font-bold text-accent' : 'text-muted'}`}
              >
                {dayInitial(d)}
              </span>
            ))}
          </div>

          {data.habits.map((habit) => {
            const done = data.doneByHabit.get(habit.id) ?? new Set<DayKey>();
            const cur = currentStreak(done, today);
            const best = bestStreak(done);
            return (
              <Card key={habit.id} className="flex flex-col gap-2 p-3">
                <div className="flex items-center gap-2">
                  <span className="flex-1 text-sm font-medium">{habit.name}</span>
                  <span className="flex items-center gap-1 text-xs text-muted">
                    <span className={cur > 0 ? 'text-ember' : 'text-muted/50'}>
                      <IconFlame size={14} />
                    </span>
                    {cur} · best {best}
                  </span>
                  <button
                    type="button"
                    aria-label={`Hide ${habit.name}`}
                    onClick={() => hide(habit.id)}
                    className="text-muted hover:text-accent"
                  >
                    <IconClose size={14} />
                  </button>
                </div>
                <div className="flex items-center gap-2">
                  <span className="flex-1" />
                  {week.map((d) => {
                    const isDone = done.has(d);
                    return (
                      <button
                        key={d}
                        type="button"
                        aria-label={`${habit.name} ${d} ${isDone ? 'done' : 'not done'}`}
                        aria-pressed={isDone}
                        onClick={() => toggle(habit.id, d, isDone)}
                        className={`flex h-7 w-7 items-center justify-center rounded-full border transition-colors duration-150 ${
                          isDone
                            ? 'border-accent bg-accent/20 text-accent'
                            : 'border-white/10 bg-surface-2 text-transparent hover:border-white/25'
                        }`}
                      >
                        <IconCheck size={14} />
                      </button>
                    );
                  })}
                </div>
              </Card>
            );
          })}
        </div>
      )}

      <Sheet open={addOpen} onClose={() => setAddOpen(false)} title="New habit">
        <div className="flex flex-col gap-4">
          <Input
            label="Habit name"
            placeholder="e.g. Cold shower"
            value={name}
            onChange={(e) => setName(e.target.value)}
            autoFocus
          />
          <Button onClick={addHabit} fullWidth size="lg">
            Add habit
          </Button>
        </div>
      </Sheet>
    </div>
  );
}
