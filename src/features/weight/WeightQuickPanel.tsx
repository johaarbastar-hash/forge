import { useLiveQuery } from 'dexie-react-hooks';
import { useEffect, useState } from 'react';

import { Button } from '../../components/Button';
import { Stepper } from '../../components/Stepper';
import { useToast } from '../../components/Toast';
import { awardWeightLogged } from '../../db/repositories/awardsRepo';
import { getProfile } from '../../db/repositories/profileRepo';
import { latestWeight, logWeight, weightByDay } from '../../db/repositories/weightRepo';

type WeightQuickPanelProps = { dayKey: string; onSaved?: () => void };

export function WeightQuickPanel({ dayKey, onSaved }: WeightQuickPanelProps) {
  const { showToast } = useToast();
  const seed = useLiveQuery(async () => {
    const [today, latest, profile] = await Promise.all([
      weightByDay(dayKey),
      latestWeight(),
      getProfile(),
    ]);
    return today?.kg ?? latest?.kg ?? profile?.startWeightKg ?? 70;
  }, [dayKey]);

  const [kg, setKg] = useState<number | null>(null);
  // Seed the stepper once the starting value resolves; keep user edits after.
  useEffect(() => {
    if (seed !== undefined && kg === null) setKg(seed);
  }, [seed, kg]);

  const [saving, setSaving] = useState(false);

  const save = async () => {
    if (kg === null) return;
    setSaving(true);
    try {
      await logWeight(dayKey, kg);
      const awarded = await awardWeightLogged(dayKey);
      showToast(awarded ? 'Weight logged +10 XP' : 'Weight updated', 'success');
      onSaved?.();
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="flex flex-col gap-4">
      <Stepper
        value={kg ?? seed ?? 70}
        onChange={setKg}
        step={0.1}
        min={25}
        max={250}
        unit="kg"
        label="Weight"
        format={(v) => v.toFixed(1)}
      />
      <Button onClick={save} disabled={saving || kg === null} fullWidth>
        {saving ? 'Saving…' : 'Save weight'}
      </Button>
    </div>
  );
}
