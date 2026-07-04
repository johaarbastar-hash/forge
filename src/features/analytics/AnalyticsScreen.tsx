import { EmptyState } from '../../components/EmptyState';
import { ScreenHeader } from '../../components/ScreenHeader';
import { IconChart } from '../../components/icons';

export function AnalyticsScreen() {
  return (
    <div className="flex flex-col gap-4">
      <ScreenHeader title="Analytics" subtitle="Weekly and monthly reports" back />
      <EmptyState
        icon={<IconChart size={24} />}
        title="No reports yet"
        body="Scores for nutrition, consistency, recovery and hydration appear after your first week of logging."
      />
    </div>
  );
}
