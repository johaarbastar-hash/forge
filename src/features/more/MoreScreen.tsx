import { Link } from 'react-router-dom';
import type { ComponentType, SVGProps } from 'react';

import { ScreenHeader } from '../../components/ScreenHeader';
import {
  IconCalendar,
  IconChart,
  IconCheck,
  IconChevronRight,
  IconDownload,
  IconSearch,
  IconSettings,
  IconSparkles,
  IconTarget,
  IconTrophy,
  IconUser,
} from '../../components/icons';

type MoreItem = {
  to: string;
  label: string;
  description: string;
  icon: ComponentType<SVGProps<SVGSVGElement> & { size?: number }>;
};

const items: MoreItem[] = [
  { to: '/more/calendar', label: 'Calendar', description: 'Every day at a glance', icon: IconCalendar },
  { to: '/more/habits', label: 'Habits', description: 'Daily check-offs and streaks', icon: IconCheck },
  { to: '/more/goals', label: 'Goals', description: 'Targets for food, water and training', icon: IconTarget },
  { to: '/more/analytics', label: 'Analytics', description: 'Weekly and monthly reports', icon: IconChart },
  { to: '/more/achievements', label: 'Achievements', description: 'Milestones you’ve unlocked', icon: IconTrophy },
  { to: '/more/coach', label: 'Coach', description: 'Insights from your last 14 days', icon: IconSparkles },
  { to: '/more/search', label: 'Search', description: 'Foods, exercises and days', icon: IconSearch },
  { to: '/more/export', label: 'Export', description: 'CSV, JSON and printable reports', icon: IconDownload },
  { to: '/more/profile', label: 'Profile', description: 'Your stats and BMI', icon: IconUser },
  { to: '/more/settings', label: 'Settings', description: 'Reminders, install and data', icon: IconSettings },
];

export function MoreScreen() {
  return (
    <div>
      <ScreenHeader title="More" subtitle="Everything beyond the daily loop" />
      <ul className="overflow-hidden rounded-card border bg-surface">
        {items.map(({ to, label, description, icon: Icon }, i) => (
          <li key={to} className={i > 0 ? 'border-t' : ''}>
            <Link
              to={to}
              className="flex items-center gap-3 px-4 py-3.5 transition-colors duration-150 hover:bg-white/5"
            >
              <span className="flex h-9 w-9 items-center justify-center rounded-control bg-surface-2 text-muted">
                <Icon size={18} />
              </span>
              <span className="flex-1">
                <span className="block text-sm font-medium">{label}</span>
                <span className="block text-xs text-muted">{description}</span>
              </span>
              <IconChevronRight size={18} className="text-muted" />
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
