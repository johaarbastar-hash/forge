import { describe, expect, it } from 'vitest';

import type { GoalHistoryEntry } from '../types';
import { goalValueOn, goalsOn } from './goalHistory';

type H = Pick<GoalHistoryEntry, 'field' | 'value' | 'effectiveFromDayKey' | 'createdAt'>;

const entry = (field: H['field'], value: number, from: string, createdAt = '2026-01-01T00:00:00Z'): H => ({
  field,
  value,
  effectiveFromDayKey: from,
  createdAt,
});

describe('goalHistory resolution (SPEC §5.9 — edits affect future days only)', () => {
  const history: H[] = [
    entry('proteinG', 110, '2026-07-01'),
    entry('proteinG', 130, '2026-07-10'),
    entry('calories', 3000, '2026-07-01'),
  ];

  it('days before an edit keep the old goal', () => {
    expect(goalValueOn(history, 'proteinG', '2026-07-05')).toBe(110);
    expect(goalValueOn(history, 'proteinG', '2026-07-09')).toBe(110);
  });

  it('the edit applies from its effective day forward', () => {
    expect(goalValueOn(history, 'proteinG', '2026-07-10')).toBe(130);
    expect(goalValueOn(history, 'proteinG', '2026-08-01')).toBe(130);
  });

  it('days before any entry have no value', () => {
    expect(goalValueOn(history, 'proteinG', '2026-06-30')).toBeUndefined();
  });

  it('same-day double edit: last write wins', () => {
    const doubled: H[] = [
      ...history,
      entry('proteinG', 140, '2026-07-10', '2026-07-10T08:00:00Z'),
      entry('proteinG', 150, '2026-07-10', '2026-07-10T09:00:00Z'),
    ];
    expect(goalValueOn(doubled, 'proteinG', '2026-07-10')).toBe(150);
  });

  it('goalsOn resolves per-field with fallback for gaps', () => {
    const fallback = {
      weightKg: 75,
      calories: 2800,
      proteinG: 100,
      waterMl: 3000,
      sleepH: 8,
      workoutsPerWeek: 6,
    };
    const resolved = goalsOn(history, '2026-07-15', fallback);
    expect(resolved.proteinG).toBe(130);
    expect(resolved.calories).toBe(3000);
    expect(resolved.waterMl).toBe(3000); // no history → fallback
    expect(resolved.weightKg).toBe(75);
  });
});
