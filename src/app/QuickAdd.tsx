import { motion } from 'framer-motion';
import { useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { useNavigate } from 'react-router-dom';
import type { ComponentType, SVGProps } from 'react';

import { Card } from '../components/Card';
import { Sheet } from '../components/Sheet';
import { IconDrop, IconDumbbell, IconPlus, IconScale, IconUtensils } from '../components/icons';
import { recentFoodIds } from '../db/repositories/mealsRepo';
import { todayKey } from '../lib/dates';
import { useAppReducedMotion } from '../stores/motionPref';
import { MealBuilderSheet } from '../features/nutrition/MealBuilderSheet';
import { WaterQuickPanel } from '../features/water/WaterQuickPanel';
import { WeightQuickPanel } from '../features/weight/WeightQuickPanel';

type ActionKey = 'meal' | 'water' | 'weight' | 'workout';

type QuickAction = {
  key: ActionKey;
  label: string;
  description: string;
  icon: ComponentType<SVGProps<SVGSVGElement> & { size?: number }>;
};

const actions: QuickAction[] = [
  { key: 'meal', label: 'Meal', description: 'Log food by category', icon: IconUtensils },
  { key: 'water', label: 'Water', description: 'Add to today’s intake', icon: IconDrop },
  { key: 'weight', label: 'Weight', description: 'Record today’s weigh-in', icon: IconScale },
  { key: 'workout', label: 'Workout', description: 'Open today’s session', icon: IconDumbbell },
];

export function QuickAdd() {
  const [chooserOpen, setChooserOpen] = useState(false);
  const [active, setActive] = useState<Exclude<ActionKey, 'workout'> | null>(null);
  const navigate = useNavigate();
  const reducedMotion = useAppReducedMotion();
  const today = todayKey();
  const hasRecents = useLiveQuery(async () => (await recentFoodIds(1)).length > 0, []) ?? false;

  const choose = (key: ActionKey) => {
    setChooserOpen(false);
    if (key === 'workout') {
      navigate('/workout');
      return;
    }
    setActive(key);
  };

  return (
    <>
      <motion.button
        type="button"
        aria-label="Quick add"
        aria-haspopup="dialog"
        onClick={() => setChooserOpen(true)}
        whileTap={reducedMotion ? undefined : { scale: 0.92 }}
        transition={{ type: 'spring', stiffness: 400, damping: 25 }}
        className="absolute bottom-20 right-4 z-30 flex h-14 w-14 items-center justify-center rounded-full border border-white/10 text-text shadow-md shadow-black/40"
      >
        <span className="absolute inset-0 rounded-full bg-ember" aria-hidden />
        <span className="relative">
          <IconPlus size={26} strokeWidth={2.2} />
        </span>
      </motion.button>

      <Sheet open={chooserOpen} onClose={() => setChooserOpen(false)} title="Quick add">
        <div className="grid grid-cols-2 gap-3">
          {actions.map(({ key, label, description, icon: Icon }) => (
            <button
              key={key}
              type="button"
              onClick={() => choose(key)}
              className="flex flex-col items-start gap-2 rounded-card border bg-surface-2 p-4 text-left transition-colors duration-150 hover:bg-white/10"
            >
              <span className="text-accent">
                <Icon size={22} />
              </span>
              <span>
                <span className="block font-display text-sm font-semibold">{label}</span>
                <span className="mt-0.5 block text-xs text-muted">{description}</span>
              </span>
            </button>
          ))}
        </div>
      </Sheet>

      {active === 'meal' ? (
        <MealBuilderSheet
          open
          onClose={() => setActive(null)}
          dayKey={today}
          target={{ mode: 'create' }}
          initialTab={hasRecents ? 'recents' : 'search'}
        />
      ) : null}

      <Sheet open={active === 'water'} onClose={() => setActive(null)} title="Add water">
        <WaterQuickPanel dayKey={today} />
      </Sheet>

      <Sheet open={active === 'weight'} onClose={() => setActive(null)} title="Log weight">
        <Card variant="surface-2">
          <WeightQuickPanel dayKey={today} onSaved={() => setActive(null)} />
        </Card>
      </Sheet>
    </>
  );
}
