import { describe, expect, it } from 'vitest';

import {
  isIntervalReminderDue,
  isTimeReminderDue,
  isWeeklyReminderDue,
  timeToMinutes,
} from './reminders';

describe('reminders due logic', () => {
  it('timeToMinutes', () => {
    expect(timeToMinutes('22:30')).toBe(1350);
    expect(timeToMinutes('00:00')).toBe(0);
  });

  it('time reminder fires once per day at/after its time', () => {
    // 13:00 target = 780 min
    expect(isTimeReminderDue('13:00', null, 779, '2026-07-05')).toBe(false); // before
    expect(isTimeReminderDue('13:00', null, 800, '2026-07-05')).toBe(true); // after, not fired
    expect(isTimeReminderDue('13:00', '2026-07-05', 800, '2026-07-05')).toBe(false); // already fired today
    expect(isTimeReminderDue('13:00', '2026-07-04', 800, '2026-07-05')).toBe(true); // fired yesterday
  });

  it('interval reminder respects the elapsed interval', () => {
    const now = 10_000_000;
    expect(isIntervalReminderDue(120, now - 60 * 60_000, now)).toBe(false); // 60 < 120 min
    expect(isIntervalReminderDue(120, now - 130 * 60_000, now)).toBe(true); // 130 ≥ 120
    expect(isIntervalReminderDue(0, 0, now)).toBe(false); // disabled interval
  });

  it('weekly reminder needs time reached and 7 days elapsed', () => {
    const now = 100 * 86_400_000; // day 100
    expect(isWeeklyReminderDue('08:00', now - 3 * 86_400_000, 500, now)).toBe(false); // 3 days
    expect(isWeeklyReminderDue('08:00', now - 8 * 86_400_000, 500, now)).toBe(true); // 8 days, after 08:00
    expect(isWeeklyReminderDue('08:00', now - 8 * 86_400_000, 400, now)).toBe(false); // before 08:00
  });
});
