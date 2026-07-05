import { describe, expect, it } from 'vitest';

import { type CoachInput, coachInsights } from './coach';

const base: CoachInput = {
  hour: 12,
  today: '2026-07-05',
  goals: { calories: 2750, proteinG: 110, waterMl: 3000, sleepH: 8, workoutsPerWeek: 6 },
  todayProteinG: 130,
  todayWaterMl: 3200,
  loggedToday: true,
  currentStreak: 5,
  last3SleepH: [8, 8, 8],
  last3Kcal: [2800, 2750, 2900],
  recent7WeightAvg: null,
  prior7WeightAvg: null,
  daysOfWeightData: 0,
  yesterdaySkippedLabel: null,
  weekWorkoutsDone: 2,
  weekWorkoutsTarget: 6,
  newPr: null,
  consecutiveTrainingDays: 0,
};

const ids = (input: CoachInput) => coachInsights(input).map((i) => i.id);

describe('coach rules (SPEC §5.12)', () => {
  it('a healthy mid-day state yields no insights', () => {
    expect(coachInsights(base)).toEqual([]);
  });

  it('protein_gap only after 18:00 and below goal', () => {
    expect(ids({ ...base, hour: 17, todayProteinG: 80 })).not.toContain('protein_gap');
    const out = coachInsights({ ...base, hour: 19, todayProteinG: 80 });
    const p = out.find((i) => i.id === 'protein_gap');
    expect(p?.message).toContain('30 g short');
    expect(p?.metric).toBe('80/110 g');
  });

  it('water_gap after 18:00, rounded to 50 ml', () => {
    const out = coachInsights({ ...base, hour: 20, todayWaterMl: 1800 });
    expect(out.find((i) => i.id === 'water_gap')?.message).toContain('1200 ml');
  });

  it('weight_on_track for +0.2–0.6 kg/wk', () => {
    expect(ids({ ...base, recent7WeightAvg: 70.4, prior7WeightAvg: 70.0, daysOfWeightData: 14 })).toContain(
      'weight_on_track',
    );
  });

  it('weight_too_fast for >0.8 kg/wk over 2 weeks', () => {
    expect(ids({ ...base, recent7WeightAvg: 71.0, prior7WeightAvg: 70.0, daysOfWeightData: 14 })).toContain(
      'weight_too_fast',
    );
  });

  it('weight_stalled when flat ±0.1 for 2 weeks', () => {
    expect(ids({ ...base, recent7WeightAvg: 70.05, prior7WeightAvg: 70.0, daysOfWeightData: 14 })).toContain(
      'weight_stalled',
    );
  });

  it('skipped_day when yesterday was a training day with no workout', () => {
    const out = coachInsights({ ...base, yesterdaySkippedLabel: 'Pull' });
    expect(out.find((i) => i.id === 'skipped_day')?.message).toContain('skipped Pull day');
  });

  it('consistency_praise when weekly target met', () => {
    expect(ids({ ...base, weekWorkoutsDone: 6, weekWorkoutsTarget: 6 })).toContain('consistency_praise');
  });

  it('sleep_low when 3-day avg < goal − 1 h', () => {
    expect(ids({ ...base, last3SleepH: [6, 6.5, 6] })).toContain('sleep_low');
    expect(ids({ ...base, last3SleepH: [7.5, 7, 7] })).not.toContain('sleep_low');
  });

  it('calories_low when 3-day avg < goal − 15%', () => {
    expect(ids({ ...base, last3Kcal: [2200, 2100, 2300] })).toContain('calories_low');
    expect(ids({ ...base, last3Kcal: [2600, 2500, 2500] })).not.toContain('calories_low');
  });

  it('streak_risk when streak ≥3, nothing today, after 20:00', () => {
    expect(ids({ ...base, hour: 21, loggedToday: false, currentStreak: 4 })).toContain('streak_risk');
    expect(ids({ ...base, hour: 19, loggedToday: false, currentStreak: 4 })).not.toContain('streak_risk');
  });

  it('pr_congrats reports the lift', () => {
    const out = coachInsights({ ...base, newPr: { exercise: 'Bench Press', weightKg: 100, reps: 5 } });
    expect(out.find((i) => i.id === 'pr_congrats')?.message).toContain('Bench Press: 100 kg × 5');
  });

  it('rest_reminder after 6 straight training days', () => {
    expect(ids({ ...base, consecutiveTrainingDays: 6 })).toContain('rest_reminder');
    expect(ids({ ...base, consecutiveTrainingDays: 5 })).not.toContain('rest_reminder');
  });

  it('sorts by priority, streak_risk first', () => {
    const out = coachInsights({
      ...base,
      hour: 21,
      loggedToday: false,
      currentStreak: 4,
      todayProteinG: 50,
    });
    expect(out[0]?.id).toBe('streak_risk'); // priority 1
    expect(out.map((i) => i.priority)).toEqual([...out.map((i) => i.priority)].sort((a, b) => a - b));
  });
});
