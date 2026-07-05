import { describe, expect, it } from 'vitest';

import { dailySeries, rangeDayKeys, weeklyWorkoutCounts } from './chartData';

describe('chartData', () => {
  it('rangeDayKeys ends at today, oldest first', () => {
    const keys = rangeDayKeys('2026-07-05', 7);
    expect(keys).toHaveLength(7);
    expect(keys[0]).toBe('2026-06-29');
    expect(keys.at(-1)).toBe('2026-07-05');
  });

  it('dailySeries fills gaps with null and adds a rolling weight average', () => {
    const days = rangeDayKeys('2026-07-05', 3); // 07-03,07-04,07-05
    const series = dailySeries(days, {
      weightByDay: new Map([
        ['2026-07-03', 70],
        ['2026-07-05', 71],
      ]),
      kcalByDay: new Map([['2026-07-04', 2800]]),
      proteinByDay: new Map(),
      waterByDay: new Map([['2026-07-05', 3000]]),
    });
    expect(series.map((p) => p.weight)).toEqual([70, null, 71]);
    expect(series[1]?.kcal).toBe(2800);
    expect(series[0]?.protein).toBeNull();
    expect(series.at(-1)?.water).toBe(3000);
    // trailing rolling avg over logged points: day3 = mean(70,71)
    expect(series.at(-1)?.weightAvg).toBeCloseTo(70.5, 5);
  });

  it('weeklyWorkoutCounts groups by Monday-start week and zero-fills', () => {
    const days = rangeDayKeys('2026-07-05', 14); // spans two Mon-start weeks
    const weeks = weeklyWorkoutCounts(days, ['2026-06-29', '2026-07-01', '2026-07-04']);
    // week of 06-29 has 3 completed days; the other week has 0
    const wk1 = weeks.find((w) => w.weekStart === '2026-06-29');
    expect(wk1?.workouts).toBe(3);
    expect(weeks.some((w) => w.workouts === 0)).toBe(true);
  });

  it('ignores workouts outside the range', () => {
    const days = rangeDayKeys('2026-07-05', 7);
    const weeks = weeklyWorkoutCounts(days, ['2026-01-01']);
    expect(weeks.every((w) => w.workouts === 0)).toBe(true);
  });
});
