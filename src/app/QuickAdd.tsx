import { motion, useReducedMotion } from 'framer-motion';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import type { ComponentType, SVGProps } from 'react';

import { Sheet } from '../components/Sheet';
import {
  IconDrop,
  IconDumbbell,
  IconPlus,
  IconScale,
  IconUtensils,
} from '../components/icons';

type QuickAction = {
  label: string;
  description: string;
  to: string;
  icon: ComponentType<SVGProps<SVGSVGElement> & { size?: number }>;
};

// Quick-add targets navigate to each action's host screen; the real one-tap
// forms arrive with their features (meals Phase 3, water/weight Phase 4).
const actions: QuickAction[] = [
  { label: 'Meal', description: 'Log food by category', to: '/nutrition', icon: IconUtensils },
  { label: 'Water', description: 'Add to today’s intake', to: '/', icon: IconDrop },
  { label: 'Weight', description: 'Record today’s weigh-in', to: '/progress', icon: IconScale },
  { label: 'Workout', description: 'Open today’s session', to: '/workout', icon: IconDumbbell },
];

export function QuickAdd() {
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();
  const reducedMotion = useReducedMotion();

  return (
    <>
      <motion.button
        type="button"
        aria-label="Quick add"
        aria-haspopup="dialog"
        onClick={() => setOpen(true)}
        whileTap={reducedMotion ? undefined : { scale: 0.92 }}
        transition={{ type: 'spring', stiffness: 400, damping: 25 }}
        className="glass fixed bottom-24 right-4 z-30 flex h-14 w-14 items-center justify-center rounded-full border text-text shadow-lg shadow-black/50"
      >
        <span className="absolute inset-0 rounded-full bg-ember opacity-90" aria-hidden />
        <span className="relative">
          <IconPlus size={26} strokeWidth={2.2} />
        </span>
      </motion.button>

      <Sheet open={open} onClose={() => setOpen(false)} title="Quick add">
        <div className="grid grid-cols-2 gap-3">
          {actions.map(({ label, description, to, icon: Icon }) => (
            <button
              key={label}
              type="button"
              onClick={() => {
                setOpen(false);
                navigate(to);
              }}
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
    </>
  );
}
