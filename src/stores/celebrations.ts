import { create } from 'zustand';

import type { AchievementId } from '../types';

export type Celebration =
  | { kind: 'level'; level: number }
  | { kind: 'achievement'; id: AchievementId };

type CelebrationState = {
  queue: Celebration[];
  enqueue: (c: Celebration) => void;
  dismiss: () => void;
};

/** FIFO queue of things to celebrate full-screen, one at a time. */
export const useCelebrations = create<CelebrationState>((set) => ({
  queue: [],
  enqueue: (c) => set((s) => ({ queue: [...s.queue, c] })),
  dismiss: () => set((s) => ({ queue: s.queue.slice(1) })),
}));
