import { zodResolver } from '@hookform/resolvers/zod';
import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';

import { Button } from '../../components/Button';
import { Input } from '../../components/Input';
import { Sheet } from '../../components/Sheet';
import { useToast } from '../../components/Toast';
import { addCustomFood, updateFood } from '../../db/repositories/foodsRepo';
import type { Food, FoodUnit } from '../../types';

const num = (msg: string) => z.number({ error: msg });

const schema = z
  .object({
    name: z.string().trim().min(1, 'Name is required'),
    unit: z.enum(['g', 'ml', 'piece']),
    kcal: num('kcal').min(0, '≥ 0'),
    proteinG: num('protein').min(0, '≥ 0'),
    carbsG: num('carbs').min(0, '≥ 0'),
    fatG: num('fat').min(0, '≥ 0'),
    fiberG: num('fiber').min(0, '≥ 0'),
    pieceGrams: num('piece weight').min(1, '≥ 1').optional(),
    servingLabel: z.string().trim().min(1, 'Serving label'),
    servingGrams: num('serving grams').min(1, '≥ 1'),
  })
  .refine((v) => v.unit !== 'piece' || (v.pieceGrams ?? 0) >= 1, {
    message: 'Piece weight in grams is required',
    path: ['pieceGrams'],
  });

type FoodFormValues = z.infer<typeof schema>;

type FoodFormSheetProps = {
  open: boolean;
  onClose: () => void;
  editing?: Food;
};

export function FoodFormSheet({ open, onClose, editing }: FoodFormSheetProps) {
  const { showToast } = useToast();
  const {
    register,
    handleSubmit,
    watch,
    reset,
    setValue,
    formState: { errors },
  } = useForm<FoodFormValues>({
    resolver: zodResolver(schema),
    mode: 'onTouched',
    defaultValues: { unit: 'g', servingLabel: '1 serving', servingGrams: 100 },
  });

  const unit = watch('unit');
  const pieceGrams = watch('pieceGrams');

  useEffect(() => {
    if (!open) return;
    if (editing) {
      reset({
        name: editing.name,
        unit: editing.unit,
        kcal: editing.per100.kcal,
        proteinG: editing.per100.proteinG,
        carbsG: editing.per100.carbsG,
        fatG: editing.per100.fatG,
        fiberG: editing.per100.fiberG,
        pieceGrams: editing.pieceGrams,
        servingLabel: editing.defaultServing.label,
        servingGrams: editing.defaultServing.grams,
      });
    } else {
      reset({ unit: 'g', servingLabel: '1 serving', servingGrams: 100, name: '' });
    }
  }, [open, editing, reset]);

  // For piece foods the serving is one piece; keep it in sync.
  useEffect(() => {
    if (unit === 'piece' && pieceGrams && pieceGrams >= 1) {
      setValue('servingLabel', '1 piece');
      setValue('servingGrams', pieceGrams);
    }
  }, [unit, pieceGrams, setValue]);

  const basisLabel = unit === 'piece' ? 'per piece' : unit === 'ml' ? 'per 100 ml' : 'per 100 g';

  const onSubmit = handleSubmit(async (values) => {
    const per100 = {
      kcal: values.kcal,
      proteinG: values.proteinG,
      carbsG: values.carbsG,
      fatG: values.fatG,
      fiberG: values.fiberG,
    };
    const base = {
      name: values.name,
      per100,
      unit: values.unit as FoodUnit,
      pieceGrams: values.unit === 'piece' ? values.pieceGrams : undefined,
      defaultServing: { label: values.servingLabel, grams: values.servingGrams },
    };
    if (editing) {
      await updateFood(editing.id, base);
      showToast('Food updated', 'success');
    } else {
      await addCustomFood({ ...base, isFavorite: false });
      showToast('Custom food added', 'success');
    }
    onClose();
  });

  const macro = (name: keyof FoodFormValues, label: string) => (
    <Input
      label={label}
      type="number"
      inputMode="decimal"
      step="any"
      error={errors[name]?.message}
      {...register(name, { valueAsNumber: true })}
    />
  );

  return (
    <Sheet open={open} onClose={onClose} title={editing ? `Edit ${editing.name}` : 'New food'}>
      <form onSubmit={onSubmit} className="flex max-h-[70vh] flex-col gap-4 overflow-y-auto" noValidate>
        <Input label="Name" error={errors.name?.message} {...register('name')} />

        <div>
          <p className="mb-1.5 text-sm font-medium text-muted">Measured by</p>
          <div className="grid grid-cols-3 gap-2">
            {(['g', 'ml', 'piece'] as FoodUnit[]).map((u) => (
              <button
                key={u}
                type="button"
                onClick={() => setValue('unit', u, { shouldValidate: true })}
                className={`rounded-control border py-2 text-sm capitalize transition-colors duration-150 ${
                  unit === u ? 'border-accent/60 bg-accent/10 text-text' : 'bg-surface-2 text-muted'
                }`}
              >
                {u === 'g' ? 'grams' : u === 'ml' ? 'millilitres' : 'piece'}
              </button>
            ))}
          </div>
        </div>

        {unit === 'piece'
          ? macro('pieceGrams', 'Weight of one piece (g)')
          : null}

        <p className="text-xs font-medium uppercase tracking-wide text-muted">Macros ({basisLabel})</p>
        <div className="grid grid-cols-2 gap-3">
          {macro('kcal', 'Calories (kcal)')}
          {macro('proteinG', 'Protein (g)')}
          {macro('carbsG', 'Carbs (g)')}
          {macro('fatG', 'Fat (g)')}
          {macro('fiberG', 'Fiber (g)')}
        </div>

        {unit !== 'piece' ? (
          <>
            <p className="text-xs font-medium uppercase tracking-wide text-muted">Default serving</p>
            <div className="grid grid-cols-2 gap-3">
              <Input label="Label" error={errors.servingLabel?.message} {...register('servingLabel')} />
              {macro('servingGrams', `Grams (${unit})`)}
            </div>
          </>
        ) : null}

        <Button type="submit" fullWidth size="lg">
          {editing ? 'Save changes' : 'Add food'}
        </Button>
      </form>
    </Sheet>
  );
}
