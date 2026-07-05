import { useLiveQuery } from 'dexie-react-hooks';

import { Button } from '../../components/Button';
import { useToast } from '../../components/Toast';
import { evaluateWaterGoal } from '../../db/repositories/awardsRepo';
import { getGoals } from '../../db/repositories/goalsRepo';
import { addWater, undoLastWater, waterLogsByDay } from '../../db/repositories/waterRepo';

const INCREMENTS = [250, 500, 750, 1000];

function nowTime(): string {
  const d = new Date();
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
}

type WaterQuickPanelProps = { dayKey: string; compact?: boolean };

export function WaterQuickPanel({ dayKey, compact = false }: WaterQuickPanelProps) {
  const { showToast } = useToast();
  const data = useLiveQuery(async () => {
    const [logs, goals] = await Promise.all([waterLogsByDay(dayKey), getGoals()]);
    return { total: logs.reduce((s, l) => s + l.ml, 0), count: logs.length, goalMl: goals?.waterMl ?? 0 };
  }, [dayKey]);

  const total = data?.total ?? 0;
  const goalMl = data?.goalMl ?? 0;

  const add = async (ml: number) => {
    await addWater(dayKey, ml, nowTime());
    const awarded = await evaluateWaterGoal(dayKey);
    if (awarded) showToast('Water goal hit +20 XP', 'success');
  };

  const undo = async () => {
    const removed = await undoLastWater(dayKey);
    if (removed) showToast(`Removed ${removed.ml} ml`, 'info');
  };

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-baseline justify-between">
        <div>
          <span className="metric text-2xl font-bold">{total}</span>
          <span className="ml-1 text-sm text-muted">{goalMl ? `/ ${goalMl} ml` : 'ml'}</span>
        </div>
        <button
          type="button"
          onClick={undo}
          disabled={!data?.count}
          className="text-xs text-muted underline-offset-2 hover:text-text hover:underline disabled:opacity-40"
        >
          Undo last
        </button>
      </div>
      <div className={compact ? 'grid grid-cols-4 gap-2' : 'grid grid-cols-2 gap-2'}>
        {INCREMENTS.map((ml) => (
          <Button key={ml} variant="secondary" onClick={() => add(ml)} size={compact ? 'sm' : 'md'}>
            +{ml}
          </Button>
        ))}
      </div>
    </div>
  );
}
