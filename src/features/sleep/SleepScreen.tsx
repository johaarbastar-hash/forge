import { useLiveQuery } from 'dexie-react-hooks';
import { useEffect, useState } from 'react';

import { Button } from '../../components/Button';
import { Card } from '../../components/Card';
import { Input } from '../../components/Input';
import { ScreenHeader } from '../../components/ScreenHeader';
import { Stepper } from '../../components/Stepper';
import { useToast } from '../../components/Toast';
import { evaluateSleepGoal } from '../../db/repositories/awardsRepo';
import { getGoals } from '../../db/repositories/goalsRepo';
import { allSleepLogs, setSleep, sleepByDay } from '../../db/repositories/sleepRepo';
import { lastNDayKeys, todayKey } from '../../lib/dates';
import { trackedAverage } from '../../lib/analytics';

export function SleepScreen() {
  const { showToast } = useToast();
  const today = todayKey();

  const data = useLiveQuery(async () => {
    const [todayLog, goals, logs] = await Promise.all([sleepByDay(today), getGoals(), allSleepLogs()]);
    const week = new Set(lastNDayKeys(today, 7));
    const weekAvg = trackedAverage(logs.filter((l) => week.has(l.dayKey)).map((l) => l.hours));
    return { todayLog: todayLog ?? null, goalH: goals?.sleepH ?? 8, weekAvg };
  }, [today]);

  const [hours, setHours] = useState<number | null>(null);
  const [bedtime, setBedtime] = useState('');
  const [saving, setSaving] = useState(false);

  // Seed from an existing entry once, then keep user edits.
  useEffect(() => {
    if (!data) return;
    setHours((h) => (h === null ? (data.todayLog?.hours ?? data.goalH) : h));
    setBedtime((b) => (b === '' ? (data.todayLog?.bedtime ?? '') : b));
  }, [data]);

  const save = async () => {
    if (hours === null) return;
    setSaving(true);
    try {
      await setSleep(today, hours, bedtime || undefined);
      const awarded = await evaluateSleepGoal(today);
      showToast(awarded ? 'Sleep goal hit +20 XP' : 'Sleep logged', 'success');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="flex flex-col gap-4">
      <ScreenHeader title="Sleep" subtitle="Recovery is training too" back />

      <Card className="flex flex-col gap-4">
        <Stepper
          value={hours ?? data?.goalH ?? 8}
          onChange={setHours}
          step={0.5}
          min={0}
          max={14}
          unit="h"
          label="Hours slept"
          format={(v) => v.toFixed(1)}
        />
        <Input
          label="Bedtime (optional)"
          type="time"
          value={bedtime}
          onChange={(e) => setBedtime(e.target.value)}
        />
        <Button onClick={save} disabled={saving || hours === null} fullWidth>
          {saving ? 'Saving…' : 'Save sleep'}
        </Button>
      </Card>

      <div className="grid grid-cols-2 gap-3">
        <Card className="flex flex-col gap-0.5">
          <p className="text-xs font-medium uppercase tracking-wide text-muted">Goal</p>
          <p className="metric text-2xl font-semibold">
            {data?.goalH ?? '—'}
            <span className="ml-1 text-sm font-normal text-muted">h</span>
          </p>
        </Card>
        <Card className="flex flex-col gap-0.5">
          <p className="text-xs font-medium uppercase tracking-wide text-muted">7-day avg</p>
          <p className="metric text-2xl font-semibold">
            {data?.weekAvg != null ? data.weekAvg.toFixed(1) : '—'}
            <span className="ml-1 text-sm font-normal text-muted">h</span>
          </p>
        </Card>
      </div>
    </div>
  );
}
