import { EmptyState } from '../../components/EmptyState';
import { ScreenHeader } from '../../components/ScreenHeader';
import { IconCalendar } from '../../components/icons';

export function CalendarScreen() {
  return (
    <div className="flex flex-col gap-4">
      <ScreenHeader title="Calendar" subtitle="Your month, day by day" back />
      <EmptyState
        icon={<IconCalendar size={24} />}
        title="Nothing logged this month"
        body="Days light up with dots as you log meals, workouts, water and weight."
      />
    </div>
  );
}
