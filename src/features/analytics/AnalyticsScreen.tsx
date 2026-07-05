import { useLiveQuery } from 'dexie-react-hooks';
import { useState } from 'react';

import { Button } from '../../components/Button';
import { Card } from '../../components/Card';
import { ProgressRing } from '../../components/ProgressRing';
import { ScreenHeader } from '../../components/ScreenHeader';
import { buildReport, type ReportMetric, type ReportPeriod } from '../../db/repositories/analyticsRepo';
import { todayKey } from '../../lib/dates';

function metricValue(m: ReportMetric): string {
  if (m.value === null) return '—';
  if (m.unit === 'kg/wk') return `${m.value >= 0 ? '+' : ''}${m.value.toFixed(2)}`;
  if (m.unit === '%' || m.unit === 'ml' || m.unit === 'kcal') return String(Math.round(m.value));
  if (m.unit === 'g') return String(Math.round(m.value));
  return m.value.toFixed(1);
}

function deltaLabel(m: ReportMetric): { text: string; className: string } | null {
  if (m.delta === null || Math.abs(m.delta) < 0.05) return null;
  const up = m.delta > 0;
  const mag = m.unit === 'h' ? m.delta.toFixed(1) : String(Math.round(Math.abs(m.delta)));
  return {
    text: `${up ? '▲' : '▼'} ${m.unit === 'h' ? Math.abs(Number(mag)) : mag} ${m.unit}`,
    className: up ? 'text-success' : 'text-accent',
  };
}

export function AnalyticsScreen() {
  const [period, setPeriod] = useState<ReportPeriod>('week');
  const today = todayKey();
  const report = useLiveQuery(() => buildReport(period, today), [period, today]);

  const health = report?.scores.find((s) => s.key === 'health');
  const otherScores = report?.scores.filter((s) => s.key !== 'health') ?? [];

  return (
    <div className="flex flex-col gap-4">
      <ScreenHeader
        title="Analytics"
        subtitle="Weekly and monthly reports"
        back
        trailing={
          <Button size="sm" variant="secondary" onClick={() => window.print()} className="no-print">
            Print
          </Button>
        }
      />

      <div className="no-print flex gap-2">
        {(['week', 'month'] as ReportPeriod[]).map((p) => (
          <button
            key={p}
            type="button"
            onClick={() => setPeriod(p)}
            className={`flex-1 rounded-control border py-2 text-sm font-medium capitalize transition-colors duration-150 ${
              period === p ? 'border-accent/60 bg-accent/10 text-text' : 'bg-surface-2 text-muted'
            }`}
          >
            {p === 'week' ? 'This week' : 'This month'}
          </button>
        ))}
      </div>

      {!report ? (
        <div className="flex h-40 items-center justify-center" role="status" aria-label="Loading">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-white/10 border-t-accent" />
        </div>
      ) : (
        <div className="print-report flex flex-col gap-4">
          <div className="hidden print:block">
            <h1 className="font-display text-xl font-bold">Forge — {report.periodLabel} report</h1>
          </div>

          <Card className="flex items-center gap-4">
            <ProgressRing value={(health?.value ?? 0) / 100} size={104} strokeWidth={9} aria-label="Health score">
              <span className="metric text-2xl font-bold">{health?.value ?? 0}</span>
              <span className="text-[10px] text-muted">/100</span>
            </ProgressRing>
            <div className="flex-1">
              <p className="font-display text-sm font-semibold">Health score</p>
              <p className="text-xs text-muted">
                {report.periodLabel} · weighted across nutrition, training, recovery, hydration
              </p>
              {report.healthDelta !== null && Math.abs(report.healthDelta) >= 0.5 ? (
                <p className={`mt-1 text-xs ${report.healthDelta > 0 ? 'text-success' : 'text-accent'}`}>
                  {report.healthDelta > 0 ? '▲' : '▼'} {Math.abs(Math.round(report.healthDelta))} vs previous
                </p>
              ) : null}
            </div>
          </Card>

          <div className="grid grid-cols-2 gap-3">
            {otherScores.map((s) => (
              <Card key={s.key} className="flex flex-col gap-2">
                <div className="flex items-baseline justify-between">
                  <span className="text-xs font-medium text-muted">{s.label}</span>
                  <span className="metric text-lg font-semibold">{s.value}</span>
                </div>
                <div className="h-1.5 w-full overflow-hidden rounded-full bg-white/10">
                  <div
                    className="h-full rounded-full bg-accent"
                    style={{ width: `${Math.min(100, s.value)}%` }}
                  />
                </div>
              </Card>
            ))}
          </div>

          <Card className="flex flex-col gap-1">
            <p className="mb-1 text-xs font-medium uppercase tracking-wide text-muted">Metrics</p>
            {report.metrics.map((m) => {
              const d = deltaLabel(m);
              return (
                <div key={m.key} className="flex items-center justify-between border-b border-white/5 py-2 last:border-0">
                  <span className="text-sm text-muted">{m.label}</span>
                  <span className="flex items-baseline gap-2">
                    <span className="metric text-sm font-semibold">
                      {metricValue(m)}
                      <span className="ml-1 text-xs font-normal text-muted">{m.unit}</span>
                    </span>
                    {d ? <span className={`text-[11px] ${d.className}`}>{d.text}</span> : null}
                  </span>
                </div>
              );
            })}
          </Card>
        </div>
      )}
    </div>
  );
}
