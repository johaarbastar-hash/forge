import { describe, expect, it } from 'vitest';

import { bestStreak, currentStreak } from './streaks';

describe('streaks', () => {
  it('counts consecutive days ending today', () => {
    const logged = new Set(['2026-07-02', '2026-07-03', '2026-07-04']);
    expect(currentStreak(logged, '2026-07-04')).toBe(3);
  });

  it('a gap breaks the streak', () => {
    const logged = new Set(['2026-07-01', '2026-07-03', '2026-07-04']);
    expect(currentStreak(logged, '2026-07-04')).toBe(2);
  });

  it('today not yet logged keeps yesterday-ending streak alive', () => {
    const logged = new Set(['2026-07-01', '2026-07-02', '2026-07-03']);
    expect(currentStreak(logged, '2026-07-04')).toBe(3);
  });

  it('two unlogged days means the streak is dead', () => {
    const logged = new Set(['2026-07-01', '2026-07-02']);
    expect(currentStreak(logged, '2026-07-04')).toBe(0);
  });

  it('survives month boundaries', () => {
    const logged = new Set(['2026-01-30', '2026-01-31', '2026-02-01']);
    expect(currentStreak(logged, '2026-02-01')).toBe(3);
  });

  it('survives leap-year February boundaries', () => {
    const logged = new Set(['2024-02-28', '2024-02-29', '2024-03-01']);
    expect(currentStreak(logged, '2024-03-01')).toBe(3);
  });

  it('bestStreak finds the longest run anywhere in history', () => {
    const logged = new Set([
      '2026-05-01',
      '2026-05-02',
      // gap
      '2026-06-29',
      '2026-06-30',
      '2026-07-01',
      '2026-07-02',
      // gap
      '2026-07-04',
    ]);
    expect(bestStreak(logged)).toBe(4);
  });

  it('empty history → zero streaks', () => {
    expect(currentStreak(new Set(), '2026-07-04')).toBe(0);
    expect(bestStreak(new Set())).toBe(0);
  });
});
