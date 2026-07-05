import { useLiveQuery } from 'dexie-react-hooks';
import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';

import { Card } from '../../components/Card';
import { ScreenHeader } from '../../components/ScreenHeader';
import { IconCalendar, IconDumbbell, IconSearch, IconUtensils } from '../../components/icons';
import { allExercises } from '../../db/repositories/exercisesRepo';
import { allFavoriteMeals } from '../../db/repositories/favoriteMealsRepo';
import { allFoods } from '../../db/repositories/foodsRepo';
import { fromDayKey, todayKey } from '../../lib/dates';
import { parseDateQuery } from '../../lib/dateParse';

type ResultGroup = {
  key: string;
  label: string;
  icon: React.ReactNode;
  items: { id: string; title: string; sub?: string; onClick: () => void }[];
};

export function SearchScreen() {
  const navigate = useNavigate();
  const [raw, setRaw] = useState('');
  const [query, setQuery] = useState('');

  // debounce
  useEffect(() => {
    const id = setTimeout(() => setQuery(raw), 200);
    return () => clearTimeout(id);
  }, [raw]);

  const data = useLiveQuery(async () => {
    const [foods, exercises, favorites] = await Promise.all([
      allFoods(),
      allExercises(),
      allFavoriteMeals(),
    ]);
    return { foods, exercises, favorites };
  }, []);

  const groups = useMemo<ResultGroup[]>(() => {
    const q = query.trim().toLowerCase();
    if (!q || !data) return [];
    const out: ResultGroup[] = [];

    const year = Number(todayKey().slice(0, 4));
    const parsed = parseDateQuery(query, year);
    if (parsed) {
      out.push({
        key: 'date',
        label: 'Date',
        icon: <IconCalendar size={16} />,
        items: [
          {
            id: parsed,
            title: new Intl.DateTimeFormat('en-GB', {
              weekday: 'long',
              day: 'numeric',
              month: 'long',
              year: 'numeric',
            }).format(fromDayKey(parsed)),
            sub: 'Open in calendar',
            onClick: () => navigate(`/more/calendar?day=${parsed}`),
          },
        ],
      });
    }

    const foods = data.foods.filter((f) => f.name.toLowerCase().includes(q)).slice(0, 8);
    if (foods.length) {
      out.push({
        key: 'foods',
        label: 'Foods',
        icon: <IconUtensils size={16} />,
        items: foods.map((f) => ({
          id: f.id,
          title: f.name,
          sub: `${f.per100.kcal} kcal · ${f.per100.proteinG} g protein`,
          onClick: () => navigate('/nutrition/foods'),
        })),
      });
    }

    const favs = data.favorites.filter((f) => f.name.toLowerCase().includes(q)).slice(0, 6);
    if (favs.length) {
      out.push({
        key: 'favorites',
        label: 'Favorite meals',
        icon: <IconUtensils size={16} />,
        items: favs.map((f) => ({
          id: f.id,
          title: f.name,
          sub: `${f.items.length} items`,
          onClick: () => navigate('/nutrition'),
        })),
      });
    }

    const exercises = data.exercises.filter((e) => e.name.toLowerCase().includes(q)).slice(0, 8);
    if (exercises.length) {
      out.push({
        key: 'exercises',
        label: 'Exercises',
        icon: <IconDumbbell size={16} />,
        items: exercises.map((e) => ({
          id: e.id,
          title: e.name,
          sub: e.muscleGroup,
          onClick: () => navigate(`/workout/history/${e.id}`),
        })),
      });
    }

    return out;
  }, [query, data, navigate]);

  return (
    <div className="flex flex-col gap-4">
      <ScreenHeader title="Search" subtitle="Foods, meals, exercises and days" back />

      <div className="relative">
        <IconSearch size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
        <input
          value={raw}
          onChange={(e) => setRaw(e.target.value)}
          autoFocus
          placeholder="Try “paneer”, “squat” or “12 Jul”"
          className="h-11 w-full rounded-control border bg-surface-2 pl-10 pr-3 text-base focus:border-accent/60 focus:outline-none"
        />
      </div>

      {query.trim() === '' ? (
        <p className="px-1 text-sm text-muted">
          Search your food database, favorite meals, exercises, or a date like “2026-07-12”.
        </p>
      ) : groups.length === 0 ? (
        <p className="px-1 text-sm text-muted">No matches for “{query}”.</p>
      ) : (
        <div className="flex flex-col gap-4">
          {groups.map((group) => (
            <div key={group.key}>
              <p className="mb-2 flex items-center gap-1.5 text-xs font-medium uppercase tracking-wide text-muted">
                {group.icon}
                {group.label}
              </p>
              <div className="flex flex-col gap-1.5">
                {group.items.map((item) => (
                  <Card key={item.id} className="p-0">
                    <button
                      type="button"
                      onClick={item.onClick}
                      className="flex w-full flex-col items-start rounded-card px-4 py-3 text-left transition-colors hover:bg-white/5"
                    >
                      <span className="text-sm font-medium">{item.title}</span>
                      {item.sub ? <span className="text-xs text-muted">{item.sub}</span> : null}
                    </button>
                  </Card>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
