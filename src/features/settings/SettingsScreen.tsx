import { Card } from '../../components/Card';
import { EmptyState } from '../../components/EmptyState';
import { ScreenHeader } from '../../components/ScreenHeader';
import { IconFlame, IconSettings } from '../../components/icons';

export function SettingsScreen() {
  return (
    <div className="flex flex-col gap-4">
      <ScreenHeader title="Settings" subtitle="Reminders, install and data" back />

      <Card className="flex items-center gap-3">
        <span className="flex h-11 w-11 items-center justify-center rounded-control bg-ember text-text">
          <IconFlame size={22} />
        </span>
        <span>
          <span className="block font-display text-base font-semibold">Forge</span>
          <span className="block text-xs text-muted">Build Yourself. · v0.1.0 · offline-first</span>
        </span>
      </Card>

      <EmptyState
        icon={<IconSettings size={24} />}
        title="No settings to tune yet"
        body="Reminders, install prompt and developer tools land here as their features arrive."
      />
    </div>
  );
}
