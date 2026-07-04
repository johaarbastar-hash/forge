import { EmptyState } from '../../components/EmptyState';
import { ScreenHeader } from '../../components/ScreenHeader';
import { IconSparkles } from '../../components/icons';

export function CoachScreen() {
  return (
    <div className="flex flex-col gap-4">
      <ScreenHeader title="Coach" subtitle="Direct, specific, on your side" back />
      <EmptyState
        icon={<IconSparkles size={24} />}
        title="Coach is warming up"
        body="Log a few days of food, water and training and Coach starts flagging what actually matters."
      />
    </div>
  );
}
