import { render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';

import { ProgressRing } from './ProgressRing';

const realMatchMedia = window.matchMedia;

function mockReducedMotion(matches: boolean) {
  window.matchMedia = (query: string): MediaQueryList =>
    ({
      matches: query.includes('prefers-reduced-motion') ? matches : false,
      media: query,
      onchange: null,
      addListener: () => undefined,
      removeListener: () => undefined,
      addEventListener: () => undefined,
      removeEventListener: () => undefined,
      dispatchEvent: () => false,
    }) as MediaQueryList;
}

function ringDashOffset(container: HTMLElement): number {
  const circles = container.querySelectorAll('circle');
  const fill = circles[circles.length - 1];
  if (!fill) throw new Error('ring fill circle not found');
  return parseFloat(fill.style.strokeDashoffset || fill.getAttribute('stroke-dashoffset') || '');
}

describe('ProgressRing', () => {
  afterEach(() => {
    window.matchMedia = realMatchMedia;
  });

  it('exposes progress via aria attributes', () => {
    render(<ProgressRing value={0.42} aria-label="Calories" />);
    const ring = screen.getByRole('progressbar', { name: 'Calories' });
    expect(ring.getAttribute('aria-valuenow')).toBe('42');
  });

  it('clamps values outside 0–1', () => {
    const { rerender } = render(<ProgressRing value={1.8} aria-label="Over" />);
    expect(screen.getByRole('progressbar').getAttribute('aria-valuenow')).toBe('100');
    rerender(<ProgressRing value={-0.5} aria-label="Over" />);
    expect(screen.getByRole('progressbar').getAttribute('aria-valuenow')).toBe('0');
  });

  it('starts the sweep from empty when motion is allowed', () => {
    mockReducedMotion(false);
    const size = 168;
    const strokeWidth = 12;
    const circumference = 2 * Math.PI * ((size - strokeWidth) / 2);
    const { container } = render(<ProgressRing value={0.5} size={size} strokeWidth={strokeWidth} />);
    // sweep begins at full offset (empty ring) and animates toward the value
    expect(ringDashOffset(container)).toBeCloseTo(circumference, 1);
  });

  it('renders center content', () => {
    render(
      <ProgressRing value={0}>
        <span>1240 kcal</span>
      </ProgressRing>,
    );
    expect(screen.getByText('1240 kcal')).toBeTruthy();
  });
});
