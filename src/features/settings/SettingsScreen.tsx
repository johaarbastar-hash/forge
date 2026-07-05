import { useState } from 'react';

import { Button } from '../../components/Button';
import { Card } from '../../components/Card';
import { EmptyState } from '../../components/EmptyState';
import { ScreenHeader } from '../../components/ScreenHeader';
import { useToast } from '../../components/Toast';
import { IconFlame, IconSettings } from '../../components/icons';
import { loadDemoData } from '../../db/demoData';

export function SettingsScreen() {
  const { showToast } = useToast();
  const [loading, setLoading] = useState(false);

  const runDemo = async () => {
    setLoading(true);
    try {
      await loadDemoData();
      showToast('Demo data loaded — 30 days', 'success');
    } finally {
      setLoading(false);
    }
  };

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

      {/* Temporary dev hook — Phase 8 formalises Developer tools (demo + wipe). */}
      <Card className="flex flex-col gap-2">
        <p className="text-xs font-medium uppercase tracking-wide text-muted">Developer</p>
        <p className="text-sm text-muted">
          Generate 30 days of plausible logs to exercise charts, analytics and gamification.
        </p>
        <Button variant="secondary" onClick={runDemo} disabled={loading}>
          {loading ? 'Generating…' : 'Load demo data'}
        </Button>
      </Card>

      <EmptyState
        icon={<IconSettings size={24} />}
        title="More settings coming"
        body="Reminders, install prompt and data export land here in the final phase."
      />
    </div>
  );
}
