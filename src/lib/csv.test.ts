import { describe, expect, it } from 'vitest';

import { toCsv } from './csv';
import { parseDateQuery } from './dateParse';

describe('toCsv', () => {
  it('joins headers and rows', () => {
    expect(toCsv(['a', 'b'], [[1, 2], [3, 4]])).toBe('a,b\n1,2\n3,4');
  });

  it('quotes fields with commas, quotes or newlines', () => {
    expect(toCsv(['name', 'note'], [['Rice, cooked', 'he said "hi"']])).toBe(
      'name,note\n"Rice, cooked","he said ""hi"""',
    );
    expect(toCsv(['x'], [['a\nb']])).toBe('x\n"a\nb"');
  });
});

describe('parseDateQuery', () => {
  it('parses ISO dates', () => {
    expect(parseDateQuery('2026-07-12', 2026)).toBe('2026-07-12');
    expect(parseDateQuery('2026-13-40', 2026)).toBeNull();
  });

  it('parses "12 Jul" and "Jul 12" with default year', () => {
    expect(parseDateQuery('12 Jul', 2026)).toBe('2026-07-12');
    expect(parseDateQuery('Jul 12', 2026)).toBe('2026-07-12');
    expect(parseDateQuery('12 July 2025', 2026)).toBe('2025-07-12');
  });

  it('returns null for non-dates', () => {
    expect(parseDateQuery('chicken', 2026)).toBeNull();
    expect(parseDateQuery('', 2026)).toBeNull();
    expect(parseDateQuery('Jul', 2026)).toBeNull(); // no day
  });
});
