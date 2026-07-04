import { EmptyState } from '../../components/EmptyState';
import { ScreenHeader } from '../../components/ScreenHeader';
import { IconCheck } from '../../components/icons';

export function HabitsScreen() {
  return (
    <div className="flex flex-col gap-4">
      <ScreenHeader title="Habits" subtitle="Small daily wins, checked off" back />
      <EmptyState
        icon={<IconCheck size={24} />}
        title="No habits to check yet"
        body="Daily habits like Gym, Stretching and Water Goal appear here — check them off to build streaks."
      />
    </div>
  );
}
