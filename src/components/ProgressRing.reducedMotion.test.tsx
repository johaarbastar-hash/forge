import { render } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

// framer-motion samples prefers-reduced-motion once per process, so this file
// forces `reduce` BEFORE the first motion render and keeps the test isolated
// from ProgressRing.test.tsx (vitest runs files in separate environments).
window.matchMedia = (query: string): MediaQueryList =>
  ({
    matches: query.includes('prefers-reduced-motion'),
    media: query,
    onchange: null,
    addListener: () => undefined,
    removeListener: () => undefined,
    addEventListener: () => undefined,
    removeEventListener: () => undefined,
    dispatchEvent: () => false,
  }) as MediaQueryList;

import { ProgressRing } from './ProgressRing';

describe('ProgressRing under prefers-reduced-motion', () => {
  it('skips the sweep and renders directly at its value', () => {
    const size = 168;
    const strokeWidth = 12;
    const circumference = 2 * Math.PI * ((size - strokeWidth) / 2);
    const { container } = render(
      <ProgressRing value={0.5} size={size} strokeWidth={strokeWidth} />,
    );
    const circles = container.querySelectorAll('circle');
    const fill = circles[circles.length - 1];
    if (!fill) throw new Error('ring fill circle not found');
    const offset = parseFloat(
      fill.style.strokeDashoffset || fill.getAttribute('stroke-dashoffset') || '',
    );
    expect(offset).toBeCloseTo(circumference * 0.5, 1);
  });
});
