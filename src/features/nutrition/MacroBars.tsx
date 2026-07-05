import type { Macros } from '../../types';

type MacroBarsProps = {
  totals: Pick<Macros, 'proteinG' | 'carbsG' | 'fatG' | 'fiberG'>;
  proteinGoal?: number;
};

type Row = { key: string; label: string; grams: number; fraction: number; color: string };

/**
 * Protein / carbs / fat / fiber bars (SPEC §5.2). Protein fills toward its
 * goal; carbs/fat/fiber have no SPEC targets, so their bars are scaled
 * relative to the largest of the three (comparison, not goal-tracking).
 */
export function MacroBars({ totals, proteinGoal }: MacroBarsProps) {
  const otherMax = Math.max(totals.carbsG, totals.fatG, totals.fiberG, 1);
  const rows: Row[] = [
    {
      key: 'protein',
      label: 'Protein',
      grams: totals.proteinG,
      fraction: proteinGoal && proteinGoal > 0 ? totals.proteinG / proteinGoal : 0,
      color: 'bg-accent',
    },
    { key: 'carbs', label: 'Carbs', grams: totals.carbsG, fraction: totals.carbsG / otherMax, color: 'bg-warning' },
    { key: 'fat', label: 'Fat', grams: totals.fatG, fraction: totals.fatG / otherMax, color: 'bg-ember' },
    { key: 'fiber', label: 'Fiber', grams: totals.fiberG, fraction: totals.fiberG / otherMax, color: 'bg-success' },
  ];

  return (
    <div className="flex w-full flex-col gap-2.5">
      {rows.map((row) => (
        <div key={row.key} className="flex items-center gap-3">
          <span className="w-14 text-xs font-medium text-muted">{row.label}</span>
          <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-white/10">
            <div
              className={`h-full rounded-full ${row.color} transition-[width] duration-300 ease-out`}
              style={{ width: `${Math.round(Math.min(1, Math.max(0, row.fraction)) * 100)}%` }}
            />
          </div>
          <span className="metric w-14 text-right text-xs">
            {Math.round(row.grams)}
            <span className="text-muted"> g</span>
            {row.key === 'protein' && proteinGoal ? (
              <span className="text-muted">/{proteinGoal}</span>
            ) : null}
          </span>
        </div>
      ))}
    </div>
  );
}
