import { NavLink } from 'react-router-dom';
import type { ComponentType, SVGProps } from 'react';

import {
  IconChart,
  IconDots,
  IconDumbbell,
  IconHome,
  IconUtensils,
} from '../components/icons';

type Tab = {
  to: string;
  label: string;
  icon: ComponentType<SVGProps<SVGSVGElement> & { size?: number }>;
  end?: boolean;
};

const tabs: Tab[] = [
  { to: '/', label: 'Home', icon: IconHome, end: true },
  { to: '/nutrition', label: 'Nutrition', icon: IconUtensils },
  { to: '/workout', label: 'Workout', icon: IconDumbbell },
  { to: '/progress', label: 'Progress', icon: IconChart },
  { to: '/more', label: 'More', icon: IconDots },
];

export function TabBar() {
  return (
    <nav aria-label="Primary" className="glass z-30 shrink-0 border-t pb-safe">
      <div className="flex h-16 items-stretch">
        {tabs.map(({ to, label, icon: Icon, end }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            className={({ isActive }) =>
              `flex flex-1 flex-col items-center justify-center gap-1 text-[11px] font-medium transition-colors duration-150 ease-out ${
                isActive ? 'text-accent' : 'text-muted hover:text-text'
              }`
            }
          >
            {({ isActive }) => (
              <>
                <Icon size={22} strokeWidth={isActive ? 2.2 : 1.8} />
                <span>{label}</span>
              </>
            )}
          </NavLink>
        ))}
      </div>
    </nav>
  );
}
