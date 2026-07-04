import type { AchievementDef } from '../types';

// SPEC §5.11 — 12 achievements. Unlock conditions are evaluated in Phase 7;
// these are the definitions shown in the Achievements grid.
export const achievementDefs: AchievementDef[] = [
  { id: 'first_workout', title: 'First Forge', description: 'Finish your first workout.' },
  { id: 'streak_7', title: 'One Week Strong', description: 'Log something 7 days in a row.' },
  { id: 'streak_30', title: 'Iron Month', description: 'Log something 30 days in a row.' },
  { id: 'first_leg_day', title: 'Leg Day Initiate', description: 'Complete a workout with a legs exercise.' },
  { id: 'first_chest_day', title: 'Chest Opener', description: 'Complete a workout with a bench, incline or fly.' },
  { id: 'water_3l', title: 'Deep Reservoir', description: 'Drink 3,000 ml or more in one day.' },
  { id: 'first_protein_goal', title: 'Protein Baseline', description: 'Hit your protein goal for the first time.' },
  { id: 'gain_1kg', title: 'First Kilo', description: 'Weigh in 1.0 kg above your starting weight.' },
  { id: 'first_pr', title: 'Record Breaker', description: 'Set your first PR on any exercise.' },
  { id: 'meals_50', title: 'Fifty Plates', description: 'Log 50 meals.' },
  { id: 'level_5', title: 'Level Five', description: 'Reach level 5.' },
  { id: 'early_bird', title: 'Early Bird', description: 'Finish a workout before 08:00.' },
];
