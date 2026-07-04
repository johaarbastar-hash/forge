import { useNavigate } from 'react-router-dom';

import { Card } from '../../components/Card';
import { EmptyState } from '../../components/EmptyState';
import { ProgressRing } from '../../components/ProgressRing';
import { ScreenHeader } from '../../components/ScreenHeader';
import { IconFlame } from '../../components/icons';

function greeting(hour: number): string {
  if (hour < 5) return 'Late night';
  if (hour < 12) return 'Good morning';
  if (hour < 17) return 'Good afternoon';
  return 'Good evening';
}

export function HomeScreen() {
  const navigate = useNavigate();
  const now = new Date();
  const dateLabel = new Intl.DateTimeFormat('en-GB', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  }).format(now);

  return (
    <div className="flex flex-col gap-4">
      <ScreenHeader title={greeting(now.getHours())} subtitle={dateLabel} />

      <Card className="flex flex-col items-center gap-2 py-6">
        <ProgressRing value={0} aria-label="Calories today">
          <span className="metric text-4xl font-bold">0</span>
          <span className="text-xs text-muted">kcal today</span>
        </ProgressRing>
        <p className="text-sm text-muted">Set goals in onboarding to size this ring.</p>
      </Card>

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
