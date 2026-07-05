import { useLiveQuery } from 'dexie-react-hooks';

import { Card } from '../../components/Card';
import { EmptyState } from '../../components/EmptyState';
import { ScreenHeader } from '../../components/ScreenHeader';
import { IconSparkles } from '../../components/icons';
import { buildCoachInput } from '../../db/repositories/analyticsRepo';
import { coachInsights } from '../../lib/coach';

const PRIORITY_LABEL: Record<number, { label: string; className: string }> = {
  1: { label: 'Urgent', className: 'bg-accent/15 text-accent' },
  2: { label: 'High', className: 'bg-warning/15 text-warning' },
  3: { label: 'Note', className: 'bg-white/10 text-muted' },
  4: { label: 'Win', className: 'bg-success/15 text-success' },
  5: { label: 'Note', className: 'bg-white/10 text-muted' },
};

export function CoachScreen() {
  const insights = useLiveQuery(async () => {
    const input = await buildCoachInput(new Date());
    return input ? coachInsights(input) : [];
  }, []);

  return (
    <div className="flex flex-col gap-4">
      <ScreenHeader title="Coach" subtitle="Direct, specific, on your side" back />

      {insights === undefined ? (
        <div className="flex h-40 items-center justify-center" role="status" aria-label="Loading">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-white/10 border-t-accent" />
        </div>
      ) : insights.length === 0 ? (
        <EmptyState
          icon={<IconSparkles size={24} />}
          title="All clear right now"
          body="No flags from your last 14 days. Keep logging — Coach speaks up when something needs attention."
        />
      ) : (
        <div className="flex flex-col gap-2">
          {insights.map((insight) => {
            const p = PRIORITY_LABEL[insight.priority] ?? PRIORITY_LABEL[5]!;
            return (
              <Card key={insight.id} className="flex flex-col gap-2">
                <div className="flex items-center justify-between">
                  <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase ${p.className}`}>
                    {p.label}
                  </span>
                  {insight.metric ? (
                    <span className="metric text-xs text-muted">{insight.metric}</span>
                  ) : null}
                </div>
                <p className="text-sm">{insight.message}</p>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
