import { useLiveQuery } from 'dexie-react-hooks';
import { useEffect, useMemo, useState } from 'react';

import { Button } from '../../components/Button';
import { Sheet } from '../../components/Sheet';
import { Stepper } from '../../components/Stepper';
import { useToast } from '../../components/Toast';
import { IconClose, IconPlus, IconSearch } from '../../components/icons';
import { evaluateProteinGoal } from '../../db/repositories/awardsRepo';
import { addFavoriteMeal } from '../../db/repositories/favoriteMealsRepo';
import { allFoods, favoriteFoods } from '../../db/repositories/foodsRepo';
import { addMeal, recentFoodIds, updateMeal } from '../../db/repositories/mealsRepo';
import { macrosForGrams, roundMacros, sumMacros } from '../../lib/macros';
import type { Food, Meal, MealCategory, MealItem } from '../../types';
import { CATEGORY_LABELS, CATEGORY_ORDER, itemQuantityLabel } from './mealFormatting';

type BuilderTarget =
  | { mode: 'create'; category?: MealCategory }
  | { mode: 'edit'; meal: Meal };

type MealBuilderSheetProps = {
  open: boolean;
  onClose: () => void;
  dayKey: string;
  target: BuilderTarget;
  /** Which picker tab to open on for a new meal (Recents when history exists). */
  initialTab?: PickerTab;
};

type PickerTab = 'search' | 'recents' | 'favorites';

function nowTime(): string {
  const d = new Date();
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
}

export function MealBuilderSheet({
  open,
  onClose,
  dayKey,
  target,
  initialTab = 'search',
}: MealBuilderSheetProps) {
  const { showToast } = useToast();
  const [category, setCategory] = useState<MealCategory>('breakfast');
  const [items, setItems] = useState<MealItem[]>([]);
  const [tab, setTab] = useState<PickerTab>('search');
  const [query, setQuery] = useState('');
  const [saving, setSaving] = useState(false);

  const foods = useLiveQuery(() => allFoods(), []);
  const favFoods = useLiveQuery(() => favoriteFoods(), []);
  const recents = useLiveQuery(() => recentFoodIds(15), []);
  const foodsById = useMemo(() => new Map((foods ?? []).map((f) => [f.id, f])), [foods]);

  // Seed the working set when the sheet opens.
  useEffect(() => {
    if (!open) return;
    if (target.mode === 'edit') {
      setCategory(target.meal.category);
      setItems(target.meal.items);
      setTab('search');
    } else {
      setCategory(target.category ?? 'breakfast');
      setItems([]);
      setTab(initialTab);
    }
    setQuery('');
  }, [open, target, initialTab]);

  const selectedIds = useMemo(() => new Set(items.map((i) => i.foodId)), [items]);

  const toggleFood = (food: Food) => {
    setItems((prev) =>
      selectedIds.has(food.id)
        ? prev.filter((i) => i.foodId !== food.id)
        : [...prev, { foodId: food.id, grams: food.defaultServing.grams }],
    );
  };

  const setGrams = (foodId: string, grams: number) => {
    setItems((prev) => prev.map((i) => (i.foodId === foodId ? { ...i, grams } : i)));
  };

  const totals = useMemo(() => {
    return roundMacros(
      sumMacros(
        items.map((item) => {
          const food = foodsById.get(item.foodId);
          return food ? macrosForGrams(food, item.grams) : { kcal: 0, proteinG: 0, carbsG: 0, fatG: 0, fiberG: 0 };
        }),
      ),
    );
  }, [items, foodsById]);

  const pickerFoods = useMemo(() => {
    if (tab === 'recents') {
      return (recents ?? []).map((id) => foodsById.get(id)).filter((f): f is Food => !!f);
    }
    if (tab === 'favorites') return favFoods ?? [];
    const all = foods ?? [];
    const q = query.trim().toLowerCase();
    return q ? all.filter((f) => f.name.toLowerCase().includes(q)) : all;
  }, [tab, recents, favFoods, foods, foodsById, query]);

  const save = async () => {
    if (items.length === 0) return;
    setSaving(true);
    try {
      if (target.mode === 'edit') {
        await updateMeal(target.meal.id, { category, items });
      } else {
        await addMeal({ dayKey, category, items, time: nowTime() });
      }
      const awarded = await evaluateProteinGoal(dayKey);
      onClose();
      showToast(
        awarded ? 'Meal saved · protein goal hit +30 XP' : 'Meal saved',
        'success',
      );
    } finally {
      setSaving(false);
    }
  };

  const saveAsFavorite = async () => {
    if (items.length === 0) return;
    const name = window.prompt('Name this favorite meal');
    if (!name?.trim()) return;
    await addFavoriteMeal({ name: name.trim(), category, items });
    showToast('Saved to favorite meals', 'success');
  };

  return (
    <Sheet open={open} onClose={onClose} title={target.mode === 'edit' ? 'Edit meal' : 'Log meal'}>
      <div className="flex max-h-[70vh] flex-col gap-4 overflow-y-auto">
        {/* category */}
        <div className="flex flex-wrap gap-2">
          {CATEGORY_ORDER.map((cat) => (
            <button
              key={cat}
              type="button"
              onClick={() => setCategory(cat)}
              className={`rounded-full border px-3 py-1.5 text-xs font-medium transition-colors duration-150 ${
                category === cat ? 'border-accent/60 bg-accent/10 text-text' : 'bg-surface-2 text-muted'
              }`}
            >
              {CATEGORY_LABELS[cat]}
            </button>
          ))}
        </div>

        {/* selected items with quantity steppers */}
        {items.length > 0 ? (
          <div className="flex flex-col gap-2 rounded-card border bg-surface-2 p-3">
            {items.map((item) => {
              const food = foodsById.get(item.foodId);
              if (!food) return null;
              const isPiece = food.unit === 'piece' && !!food.pieceGrams;
              const pieceGrams = food.pieceGrams ?? 1;
              return (
                <div key={item.foodId} className="flex flex-col gap-1.5 border-b border-white/5 pb-2 last:border-0 last:pb-0">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">{food.name}</span>
                    <button
                      type="button"
                      aria-label={`Remove ${food.name}`}
                      onClick={() => toggleFood(food)}
                      className="text-muted hover:text-accent"
                    >
                      <IconClose size={16} />
                    </button>
                  </div>
                  <Stepper
                    value={isPiece ? item.grams / pieceGrams : item.grams}
                    onChange={(v) => setGrams(item.foodId, isPiece ? v * pieceGrams : v)}
                    step={isPiece ? 1 : 10}
                    min={isPiece ? 1 : 5}
                    unit={isPiece ? 'pcs' : food.unit}
                    label={itemQuantityLabel(food, item.grams)}
                  />
                </div>
              );
            })}
          </div>
        ) : (
          <p className="rounded-card border border-dashed border-white/10 px-4 py-6 text-center text-sm text-muted">
            Pick foods below to build this meal.
          </p>
        )}

        {/* running totals */}
        <div className="grid grid-cols-5 gap-1 rounded-card bg-surface-2 p-3 text-center">
          {[
            { label: 'kcal', value: Math.round(totals.kcal) },
            { label: 'P', value: `${Math.round(totals.proteinG)}g` },
            { label: 'C', value: `${Math.round(totals.carbsG)}g` },
            { label: 'F', value: `${Math.round(totals.fatG)}g` },
            { label: 'Fib', value: `${Math.round(totals.fiberG)}g` },
          ].map((s) => (
            <div key={s.label}>
              <p className="metric text-sm font-semibold">{s.value}</p>
              <p className="text-[10px] uppercase text-muted">{s.label}</p>
            </div>
          ))}
        </div>

        {/* picker tabs */}
        <div>
          <div className="mb-2 flex gap-1 rounded-control bg-surface-2 p-1">
            {(['search', 'recents', 'favorites'] as PickerTab[]).map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => setTab(t)}
                className={`flex-1 rounded-[8px] py-1.5 text-xs font-medium capitalize transition-colors duration-150 ${
                  tab === t ? 'bg-white/10 text-text' : 'text-muted'
                }`}
              >
                {t}
              </button>
            ))}
          </div>

          {tab === 'search' ? (
            <div className="relative mb-2">
              <IconSearch size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search foods"
                className="h-10 w-full rounded-control border bg-surface-2 pl-9 pr-3 text-sm focus:border-accent/60 focus:outline-none"
              />
            </div>
          ) : null}

          <ul className="flex max-h-56 flex-col gap-1 overflow-y-auto">
            {pickerFoods.length === 0 ? (
              <li className="px-1 py-4 text-center text-xs text-muted">
                {tab === 'recents'
                  ? 'No recent foods yet.'
                  : tab === 'favorites'
                    ? 'Star foods in the food database to see them here.'
                    : 'No foods match.'}
              </li>
            ) : (
              pickerFoods.map((food) => {
                const selected = selectedIds.has(food.id);
                return (
                  <li key={food.id}>
                    <button
                      type="button"
                      onClick={() => toggleFood(food)}
                      className={`flex w-full items-center justify-between rounded-control border px-3 py-2 text-left transition-colors duration-150 ${
                        selected ? 'border-accent/60 bg-accent/10' : 'bg-surface-2 hover:bg-white/10'
                      }`}
                    >
                      <span>
                        <span className="block text-sm">{food.name}</span>
                        <span className="block text-[11px] text-muted">
                          {food.per100.kcal} kcal · {food.per100.proteinG} g P /{' '}
                          {food.unit === 'piece' ? 'piece' : `100${food.unit}`}
                        </span>
                      </span>
                      <span className={selected ? 'text-accent' : 'text-muted'}>
                        {selected ? <IconClose size={16} /> : <IconPlus size={16} />}
                      </span>
                    </button>
                  </li>
                );
              })
            )}
          </ul>
        </div>

        <div className="flex flex-col gap-2 pt-1">
          <Button onClick={save} disabled={items.length === 0 || saving} fullWidth size="lg">
            {saving ? 'Saving…' : target.mode === 'edit' ? 'Save changes' : 'Save meal'}
          </Button>
          {target.mode === 'create' ? (
            <Button onClick={saveAsFavorite} disabled={items.length === 0} variant="ghost" size="sm">
              Save as favorite meal
            </Button>
          ) : null}
        </div>
      </div>
    </Sheet>
  );
}

export type { BuilderTarget };
