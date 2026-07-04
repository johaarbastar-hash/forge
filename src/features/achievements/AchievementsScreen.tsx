import { EmptyState } from '../../components/EmptyState';
import { ScreenHeader } from '../../components/ScreenHeader';
import { IconTrophy } from '../../components/icons';

export function AchievementsScreen() {
  return (
    <div className="flex flex-col gap-4">
      <ScreenHeader title="Achievements" subtitle="Milestones on the way up" back />
      <EmptyState
        icon={<IconTrophy size={24} />}
        title="Nothing unlocked yet"
        body="Train, eat and stay consistent — badges unlock as the milestones fall."
      />
    </div>
  );
}
