import { create } from 'zustand';
import { persist } from 'zustand/middleware';

/**
 * Rest-timer state is a target end timestamp, never a decrementing counter
 * (SPEC / CLAUDE.md: timer logic uses timestamps). Remaining time is always
 * computed as `endsAt - Date.now()`, so throttled/backgrounded tabs and even a
 * reload stay in sync. Persisted to localStorage (transient UI state, allowed).
 */
export type RestTimerState = {
  endsAt: number | null;
  durationSec: number | null;
  start: (seconds: number) => void;
  stop: () => void;
};

export const useRestTimer = create<RestTimerState>()(
  persist(
    (set) => ({
      endsAt: null,
      durationSec: null,
      start: (seconds) => set({ endsAt: Date.now() + seconds * 1000, durationSec: seconds }),
      stop: () => set({ endsAt: null, durationSec: null }),
    }),
    { name: 'forge-rest-timer' },
  ),
);

/** Whole seconds remaining for a target timestamp (0 when past/absent). */
export function remainingSeconds(endsAt: number | null, now: number): number {
  if (endsAt === null) return 0;
  return Math.max(0, Math.ceil((endsAt - now) / 1000));
}
