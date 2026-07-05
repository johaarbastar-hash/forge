import { describe, expect, it } from 'vitest';

import { remainingSeconds } from './restTimer';

describe('rest timer remaining (timestamp-based)', () => {
  const now = 1_000_000;

  it('computes whole seconds left from a target timestamp', () => {
    expect(remainingSeconds(now + 90_000, now)).toBe(90);
    expect(remainingSeconds(now + 1_500, now)).toBe(2); // rounds up partial second
  });

  it('is zero once past the end or when unset', () => {
    expect(remainingSeconds(now - 5_000, now)).toBe(0);
    expect(remainingSeconds(null, now)).toBe(0);
  });

  it('stays correct after a long background gap (tab switch)', () => {
    // 180s timer started, tab hidden ~120s, returns: ~60s should remain
    const endsAt = now + 180_000;
    const afterGap = now + 120_000;
    expect(remainingSeconds(endsAt, afterGap)).toBe(60);
  });
});
