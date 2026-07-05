import { useLiveQuery } from 'dexie-react-hooks';
import { motion, useReducedMotion } from 'framer-motion';

import { Card } from '../../components/Card';
import { ScreenHeader } from '../../components/ScreenHeader';
import { getGoals } from '../../db/repositories/goalsRepo';
import { waterLogsByDay, waterTotalsByDays } from '../../db/repositories/waterRepo';
import { lastNDayKeys, todayKey } from '../../lib/dates';
import { trackedAverage } from '../../lib/analytics';
import { WaterQuickPanel } from './WaterQuickPanel';

function BottleFill({ fraction }: { fraction: number }) {
  const reducedMotion = useReducedMotion();
  const clamped = Math.max(0, Math.min(1, fraction));
  // Bottle inner region: y from 20 (top) to 150 (bottom), height 130.
  const innerTop = 20;
  const innerHeight = 130;
  const fillHeight = innerHeight * clamped;
  const fillY = innerTop + (innerHeight - fillHeight);

  return (
    <svg width={120} height={170} viewBox="0 0 120 170" aria-hidden className="mx-auto">
      <defs>
        <linearGradient id="water-fill" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#38bdf8" />
          <stop offset="100%" stopColor="#0ea5e9" />
        </linearGradient>
        <clipPath id="bottle-clip">
          <path d="M44 8 h32 v10 q0 6 4 10 l6 8 q8 10 8 24 v70 q0 20 -20 20 h-28 q-20 0 -20 -20 v-70 q0 -14 8 -24 l6 -8 q4 -4 4 -10 v-10 z" />
        </clipPath>
      </defs>
      <g clipPath="url(#bottle-clip)">
        <rect x="0" y="0" width="120" height="170" fill="rgba(255,255,255,0.05)" />
        <motion.rect
          x="0"
          width="120"
          fill="url(#water-fill)"
          initial={reducedMotion ? false : { y: innerTop + innerHeight, height: 0 }}
          animate={{ y: fillY, height: fillHeight }}
          transition={reducedMotion ? { duration: 0 } : { type: 'spring', stiffness: 120, damping: 20 }}
        />
      </g>
      <path
        d="M44 8 h32 v10 q0 6 4 10 l6 8 q8 10 8 24 v70 q0 20 -20 20 h-28 q-20 0 -20 -20 v-70 q0 -14 8 -24 l6 -8 q4 -4 4 -10 v-10 z"
        fill="none"
        stroke="rgba(255,255,255,0.25)"
        strokeWidth="2"
      />
    </svg>
  );
}

export function WaterScreen() {
  const reducedMotion = useReducedMotion();
  const today = todayKey();
  const data = useLiveQuery(async () => {
    const [logs, goals, week, month] = await Promise.all([
      waterLogsByDay(today),
      getGoals(),
      waterTotalsByDays(lastNDayKeys(today, 7)),
      waterTotalsByDays(lastNDayKeys(today, 30)),
    ]);
    return {
      total: logs.reduce((s, l) => s + l.ml, 0),
      goalMl: goals?.waterMl ?? 0,
      weekAvg: trackedAverage([...week.values()]),
      monthAvg: trackedAverage([...month.values()]),
    };
  }, [today]);

  const total = data?.total ?? 0;
  const goalMl = data?.goalMl ?? 0;
  const fraction = goalMl > 0 ? total / goalMl : 0;
  const goalHit = goalMl > 0 && total >= goalMl;

  return (
    <div className="flex flex-col gap-4">
      <ScreenHeader title="Water" subtitle="Stay ahead of your goal" back />

      <Card className="flex flex-col items-center gap-3 py-6">
        <BottleFill fraction={fraction} />
        <div className="text-center">
          <p className="metric text-3xl font-bold">
            {total}
            <span className="ml-1 text-base font-normal text-muted">ml</span>
          </p>
          <p className="text-xs text-muted">
            {goalMl ? `${Math.round(fraction * 100)}% of ${goalMl} ml goal` : 'Set a water goal'}
          </p>
        </div>
        {goalHit ? (
          <motion.span
            initial={reducedMotion ? false : { scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="rounded-full bg-success/15 px-3 py-1 text-xs font-medium text-success"
          >
            Goal reached — nice.
          </motion.span>
        ) : null}
      </Card>

      <Card>
        <WaterQuickPanel dayKey={today} />
      </Card>

      <div className="grid grid-cols-2 gap-3">
        <Card className="flex flex-col gap-0.5">
          <p className="text-xs font-medium uppercase tracking-wide text-muted">7-day avg</p>
          <p className="metric text-2xl font-semibold">
            {data?.weekAvg != null ? Math.round(data.weekAvg) : '—'}
            <span className="ml-1 text-sm font-normal text-muted">ml/day</span>
          </p>
        </Card>
        <Card className="flex flex-col gap-0.5">
          <p className="text-xs font-medium uppercase tracking-wide text-muted">30-day avg</p>
          <p className="metric text-2xl font-semibold">
            {data?.monthAvg != null ? Math.round(data.monthAvg) : '—'}
            <span className="ml-1 text-sm font-normal text-muted">ml/day</span>
          </p>
        </Card>
      </div>
    </div>
  );
}
