import type { ReactNode } from 'react';

import { Card } from './Card';

type StatCardProps = {
  label: string;
  value: string;
  unit?: string;
  sub?: string;
  icon?: ReactNode;
};

export function StatCard({ label, value, unit, sub, icon }: StatCardProps) {
  return (
    <Card className="flex flex-col gap-1">
      <div className="flex items-center gap-2 text-muted">
        {icon}
        <span className="text-xs font-medium uppercase tracking-wide">{label}</span>
      </div>
      <div className="flex items-baseline gap-1">
        <span className="metric text-2xl font-semibold">{value}</span>
        {unit ? <span className="text-sm text-muted">{unit}</span> : null}
      </div>
      {sub ? <p className="text-xs text-muted">{sub}</p> : null}
    </Card>
  );
}
