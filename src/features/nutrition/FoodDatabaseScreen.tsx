import { useLiveQuery } from 'dexie-react-hooks';
import { useMemo, useState } from 'react';

import { Button } from '../../components/Button';
import { Card } from '../../components/Card';
import { EmptyState } from '../../components/EmptyState';
import { ScreenHeader } from '../../components/ScreenHeader';
import { useToast } from '../../components/Toast';
import { IconPlus, IconSearch, IconUtensils } from '../../components/icons';
import { allFoods, deleteFood, setFoodFavorite } from '../../db/repositories/foodsRepo';
import type { Food } from '../../types';
import { FoodFormSheet } from './FoodFormSheet';

type Filter = 'all' | 'favorites' | 'custom';

function StarButton({ food, onToggle }: { food: Food; onToggle: () => void }) {
  return (
    <button
      type="button"
      aria-label={food.isFavorite ? `Unfavorite ${food.name}` : `Favorite ${food.name}`}
      aria-pressed={food.isFavorite}
      onClick={onToggle}
      className={`text-lg leading-none transition-colors ${food.isFavorite ? 'text-ember' : 'text-muted hover:text-text'}`}
    >
      {food.isFavorite ? '★' : '☆'}
    </button>
  );
}

export function FoodDatabaseScreen() {
  const { showToast } = useToast();
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState<Filter>('all');
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Food | undefined>(undefined);

  const foods = useLiveQuery(() => allFoods(), []);

  const filtered = useMemo(() => {
    if (!foods) return [];
    const q = query.trim().toLowerCase();
    return foods.filter((f) => {
      if (filter === 'favorites' && !f.isFavorite) return false;
      if (filter === 'custom' && !f.isCustom) return false;
      return !q || f.name.toLowerCase().includes(q);
    });
  }, [foods, query, filter]);

  const openNew = () => {
    setEditing(undefined);
    setFormOpen(true);
  };
  const openEdit = (food: Food) => {
    setEditing(food);
    setFormOpen(true);
  };

  const remove = async (food: Food) => {
    if (!window.confirm(`Delete ${food.name}? This can't be undone.`)) return;
    await deleteFood(food.id);
    showToast(`${food.name} deleted`, 'info');
  };

  const filters: { key: Filter; label: string }[] = [
    { key: 'all', label: 'All' },
    { key: 'favorites', label: 'Favorites' },
    { key: 'custom', label: 'Custom' },
  ];

  return (
    <div className="flex flex-col gap-4">
      <ScreenHeader
        title="Food database"
        subtitle="Search, favorite and edit foods"
        back
        trailing={
          <Button size="sm" onClick={openNew}>
            <IconPlus size={16} /> New
          </Button>
        }
      />

      <div className="relative">
        <IconSearch size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search foods"
          className="h-11 w-full rounded-control border bg-surface-2 pl-10 pr-3 text-base focus:border-accent/60 focus:outline-none"
        />
      </div>

      <div className="flex gap-2">
        {filters.map((f) => (
          <button
            key={f.key}
            type="button"
            onClick={() => setFilter(f.key)}
            className={`rounded-full border px-3 py-1.5 text-xs font-medium transition-colors duration-150 ${
              filter === f.key ? 'border-accent/60 bg-accent/10 text-text' : 'bg-surface-2 text-muted'
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <EmptyState
          icon={<IconUtensils size={24} />}
          title={query || filter !== 'all' ? 'No foods match' : 'No foods yet'}
          body={
            filter === 'custom'
              ? 'Add your own foods with the New button — per 100 g/ml or per piece.'
              : 'Try a different search or filter, or add a custom food.'
          }
          actionLabel="Add a food"
          onAction={openNew}
        />
      ) : (
        <ul className="flex flex-col gap-2">
          {filtered.map((food) => (
            <li key={food.id}>
              <Card className="flex items-center gap-3 p-3">
                <StarButton food={food} onToggle={() => setFoodFavorite(food.id, !food.isFavorite)} />
                <button
                  type="button"
                  onClick={() => openEdit(food)}
                  className="flex-1 text-left"
                  aria-label={`Edit ${food.name}`}
                >
                  <span className="flex items-center gap-2 text-sm font-medium">
                    {food.name}
                    {food.isCustom ? (
                      <span className="rounded-full bg-surface-2 px-1.5 py-0.5 text-[10px] uppercase text-muted">
                        custom
                      </span>
                    ) : null}
                  </span>
                  <span className="block text-[11px] text-muted">
                    {food.per100.kcal} kcal · {food.per100.proteinG} P · {food.per100.carbsG} C ·{' '}
                    {food.per100.fatG} F / {food.unit === 'piece' ? 'piece' : `100 ${food.unit}`}
                  </span>
                </button>
                {food.isCustom ? (
                  <button
                    type="button"
                    aria-label={`Delete ${food.name}`}
                    onClick={() => remove(food)}
                    className="text-xs text-muted hover:text-accent"
                  >
                    Delete
                  </button>
                ) : null}
              </Card>
            </li>
          ))}
        </ul>
      )}

      <FoodFormSheet open={formOpen} onClose={() => setFormOpen(false)} editing={editing} />
    </div>
  );
}
