import { zodResolver } from '@hookform/resolvers/zod';
import { useLiveQuery } from 'dexie-react-hooks';
import { useForm } from 'react-hook-form';
import { z } from 'zod';

import { Button } from '../../components/Button';
import { Card } from '../../components/Card';
import { Input } from '../../components/Input';
import { ScreenHeader } from '../../components/ScreenHeader';
import { StatCard } from '../../components/StatCard';
import { useToast } from '../../components/Toast';
import { IconCheck, IconScale } from '../../components/icons';
import { splitTemplates } from '../../data/splits';
import { getProfile, saveProfile } from '../../db/repositories/profileRepo';
import { latestWeight } from '../../db/repositories/weightRepo';
import { bmi } from '../../lib/bmi';
import type { Experience } from '../../types';

const num = (message: string) => z.number({ error: message });

const schema = z.object({
  name: z.string().trim().min(1, 'Name is required'),
  age: num('Enter your age').int('Whole years').min(10, 'Age 10–99').max(99, 'Age 10–99'),
  heightCm: num('Enter your height').min(100, '100–250 cm').max(250, '100–250 cm'),
  startWeightKg: num('Enter your start weight').min(25, '25–200 kg').max(200, '25–200 kg'),
  experience: z.enum(['beginner', 'intermediate', 'advanced']),
  splitId: z.string().min(1, 'Pick a split'),
});

type ProfileValues = z.infer<typeof schema>;

const EXPERIENCE_OPTIONS: { value: Experience; label: string }[] = [
  { value: 'beginner', label: 'Beginner' },
  { value: 'intermediate', label: 'Intermediate' },
  { value: 'advanced', label: 'Advanced' },
];

export function ProfileScreen() {
  const { showToast } = useToast();
  const data = useLiveQuery(async () => {
    const [profile, weight] = await Promise.all([getProfile(), latestWeight()]);
    return { profile: profile ?? null, currentKg: weight?.kg ?? profile?.startWeightKg ?? null };
  }, []);

  const profile = data?.profile;

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors, isDirty },
  } = useForm<ProfileValues>({
    resolver: zodResolver(schema),
    mode: 'onTouched',
    values: profile
      ? {
          name: profile.name,
          age: profile.age,
          heightCm: profile.heightCm,
          startWeightKg: profile.startWeightKg,
          experience: profile.experience,
          splitId: profile.splitId,
        }
      : undefined,
  });

  if (!data || !profile) {
    return (
      <div>
        <ScreenHeader title="Profile" subtitle="You, in numbers" back />
        <div className="flex h-40 items-center justify-center" role="status" aria-label="Loading">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-white/10 border-t-accent" />
        </div>
      </div>
    );
  }

  const heightForBmi = watch('heightCm') || profile.heightCm;
  const bmiValue = data.currentKg !== null ? bmi(data.currentKg, heightForBmi) : null;
  const experience = watch('experience');
  const splitId = watch('splitId');

  const onSubmit = handleSubmit(async (values) => {
    await saveProfile(values);
    showToast('Profile saved', 'success');
  });

  return (
    <div className="flex flex-col gap-4">
      <ScreenHeader title="Profile" subtitle="You, in numbers" back />

      <div className="grid grid-cols-2 gap-3">
        <StatCard
          label="Current weight"
          value={data.currentKg !== null ? String(data.currentKg) : '—'}
          unit="kg"
          icon={<IconScale size={16} />}
          sub="Latest weigh-in"
        />
        <StatCard
          label="BMI"
          value={bmiValue !== null ? String(bmiValue) : '—'}
          sub="Reference only"
        />
      </div>

      <Card>
        <form onSubmit={onSubmit} className="flex flex-col gap-4" noValidate>
          <Input label="Name" error={errors.name?.message} {...register('name')} />
          <Input
            label="Age (years)"
            type="number"
            inputMode="numeric"
            step="1"
            error={errors.age?.message}
            {...register('age', { valueAsNumber: true })}
          />
          <Input
            label="Height (cm)"
            type="number"
            inputMode="decimal"
            step="any"
            error={errors.heightCm?.message}
            {...register('heightCm', { valueAsNumber: true })}
          />
          <Input
            label="Start weight (kg)"
            type="number"
            inputMode="decimal"
            step="any"
            error={errors.startWeightKg?.message}
            {...register('startWeightKg', { valueAsNumber: true })}
          />

          <div>
            <p className="mb-1.5 text-sm font-medium text-muted">Experience</p>
            <div className="grid grid-cols-3 gap-2">
              {EXPERIENCE_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() =>
                    setValue('experience', opt.value, { shouldValidate: true, shouldDirty: true })
                  }
                  className={`rounded-control border px-2 py-2.5 text-xs font-medium transition-colors duration-150 ${
                    experience === opt.value
                      ? 'border-accent/60 bg-accent/10 text-text'
                      : 'bg-surface-2 text-muted hover:bg-white/10'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <p className="mb-1.5 text-sm font-medium text-muted">Split</p>
            <div className="flex flex-col gap-2">
              {splitTemplates.map((split) => (
                <button
                  key={split.id}
                  type="button"
                  onClick={() =>
                    setValue('splitId', split.id, { shouldValidate: true, shouldDirty: true })
                  }
                  className={`flex items-center justify-between rounded-control border px-3 py-2.5 text-left transition-colors duration-150 ${
                    splitId === split.id
                      ? 'border-accent/60 bg-accent/10'
                      : 'bg-surface-2 hover:bg-white/10'
                  }`}
                >
                  <span className="text-sm">{split.name}</span>
                  {splitId === split.id ? <IconCheck size={16} className="text-accent" /> : null}
                </button>
              ))}
            </div>
          </div>

          <Button type="submit" disabled={!isDirty} fullWidth>
            Save changes
          </Button>
        </form>
      </Card>
    </div>
  );
}
