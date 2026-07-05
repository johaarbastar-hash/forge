import { useLiveQuery } from 'dexie-react-hooks';
import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';

import { Button } from '../../components/Button';
import { Card } from '../../components/Card';
import { EmptyState } from '../../components/EmptyState';
import { ScreenHeader } from '../../components/ScreenHeader';
import { Sheet } from '../../components/Sheet';
import { useToast } from '../../components/Toast';
import { IconPlus, IconUtensils } from '../../components/icons';
import { evaluateProteinGoal } from '../../db/repositories/awardsRepo';
import { allFavoriteMeals } from '../../db/repositories/favoriteMealsRepo';
import { allFoods } from '../../db/repositories/foodsRepo';
import { getGoals } from '../../db/repositories/goalsRepo';
import {
  addMeal,
  deleteMeal,
  duplicateMeal,
  mealsByDay,
  recentFoodIds,
} from '../../db/repositories/mealsRepo';
import { todayKey } from '../../lib/dates';
import type { FavoriteMeal, Meal } from '../../types';
import { MacroBars } from './MacroBars';
import { MealBuilderSheet, type BuilderTarget } from './MealBuilderSheet';
import { CATEGORY_LABELS, CATEGORY_ORDER, mealTitle } from './mealFormatting';

export function NutritionScreen() {
  const navigate = useNavigate();
  const { showToast } = useToast();
  const today = todayKey();

  const [builder, setBuilder] = useState<BuilderTarget | null>(null);
  const [actionsFor, setActionsFor] = useState<Meal | null>(null);
  const [dupDate, setDupDate] = useState(today);

  const data = useLiveQuery(async () => {
    const [meals, goals, foods, favorites, recents] = await Promise.all([
      mealsByDay(today),
      getGoals(),
      allFoods(),
      allFavoriteMeals(),
      recentFoodIds(1),
    ]);
    return { meals, goals: goals ?? null, foods, favorites, hasRecents: recents.length > 0 };
  }, [today]);

  const foodsById = useMemo(
    () => new Map((data?.foods ?? []).map((f) => [f.id, f])),
    [data?.foods],
  );

  if (!data) {
    return (
      <div>
        <ScreenHeader title="Nutrition" subtitle="Meals, macros and your food database" />
        <div className="flex h-40 items-center justify-center" role="status" aria-label="Loading">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-white/10 border-t-accent" />
        </div>
      </div>
    );
  }

  const { meals, goals, favorites } = data;
  const totals = meals.reduce(
    (acc, m) => ({
      kcal: acc.kcal + m.cachedMacros.kcal,
      proteinG: acc.proteinG + m.cachedMacros.proteinG,
      carbsG: acc.carbsG + m.cachedMacros.carbsG,
      fatG: acc.fatG + m.cachedMacros.fatG,
      fiberG: acc.fiberG + m.cachedMacros.fiberG,
    }),
    { kcal: 0, proteinG: 0, carbsG: 0, fatG: 0, fiberG: 0 },
  );

  const logFavorite = async (fav: FavoriteMeal) => {
    const time = `${String(new Date().getHours()).padStart(2, '0')}:${String(
      new Date().getMinutes(),
    ).padStart(2, '0')}`;
    await addMeal({ dayKey: today, category: fav.category, items: fav.items, time });
    const awarded = await evaluateProteinGoal(today);
    showToast(awarded ? `${fav.name} logged · protein goal +30 XP` : `${fav.name} logged`, 'success');
  };

  const doDuplicate = async (targetDay: string) => {
    if (!actionsFor) return;
    await duplicateMeal(actionsFor.id, targetDay);
    if (targetDay === today) await evaluateProteinGoal(today);
    setActionsFor(null);
    showToast(targetDay === today ? 'Meal duplicated to today' : `Meal duplicated to ${targetDay}`, 'success');
  };

  const doDelete = async () => {
    if (!actionsFor) return;
    await deleteMeal(actionsFor.id);
    setActionsFor(null);
    showToast('Meal deleted', 'info');
  };

  const mealsByCategory = CATEGORY_ORDER.map((cat) => ({
    category: cat,
    meals: meals.filter((m) => m.category === cat),
  })).filter((group) => group.meals.length > 0);

  return (
    <div className="flex flex-col gap-4">
      <ScreenHeader
        title="Nutrition"
        subtitle="Today’s meals and macros"
        trailing={
          <Button size="sm" variant="secondary" onClick={() => navigate('/nutrition/foods')}>
            Foods
          </Button>
        }
      />

      <Card className="flex flex-col gap-3">
        <div className="flex items-baseline justify-between">
          <div>
            <span className="metric text-3xl font-bold">{Math.round(totals.kcal)}</span>
            <span className="ml-1 text-sm text-muted">
              {goals ? `/ ${goals.calories} kcal` : 'kcal'}
            </span>
          </div>
          <span className="text-xs text-muted">{meals.length} meals today</span>
        </div>
        <MacroBars totals={totals} proteinGoal={goals?.proteinG} />
      </Card>

      {favorites.length > 0 ? (
        <div>
          <p className="mb-2 text-xs font-medium uppercase tracking-wide text-muted">Quick log</p>
          <div className="flex flex-wrap gap-2">
            {favorites.map((fav) => (
              <button
                key={fav.id}
                type="button"
                onClick={() => logFavorite(fav)}
                className="rounded-full border bg-surface-2 px-3 py-1.5 text-xs font-medium transition-colors duration-150 hover:bg-white/10"
              >
                + {fav.name}
              </button>
            ))}
          </div>
        </div>
      ) : null}

      <Button onClick={() => setBuilder({ mode: 'create' })} fullWidth>
        <IconPlus size={18} /> Log a meal
      </Button>

      {mealsByCategory.length === 0 ? (
        <EmptyState
          icon={<IconUtensils size={24} />}
          title="No meals logged today"
          body="Tap “Log a meal” to add breakfast, lunch, dinner or a snack. Favorite combos log in a tap."
        />
      ) : (
        <div className="flex flex-col gap-4">
          {mealsByCategory.map((group) => (
            <div key={group.category}>
              <p className="mb-2 text-xs font-medium uppercase tracking-wide text-muted">
                {CATEGORY_LABELS[group.category]}
              </p>
              <div className="flex flex-col gap-2">
                {group.meals.map((meal) => (
                  <Card key={meal.id} className="flex items-center gap-3 p-3">
                    <button
                      type="button"
                      onClick={() => setBuilder({ mode: 'edit', meal })}
                      className="flex-1 text-left"
                      aria-label={`Edit meal at ${meal.time}`}
                    >
                      <span className="block text-sm font-medium">
                        {mealTitle(meal.items, foodsById)}
                      </span>
                      <span className="block text-[11px] text-muted">
                        {meal.time} · {Math.round(meal.cachedMacros.kcal)} kcal ·{' '}
                        {Math.round(meal.cachedMacros.proteinG)} g protein
                      </span>
                    </button>
                    <button
                      type="button"
                      aria-label="Meal options"
                      onClick={() => {
                        setDupDate(today);
                        setActionsFor(meal);
                      }}
                      className="px-2 text-lg leading-none text-muted hover:text-text"
                    >
                      ⋯
                    </button>
                  </Card>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {builder ? (
        <MealBuilderSheet
          open={builder !== null}
          onClose={() => setBuilder(null)}
          dayKey={today}
          target={builder}
          initialTab={data.hasRecents ? 'recents' : 'search'}
        />
      ) : null}

      <Sheet open={actionsFor !== null} onClose={() => setActionsFor(null)} title="Meal options">
        {actionsFor ? (
          <div className="flex flex-col gap-2">
            <Button
              variant="secondary"
              fullWidth
              onClick={() => {
                const meal = actionsFor;
                setActionsFor(null);
                setBuilder({ mode: 'edit', meal });
              }}
            >
              Edit meal
            </Button>
            <Button variant="secondary" fullWidth onClick={() => doDuplicate(today)}>
              Duplicate to today
            </Button>
            <div className="flex items-center gap-2 rounded-control border bg-surface-2 px-3 py-2">
              <label htmlFor="dup-date" className="text-sm text-muted">
                To date
              </label>
              <input
                id="dup-date"
                type="date"
                value={dupDate}
                onChange={(e) => setDupDate(e.target.value)}
                className="flex-1 bg-transparent text-sm focus:outline-none"
              />
              <Button size="sm" onClick={() => doDuplicate(dupDate)}>
                Copy
              </Button>
            </div>
            <Button variant="danger" fullWidth onClick={doDelete}>
              Delete meal
            </Button>
          </div>
        ) : null}
      </Sheet>
    </div>
  );
}
