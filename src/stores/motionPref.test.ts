import { renderHook, act } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { detectFlakyGpu, useAppReducedMotion, useMotionPref } from './motionPref';

describe('motion preference (Mali GPU mitigation)', () => {
  it('GPU detection is safely false where WebGL is unavailable (jsdom)', () => {
    expect(detectFlakyGpu()).toBe(false);
  });

  it('toggle forces reduced motion app-wide even when the OS allows motion', () => {
    // setup polyfill's matchMedia reports matches:false (OS allows motion)
    const { result, rerender } = renderHook(() => useAppReducedMotion());
    act(() => useMotionPref.getState().setReduceMotion(false));
    rerender();
    expect(result.current).toBe(false);

    act(() => useMotionPref.getState().setReduceMotion(true));
    rerender();
    expect(result.current).toBe(true);
  });

  it('persists the choice under the forge-reduce-motion key', () => {
    act(() => useMotionPref.getState().setReduceMotion(true));
    const stored = JSON.parse(localStorage.getItem('forge-reduce-motion') ?? '{}') as {
      state?: { reduceMotion?: boolean };
    };
    expect(stored.state?.reduceMotion).toBe(true);
  });
});
