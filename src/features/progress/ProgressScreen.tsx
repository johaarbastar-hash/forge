import { EmptyState } from '../../components/EmptyState';
import { ScreenHeader } from '../../components/ScreenHeader';
import { IconChart } from '../../components/icons';

export function ProgressScreen() {
  return (
    <div className="flex flex-col gap-4">
      <ScreenHeader title="Progress" subtitle="Charts, measurements and photos" />
      <EmptyState
        icon={<IconChart size={24} />}
        title="No progress data yet"
        body="Log weight, meals and workouts — charts, measurements and photo timelines build themselves from your logs."
      />
    </div>
  );
}
