import type { DailyMissionDef, WeeklyChallengeDef } from '../types';

// SPEC §5.11 — daily missions are generated from goals each day; the workout
// mission is skipped on rest days. Evaluation logic lands in Phase 7.
export const dailyMissionDefs: DailyMissionDef[] = [
  { id: 'water_goal', title: 'Drink your water goal', skipOnRestDay: false },
  { id: 'protein_goal', title: 'Hit your protein goal', skipOnRestDay: false },
  { id: 'workout', title: 'Finish the scheduled workout', skipOnRestDay: true },
  { id: 'sleep_goal', title: 'Sleep your goal or more', skipOnRestDay: false },
];

// Weekly challenges run Monday–Sunday.
export const weeklyChallengeDefs: WeeklyChallengeDef[] = [
  { id: 'train_n_days', title: 'Train your weekly target of days' },
  { id: 'protein_every_tracked_day', title: 'Hit protein on every tracked day' },
  { id: 'log_weight_3x', title: 'Log your weight 3 times or more' },
];
