import { EmptyState } from '../../components/EmptyState';
import { ScreenHeader } from '../../components/ScreenHeader';
import { IconUser } from '../../components/icons';

export function ProfileScreen() {
  return (
    <div className="flex flex-col gap-4">
      <ScreenHeader title="Profile" subtitle="You, in numbers" back />
      <EmptyState
        icon={<IconUser size={24} />}
        title="No profile yet"
        body="Your name, height, weight, experience and BMI appear here after onboarding."
      />
    </div>
  );
}
