import { EmptyState } from '../../components/EmptyState';
import { ScreenHeader } from '../../components/ScreenHeader';
import { IconTarget } from '../../components/icons';

export function GoalsScreen() {
  return (
    <div className="flex flex-col gap-4">
      <ScreenHeader title="Goals" subtitle="Calories, protein, water, sleep, training" back />
      <EmptyState
        icon={<IconTarget size={24} />}
        title="No goals set"
        body="Finish onboarding to set your calorie, protein, water, sleep and weekly training targets."
      />
    </div>
  );
}
