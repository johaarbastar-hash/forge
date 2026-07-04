import { zodResolver } from '@hookform/resolvers/zod';
import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { useNavigate } from 'react-router-dom';
import { z } from 'zod';

import { Button } from '../../components/Button';
import { Input } from '../../components/Input';
import { IconCheck, IconFlame } from '../../components/icons';
import { splitTemplates } from '../../data/splits';
import { saveProfile } from '../../db/repositories/profileRepo';
import { saveGoals } from '../../db/repositories/goalsRepo';
import { todayKey } from '../../lib/dates';
import { suggestedGoals } from '../../lib/suggestions';
import type { Experience } from '../../types';

// zod v4: `error` covers the invalid-type case (empty input → NaN)
const num = (message: string) => z.number({ error: message });

const schema = z.object({
  name: z.string().trim().min(1, 'Tell us your name'),
  age: num('Enter your age').int('Whole years').min(10, 'Age 10–99').max(99, 'Age 10–99'),
  heightCm: num('Enter your height').min(100, '100–250 cm').max(250, '100–250 cm'),
  startWeightKg: num('Enter your weight').min(25, '25–200 kg').max(200, '25–200 kg'),
  goalWeightKg: num('Enter a goal weight').min(25, '25–250 kg').max(250, '25–250 kg'),
  experience: z.enum(['beginner', 'intermediate', 'advanced']),
  splitId: z.string().min(1, 'Pick a split'),
  calories: num('Required').min(1200, '≥ 1200').max(8000, '≤ 8000'),
  proteinG: num('Required').min(30, '≥ 30').max(400, '≤ 400'),
  waterMl: num('Required').min(500, '≥ 500').max(8000, '≤ 8000'),
  sleepH: num('Required').min(4, '4–14 h').max(14, '4–14 h'),
  workoutsPerWeek: num('Required').int().min(1, '1–7').max(7, '1–7'),
});

type WizardValues = z.infer<typeof schema>;

const STEP_FIELDS: (keyof WizardValues)[][] = [
  ['name', 'age'],
  ['heightCm', 'startWeightKg'],
  ['goalWeightKg', 'experience'],
  ['splitId'],
  ['calories', 'proteinG', 'waterMl', 'sleepH', 'workoutsPerWeek'],
];

const STEP_TITLES = [
  'Who’s forging?',
  'Your frame',
  'The target',
  'Your split',
  'Your goals',
];

const EXPERIENCE_OPTIONS: { value: Experience; label: string; hint: string }[] = [
  { value: 'beginner', label: 'Beginner', hint: '< 1 year of lifting' },
  { value: 'intermediate', label: 'Intermediate', hint: '1–3 years' },
  { value: 'advanced', label: 'Advanced', hint: '3+ years' },
];

export function OnboardingScreen() {
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  const [saving, setSaving] = useState(false);

  const {
    register,
    handleSubmit,
    trigger,
    watch,
    setValue,
    formState: { errors, dirtyFields },
  } = useForm<WizardValues>({
    resolver: zodResolver(schema),
    mode: 'onTouched',
    defaultValues: { experience: 'beginner', splitId: '', sleepH: 8 },
  });

  const experience = watch('experience');
  const splitId = watch('splitId');

  // Prefill step 5 with SPEC §5.1 suggestions; never clobber user edits.
  const startWeightKg = watch('startWeightKg');
  const heightCm = watch('heightCm');
  const age = watch('age');
  useEffect(() => {
    if (step !== 4) return;
    const split = splitTemplates.find((s) => s.id === splitId);
    if (!split || !startWeightKg || !heightCm || !age) return;
    const suggested = suggestedGoals(startWeightKg, heightCm, age, split.daysPerWeek);
    const apply = (field: keyof typeof suggested) => {
      if (!dirtyFields[field]) setValue(field, suggested[field], { shouldValidate: true });
    };
    apply('calories');
    apply('proteinG');
    apply('waterMl');
    apply('sleepH');
    apply('workoutsPerWeek');
  }, [step, splitId, startWeightKg, heightCm, age, dirtyFields, setValue]);

  const next = async () => {
    const fields = STEP_FIELDS[step];
    if (!fields) return;
    const valid = await trigger(fields);
    if (valid) setStep((s) => Math.min(s + 1, 4));
  };

  const onSubmit = handleSubmit(async (values) => {
    setSaving(true);
    try {
      await saveGoals(
        {
          weightKg: values.goalWeightKg,
          calories: values.calories,
          proteinG: values.proteinG,
          waterMl: values.waterMl,
          sleepH: values.sleepH,
          workoutsPerWeek: values.workoutsPerWeek,
        },
        todayKey(),
      );
      await saveProfile({
        name: values.name,
        age: values.age,
        heightCm: values.heightCm,
        startWeightKg: values.startWeightKg,
        experience: values.experience,
        splitId: values.splitId,
        onboarded: true,
      });
      navigate('/', { replace: true });
    } finally {
      setSaving(false);
    }
  });

  const numberField = (name: keyof WizardValues, label: string, unit: string, step_?: string) => (
    <Input
      label={unit ? `${label} (${unit})` : label}
      type="number"
      inputMode="decimal"
      step={step_ ?? 'any'}
      error={errors[name]?.message}
      {...register(name, { valueAsNumber: true })}
    />
  );

  return (
    <div className="mx-auto flex min-h-dvh w-full max-w-lg flex-col px-4 pb-8 pt-6">
      <header className="mb-6">
        <div className="mb-4 flex items-center gap-2">
          <span className="flex h-9 w-9 items-center justify-center rounded-control bg-ember text-text">
            <IconFlame size={18} />
          </span>
          <span className="font-display text-lg font-bold">Forge</span>
          <span className="ml-auto text-sm text-muted">{step + 1} / 5</span>
        </div>
        <div className="flex gap-1.5" aria-hidden>
          {STEP_TITLES.map((_, i) => (
            <div
              key={i}
              className={`h-1 flex-1 rounded-full transition-colors duration-200 ${
                i <= step ? 'bg-accent' : 'bg-white/10'
              }`}
            />
          ))}
        </div>
        <h1 className="mt-5 font-display text-2xl font-bold tracking-tight">{STEP_TITLES[step]}</h1>
      </header>

      <form onSubmit={onSubmit} className="flex flex-1 flex-col" noValidate>
        <div className="flex flex-col gap-4">
          {step === 0 && (
            <>
              <Input
                label="Name"
                autoComplete="name"
                placeholder="What should we call you?"
                error={errors.name?.message}
                {...register('name')}
              />
              {numberField('age', 'Age', 'years', '1')}
            </>
          )}

          {step === 1 && (
            <>
              {numberField('heightCm', 'Height', 'cm')}
              {numberField('startWeightKg', 'Current weight', 'kg')}
            </>
          )}

          {step === 2 && (
            <>
              {numberField('goalWeightKg', 'Goal weight', 'kg')}
              <div>
                <p className="mb-1.5 text-sm font-medium text-muted">Experience</p>
                <div className="flex flex-col gap-2">
                  {EXPERIENCE_OPTIONS.map((opt) => (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() =>
                        setValue('experience', opt.value, { shouldValidate: true, shouldDirty: true })
                      }
                      className={`flex items-center justify-between rounded-control border px-4 py-3 text-left transition-colors duration-150 ${
                        experience === opt.value
                          ? 'border-accent/60 bg-accent/10'
                          : 'bg-surface-2 hover:bg-white/10'
                      }`}
                    >
                      <span>
                        <span className="block text-sm font-medium">{opt.label}</span>
                        <span className="block text-xs text-muted">{opt.hint}</span>
                      </span>
                      {experience === opt.value ? <IconCheck size={18} className="text-accent" /> : null}
                    </button>
                  ))}
                </div>
              </div>
            </>
          )}

          {step === 3 && (
            <div className="flex flex-col gap-2">
              {splitTemplates.map((split) => (
                <button
                  key={split.id}
                  type="button"
                  onClick={() => setValue('splitId', split.id, { shouldValidate: true, shouldDirty: true })}
                  className={`rounded-card border p-4 text-left transition-colors duration-150 ${
                    splitId === split.id
                      ? 'border-accent/60 bg-accent/10'
                      : 'bg-surface-2 hover:bg-white/10'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-display text-sm font-semibold">{split.name}</span>
                    {splitId === split.id ? <IconCheck size={18} className="text-accent" /> : null}
                  </div>
                  <p className="mt-1 text-xs text-muted">
                    {split.daysPerWeek} days/week ·{' '}
                    {Object.values(split.schedule)
                      .map((d) => d.label)
                      .join(' · ')}
                  </p>
                </button>
              ))}
              {errors.splitId ? <p className="text-sm text-accent">{errors.splitId.message}</p> : null}
            </div>
          )}

          {step === 4 && (
            <>
              <p className="rounded-control border border-warning/30 bg-warning/10 px-3 py-2 text-xs text-warning">
                Suggestions, not medical advice — tune anything before you start.
              </p>
              {numberField('calories', 'Daily calories', 'kcal', '50')}
              {numberField('proteinG', 'Daily protein', 'g', '5')}
              {numberField('waterMl', 'Daily water', 'ml', '250')}
              {numberField('sleepH', 'Sleep', 'h', '0.5')}
              {numberField('workoutsPerWeek', 'Workouts per week', '', '1')}
            </>
          )}
        </div>

        <div className="mt-auto flex gap-3 pt-8">
          {step > 0 ? (
            <Button variant="secondary" size="lg" onClick={() => setStep((s) => s - 1)} className="flex-1">
              Back
            </Button>
          ) : null}
          {step < 4 ? (
            <Button size="lg" onClick={next} className="flex-1">
              Next
            </Button>
          ) : (
            <Button size="lg" type="submit" disabled={saving} className="flex-1">
              {saving ? 'Saving…' : 'Start forging'}
            </Button>
          )}
        </div>
      </form>
    </div>
  );
}
