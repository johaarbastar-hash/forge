import { useLiveQuery } from 'dexie-react-hooks';
import { useState } from 'react';

import { Button } from '../../components/Button';
import { Card } from '../../components/Card';
import { ScreenHeader } from '../../components/ScreenHeader';
import { useToast } from '../../components/Toast';
import { IconFlame } from '../../components/icons';
import { db } from '../../db/db';
import { loadDemoData } from '../../db/demoData';
import { getSettings, updateSettings } from '../../db/repositories/settingsRepo';
import { useMotionPref } from '../../stores/motionPref';
import type { ReminderConfig, ReminderType } from '../../types';
import { useInstallPrompt } from '../../app/useInstallPrompt';

const REMINDER_LABELS: Record<ReminderType, string> = {
  water: 'Water',
  meals: 'Meals',
  workout: 'Workout',
  sleep: 'Sleep',
  weighIn: 'Weekly weigh-in',
};

function Toggle({ on, onChange, label }: { on: boolean; onChange: (v: boolean) => void; label: string }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={on}
      aria-label={label}
      onClick={() => onChange(!on)}
      className={`relative h-6 w-11 shrink-0 rounded-full transition-colors ${on ? 'bg-accent' : 'bg-white/15'}`}
    >
      <span
        className={`absolute top-0.5 h-5 w-5 rounded-full bg-white transition-transform ${
          on ? 'translate-x-5' : 'translate-x-0.5'
        }`}
      />
    </button>
  );
}

export function SettingsScreen() {
  const { showToast } = useToast();
  const settings = useLiveQuery(() => getSettings(), []);
  const reduceMotion = useMotionPref((s) => s.reduceMotion);
  const setReduceMotion = useMotionPref((s) => s.setReduceMotion);
  const { promptInstall, installed } = useInstallPrompt();
  const [busy, setBusy] = useState<string | null>(null);
  const [wipeArm, setWipeArm] = useState(false);

  const setReminder = async (type: ReminderType, patch: Partial<ReminderConfig>) => {
    if (!settings) return;
    await updateSettings({
      reminders: { ...settings.reminders, [type]: { ...settings.reminders[type], ...patch } },
    });
  };

  const enableNotifications = async () => {
    if (typeof Notification === 'undefined') {
      showToast('Notifications not supported here', 'error');
      return;
    }
    const result = await Notification.requestPermission();
    showToast(result === 'granted' ? 'Notifications on' : 'Notifications not granted', 'info');
  };

  const runDemo = async () => {
    setBusy('demo');
    try {
      await loadDemoData();
      showToast('Demo data loaded — 30 days', 'success');
    } finally {
      setBusy(null);
    }
  };

  const wipe = async () => {
    setBusy('wipe');
    try {
      await db.delete();
      localStorage.clear();
      window.location.assign('/');
    } finally {
      setBusy(null);
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
          <span className="block text-xs text-muted">Build Yourself. · v1.0.0 · offline-first</span>
        </span>
      </Card>

      {/* Display */}
      <Card className="flex flex-col gap-3">
        <p className="text-xs font-medium uppercase tracking-wide text-muted">Display</p>
        <div className="flex items-center gap-3">
          <span className="flex-1">
            <span className="block text-sm">Reduce animations</span>
            <span className="block text-xs text-muted">
              Skips slide and fade effects. Turn on if you see flickering or glitchy pixels — some
              phone graphics chips misdraw animated panels.
            </span>
          </span>
          <Toggle on={reduceMotion} onChange={setReduceMotion} label="Reduce animations" />
        </div>
      </Card>

      {/* Reminders */}
      <Card className="flex flex-col gap-3">
        <p className="text-xs font-medium uppercase tracking-wide text-muted">Reminders</p>
        {settings ? (
          <>
            {(Object.keys(REMINDER_LABELS) as ReminderType[]).map((type) => {
              const cfg = settings.reminders[type];
              return (
                <div key={type} className="flex items-center gap-3">
                  <span className="flex-1 text-sm">{REMINDER_LABELS[type]}</span>
                  {cfg.enabled ? (
                    type === 'water' ? (
                      <select
                        value={cfg.intervalMin ?? 120}
                        onChange={(e) => setReminder(type, { intervalMin: Number(e.target.value) })}
                        className="h-8 rounded-control border bg-surface-2 px-2 text-xs focus:outline-none"
                        aria-label="Water interval"
                      >
                        {[60, 90, 120, 180].map((m) => (
                          <option key={m} value={m}>
                            every {m}m
                          </option>
                        ))}
                      </select>
                    ) : (
                      <input
                        type="time"
                        value={cfg.time ?? '13:00'}
                        onChange={(e) => setReminder(type, { time: e.target.value })}
                        className="h-8 rounded-control border bg-surface-2 px-2 text-xs focus:outline-none"
                        aria-label={`${REMINDER_LABELS[type]} time`}
                      />
                    )
                  ) : null}
                  <Toggle
                    on={cfg.enabled}
                    onChange={(v) => setReminder(type, { enabled: v })}
                    label={`${REMINDER_LABELS[type]} reminder`}
                  />
                </div>
              );
            })}
            <Button variant="ghost" size="sm" onClick={enableNotifications}>
              Enable system notifications
            </Button>
            <p className="text-[11px] text-muted">
              Reminders fire while Forge is open; background push arrives with cloud sync later.
            </p>
          </>
        ) : null}
      </Card>

      {/* Install */}
      <Card className="flex flex-col gap-2">
        <p className="text-xs font-medium uppercase tracking-wide text-muted">Install</p>
        {installed ? (
          <p className="text-sm text-muted">Forge is installed. Launch it from your home screen.</p>
        ) : promptInstall ? (
          <Button onClick={promptInstall}>Install Forge</Button>
        ) : (
          <p className="text-sm text-muted">
            Add Forge to your home screen from your browser menu for a full-screen, offline app.
          </p>
        )}
      </Card>

      {/* Developer */}
      <Card className="flex flex-col gap-3">
        <p className="text-xs font-medium uppercase tracking-wide text-muted">Developer</p>
        <Button variant="secondary" onClick={runDemo} disabled={busy !== null}>
          {busy === 'demo' ? 'Generating…' : 'Load demo data (30 days)'}
        </Button>
        {wipeArm ? (
          <div className="flex flex-col gap-2 rounded-control border border-accent/40 bg-accent/5 p-3">
            <p className="text-xs text-accent">This permanently deletes all your data. Are you sure?</p>
            <div className="flex gap-2">
              <Button variant="secondary" size="sm" onClick={() => setWipeArm(false)} className="flex-1">
                Cancel
              </Button>
              <Button variant="danger" size="sm" onClick={wipe} disabled={busy !== null} className="flex-1">
                {busy === 'wipe' ? 'Wiping…' : 'Delete everything'}
              </Button>
            </div>
          </div>
        ) : (
          <Button variant="danger" onClick={() => setWipeArm(true)}>
            Wipe all data
          </Button>
        )}
      </Card>
    </div>
  );
}
