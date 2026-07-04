import { describe, expect, it } from 'vitest';

import {
  addDaysToKey,
  fromDayKey,
  lastNDayKeys,
  toDayKey,
  weekKeys,
  weekStartKey,
  weekdayOf,
} from './dates';

describe('dates', () => {
  it('buckets by LOCAL calendar day, not UTC', () => {
    // 23:30 local on Jan 31 — toISOString() would flip this to Feb 1 in
    // west-of-UTC zones or stay Jan 31 elsewhere; toDayKey must always say Jan 31.
    const lateEvening = new Date(2026, 0, 31, 23, 30);
    expect(toDayKey(lateEvening)).toBe('2026-01-31');
    const justAfterMidnight = new Date(2026, 1, 1, 0, 10);
    expect(toDayKey(justAfterMidnight)).toBe('2026-02-01');
  });

  it('round-trips through fromDayKey at local midnight', () => {
    const d = fromDayKey('2026-07-04');
    expect(d.getFullYear()).toBe(2026);
    expect(d.getMonth()).toBe(6);
    expect(d.getDate()).toBe(4);
    expect(toDayKey(d)).toBe('2026-07-04');
  });

  it('adds days across month boundaries', () => {
    expect(addDaysToKey('2026-01-31', 1)).toBe('2026-02-01');
    expect(addDaysToKey('2026-03-01', -1)).toBe('2026-02-28');
    expect(addDaysToKey('2024-02-28', 1)).toBe('2024-02-29'); // leap year
  });

  it('weeks start on Monday', () => {
    // 2026-07-04 is a Saturday → its week starts Monday 2026-06-29
    expect(weekStartKey('2026-07-04')).toBe('2026-06-29');
    expect(weekStartKey('2026-06-29')).toBe('2026-06-29'); // Monday maps to itself
    expect(weekStartKey('2026-07-05')).toBe('2026-06-29'); // Sunday belongs to the same week
  });

  it('weekKeys returns Mon..Sun of the containing week', () => {
    const keys = weekKeys('2026-07-04');
    expect(keys).toEqual([
      '2026-06-29',
      '2026-06-30',
      '2026-07-01',
      '2026-07-02',
      '2026-07-03',
      '2026-07-04',
      '2026-07-05',
    ]);
  });

  it('lastNDayKeys ends at the given day, oldest first', () => {
    expect(lastNDayKeys('2026-03-02', 3)).toEqual(['2026-02-28', '2026-03-01', '2026-03-02']);
  });

  it('weekdayOf maps to mon..sun', () => {
    expect(weekdayOf('2026-06-29')).toBe('mon');
    expect(weekdayOf('2026-07-04')).toBe('sat');
    expect(weekdayOf('2026-07-05')).toBe('sun');
  });
});
