import { useLiveQuery } from 'dexie-react-hooks';
import { useNavigate } from 'react-router-dom';

import { Card } from '../../components/Card';
import { EmptyState } from '../../components/EmptyState';
import { ProgressRing } from '../../components/ProgressRing';
import { ScreenHeader } from '../../components/ScreenHeader';
import { IconFlame } from '../../components/icons';
import { getGoals } from '../../db/repositories/goalsRepo';
import { mealsByDay } from '../../db/repositories/mealsRepo';
import { getProfile } from '../../db/repositories/profileRepo';
import { latestWeight } from '../../db/repositories/weightRepo';
import { bmi } from '../../lib/bmi';
import { quoteForDay } from '../../lib/quotes';
import { quotes } from '../../data/quotes';
import { todayKey } from '../../lib/dates';
import { MacroBars } from '../nutrition/MacroBars';

function greeting(hour: number): string {
  if (hour < 5) return 'Late night';
  if (hour < 12) return 'Good morning';
  if (hour < 17) return 'Good afternoon';
  return 'Good evening';
}

export function HomeScreen() {
  const navigate = useNavigate();
  const now = new Date();
  const today = todayKey(now);
  const dateLabel = new Intl.DateTimeFormat('en-GB', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  }).format(now);

  const data = useLiveQuery(async () => {
    const [profile, goals, meals, weight] = await Promise.all([
      getProfile(),
      getGoals(),
      mealsByDay(today),
      latestWeight(),
    ]);
    const macros = meals.reduce(
      (acc, m) => ({
        kcal: acc.kcal + m.cachedMacros.kcal,
        proteinG: acc.proteinG + m.cachedMacros.proteinG,
        carbsG: acc.carbsG + m.cachedMacros.carbsG,
        fatG: acc.fatG + m.cachedMacros.fatG,
        fiberG: acc.fiberG + m.cachedMacros.fiberG,
      }),
      { kcal: 0, proteinG: 0, carbsG: 0, fatG: 0, fiberG: 0 },
    );
    return {
      profile: profile ?? null,
      goals: goals ?? null,
      macros,
      currentKg: weight?.kg ?? profile?.startWeightKg ?? null,
    };
  }, [today]);

  const name = data?.profile?.name;
  const goals = data?.goals ?? null;
  const macros = data?.macros ?? { kcal: 0, proteinG: 0, carbsG: 0, fatG: 0, fiberG: 0 };
  const kcalToday = macros.kcal;
  const bmiValue =
    data?.currentKg != null && data.profile ? bmi(data.currentKg, data.profile.heightCm) : null;

  return (
    <div className="flex flex-col gap-4">
      <ScreenHeader
        title={name ? `${greeting(now.getHours())}, ${name}` : greeting(now.getHours())}
        subtitle={dateLabel}
      />

      <p className="-mt-2 text-sm italic text-muted">“{quoteForDay(today, quotes)}”</p>

      <Card className="flex flex-col items-center gap-2 py-6">
        <ProgressRing
          value={goals && goals.calories > 0 ? kcalToday / goals.calories : 0}
          aria-label="Calories today"
        >
          <span className="metric text-4xl font-bold">{Math.round(kcalToday)}</span>
          <span className="text-xs text-muted">
            {goals ? `of ${goals.calories} kcal` : 'kcal today'}
          </span>
        </ProgressRing>
        <div className="mt-3 w-full px-1">
          <MacroBars totals={macros} proteinGoal={goals?.proteinG} />
        </div>
      </Card>

      <div className="grid grid-cols-2 gap-3">
        <Card className="flex flex-col gap-0.5">
          <p className="text-xs font-medium uppercase tracking-wide text-muted">Weight</p>
          <p className="metric text-2xl font-semibold">
            {data?.currentKg ?? '—'}
            <span className="ml-1 text-sm font-normal text-muted">kg</span>
          </p>
          {goals ? <p className="text-xs text-muted">goal {goals.weightKg} kg</p> : null}
        </Card>
        <Card className="flex flex-col gap-0.5">
          <p className="text-xs font-medium uppercase tracking-wide text-muted">BMI</p>
          <p className="metric text-2xl font-semibold">{bmiValue ?? '—'}</p>
          <p className="text-xs text-muted">reference only</p>
        </Card>
      </div>

      <EmptyState
        icon={<IconFlame size={24} />}
        title="Start day one"
        body="Log your first meal or workout with the + button. Streaks, XP and Coach light up as your data arrives."
        actionLabel="Log a meal"
        onAction={() => navigate('/nutrition')}
      />
    </div>
  );
}
