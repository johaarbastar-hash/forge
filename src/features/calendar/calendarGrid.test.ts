import { describe, expect, it } from 'vitest';

import { daysInMonth, monthGrid, shiftMonth } from './calendarGrid';

describe('calendarGrid', () => {
  it('counts days per month incl. leap February', () => {
    expect(daysInMonth(2026, 7)).toBe(31);
    expect(daysInMonth(2026, 2)).toBe(28);
    expect(daysInMonth(2024, 2)).toBe(29);
  });

  it('builds Monday-first weeks with adjacent-month padding', () => {
    // July 2026: 1st is a Wednesday → week starts Mon 2026-06-29
    const weeks = monthGrid(2026, 7);
    expect(weeks[0]?.[0]?.dayKey).toBe('2026-06-29');
    expect(weeks[0]?.[0]?.inMonth).toBe(false);
    expect(weeks[0]?.[2]?.dayKey).toBe('2026-07-01');
    expect(weeks[0]?.[2]?.inMonth).toBe(true);
    // every row has 7 cells and all in-month days appear exactly once
    expect(weeks.every((w) => w.length === 7)).toBe(true);
    const inMonth = weeks.flat().filter((c) => c.inMonth).map((c) => c.dayKey);
    expect(inMonth).toHaveLength(31);
    expect(new Set(inMonth).size).toBe(31);
    expect(inMonth[0]).toBe('2026-07-01');
    expect(inMonth.at(-1)).toBe('2026-07-31');
  });

  it('shiftMonth wraps across year boundaries', () => {
    expect(shiftMonth(2026, 12, 1)).toEqual({ year: 2027, month: 1 });
    expect(shiftMonth(2026, 1, -1)).toEqual({ year: 2025, month: 12 });
    expect(shiftMonth(2026, 7, 3)).toEqual({ year: 2026, month: 10 });
  });
});
