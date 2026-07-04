import type { Habit, Timestamps } from '../types';

export type SeedHabit = Omit<Habit, keyof Timestamps>;

const h = (id: string, name: string, icon: string): SeedHabit => ({
  id,
  name,
  icon,
  target: 'daily',
  isActive: true,
});

// SPEC §3 habits seed list.
export const seedHabits: SeedHabit[] = [
  h('habit-gym', 'Gym', 'dumbbell'),
  h('habit-stretching', 'Stretching', 'stretch'),
  h('habit-reading', 'Reading', 'book'),
  h('habit-meditation', 'Meditation', 'moon'),
  h('habit-water-goal', 'Water Goal', 'drop'),
  h('habit-protein-goal', 'Protein Goal', 'utensils'),
  h('habit-sleep-goal', 'Sleep Goal', 'sleep'),
  h('habit-steps', 'Steps', 'steps'),
];
