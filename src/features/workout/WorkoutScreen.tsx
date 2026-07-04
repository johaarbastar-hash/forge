import { EmptyState } from '../../components/EmptyState';
import { ScreenHeader } from '../../components/ScreenHeader';
import { IconDumbbell } from '../../components/icons';

export function WorkoutScreen() {
  return (
    <div className="flex flex-col gap-4">
      <ScreenHeader title="Workout" subtitle="Today’s session and training history" />
      <EmptyState
        icon={<IconDumbbell size={24} />}
        title="No session yet"
        body="Your scheduled split day appears here. Log your first session to start building history and PRs."
      />
    </div>
  );
}
