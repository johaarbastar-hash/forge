import {
  Bar,
  BarChart,
  CartesianGrid,
  ComposedChart,
  Line,
  LineChart,
  ReferenceLine,
  ResponsiveContainer,
  Scatter,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';

import { Card } from '../../components/Card';
import type { DailyPoint, WeeklyPoint } from './chartData';

const AXIS = { stroke: '#52525b', fontSize: 10 };
const GRID = 'rgba(255,255,255,0.06)';
const MARGIN = { top: 6, right: 10, bottom: 0, left: 4 } as const;

/** Compact axis numbers: 2800 → "2.8k", 71.3 → "71". */
const compact = (n: number): string =>
  Math.abs(n) >= 1000 ? `${(n / 1000).toFixed(1).replace(/\.0$/, '')}k` : String(Math.round(n));
const TOOLTIP_STYLE = {
  background: '#1C1C21',
  border: '1px solid rgba(255,255,255,0.1)',
  borderRadius: 12,
  fontSize: 12,
} as const;

function ChartCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <Card className="flex flex-col gap-2">
      <p className="text-xs font-medium uppercase tracking-wide text-muted">{title}</p>
      <div className="h-44 w-full">
        <ResponsiveContainer width="100%" height="100%">
          {children}
        </ResponsiveContainer>
      </div>
    </Card>
  );
}

export function WeightChart({ data }: { data: DailyPoint[] }) {
  return (
    <ChartCard title="Weight (raw + 7-day avg)">
      <ComposedChart data={data} margin={MARGIN}>
        <CartesianGrid stroke={GRID} vertical={false} />
        <XAxis dataKey="label" {...AXIS} tickLine={false} minTickGap={24} />
        <YAxis
          {...AXIS}
          tickLine={false}
          domain={['dataMin - 1', 'dataMax + 1']}
          width={34}
          tickFormatter={compact}
        />
        <Tooltip contentStyle={TOOLTIP_STYLE} labelStyle={{ color: '#A1A1AA' }} />
        <Scatter dataKey="weight" fill="#A1A1AA" />
        <Line type="monotone" dataKey="weightAvg" stroke="#EF4444" strokeWidth={2} dot={false} connectNulls />
      </ComposedChart>
    </ChartCard>
  );
}

function GoalLineChart({
  title,
  data,
  dataKey,
  goal,
  color,
}: {
  title: string;
  data: DailyPoint[];
  dataKey: 'kcal' | 'protein' | 'water';
  goal: number | undefined;
  color: string;
}) {
  return (
    <ChartCard title={title}>
      <LineChart data={data} margin={MARGIN}>
        <CartesianGrid stroke={GRID} vertical={false} />
        <XAxis dataKey="label" {...AXIS} tickLine={false} minTickGap={24} />
        <YAxis
          {...AXIS}
          tickLine={false}
          width={34}
          tickFormatter={compact}
          // keep the goal reference line in view even when logs fall short of it
          domain={[0, (dataMax: number) => Math.ceil(Math.max(dataMax, goal ?? 0) * 1.05)]}
        />
        <Tooltip contentStyle={TOOLTIP_STYLE} labelStyle={{ color: '#A1A1AA' }} />
        {goal && goal > 0 ? (
          <ReferenceLine y={goal} stroke="#22C55E" strokeDasharray="4 4" strokeOpacity={0.7} />
        ) : null}
        <Line type="monotone" dataKey={dataKey} stroke={color} strokeWidth={2} dot={false} connectNulls />
      </LineChart>
    </ChartCard>
  );
}

export function CaloriesChart({ data, goal }: { data: DailyPoint[]; goal?: number }) {
  return <GoalLineChart title="Calories vs goal" data={data} dataKey="kcal" goal={goal} color="#F97316" />;
}

export function ProteinChart({ data, goal }: { data: DailyPoint[]; goal?: number }) {
  return <GoalLineChart title="Protein vs goal" data={data} dataKey="protein" goal={goal} color="#EF4444" />;
}

export function WaterChart({ data, goal }: { data: DailyPoint[]; goal?: number }) {
  return <GoalLineChart title="Water vs goal" data={data} dataKey="water" goal={goal} color="#38bdf8" />;
}

export function WorkoutsChart({ data }: { data: WeeklyPoint[] }) {
  return (
    <ChartCard title="Workouts per week">
      <BarChart data={data} margin={MARGIN}>
        <CartesianGrid stroke={GRID} vertical={false} />
        <XAxis dataKey="label" {...AXIS} tickLine={false} />
        <YAxis {...AXIS} tickLine={false} width={28} allowDecimals={false} />
        <Tooltip contentStyle={TOOLTIP_STYLE} labelStyle={{ color: '#A1A1AA' }} cursor={{ fill: 'rgba(255,255,255,0.04)' }} />
        <Bar dataKey="workouts" fill="#EF4444" radius={[4, 4, 0, 0]} />
      </BarChart>
    </ChartCard>
  );
}

/** Small sparkline for a measurement field. */
export function Sparkline({ data }: { data: { value: number }[] }) {
  return (
    <div className="h-8 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 2, right: 2, bottom: 2, left: 2 }}>
          <Line type="monotone" dataKey="value" stroke="#EF4444" strokeWidth={1.5} dot={false} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
