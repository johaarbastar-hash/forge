import { describe, expect, it } from 'vitest';

import { quotes } from '../data/quotes';
import { bmi } from './bmi';
import { quoteForDay } from './quotes';

describe('bmi', () => {
  it('kg / m², rounded to 1 decimal', () => {
    expect(bmi(70, 175)).toBe(22.9); // 70 / 1.75² = 22.857
    expect(bmi(58, 170)).toBe(20.1);
  });

  it('guards invalid input', () => {
    expect(bmi(0, 175)).toBe(0);
    expect(bmi(70, 0)).toBe(0);
  });
});

describe('daily quote', () => {
  it('ships 30 quotes', () => {
    expect(quotes).toHaveLength(30);
  });

  it('is deterministic per dayKey and always from the list', () => {
    const q1 = quoteForDay('2026-07-04', quotes);
    const q2 = quoteForDay('2026-07-04', quotes);
    expect(q1).toBe(q2);
    expect(quotes).toContain(q1);
    // different days can differ (not required, but the hash must vary somewhere)
    const spread = new Set(
      Array.from({ length: 30 }, (_, i) =>
        quoteForDay(`2026-07-${String(i + 1).padStart(2, '0')}`, quotes),
      ),
    );
    expect(spread.size).toBeGreaterThan(5);
  });
});
