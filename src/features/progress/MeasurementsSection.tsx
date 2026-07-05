import { useLiveQuery } from 'dexie-react-hooks';
import { useState } from 'react';

import { Button } from '../../components/Button';
import { Card } from '../../components/Card';
import { EmptyState } from '../../components/EmptyState';
import { Input } from '../../components/Input';
import { Sheet } from '../../components/Sheet';
import { useToast } from '../../components/Toast';
import { IconChart, IconPlus } from '../../components/icons';
import {
  addMeasurement,
  allMeasurements,
  deleteMeasurement,
  updateMeasurement,
} from '../../db/repositories/measurementsRepo';
import { fromDayKey, todayKey } from '../../lib/dates';
import type { Measurement } from '../../types';
import { Sparkline } from './ProgressCharts';

type FieldKey = 'chestCm' | 'waistCm' | 'armCm' | 'thighCm' | 'hipCm' | 'shoulderCm';
const FIELDS: { key: FieldKey; label: string }[] = [
  { key: 'chestCm', label: 'Chest' },
  { key: 'waistCm', label: 'Waist' },
  { key: 'armCm', label: 'Arm' },
  { key: 'thighCm', label: 'Thigh' },
  { key: 'hipCm', label: 'Hip' },
  { key: 'shoulderCm', label: 'Shoulder' },
];

type Draft = Record<FieldKey, string> & { dayKey: string };
const emptyDraft = (dayKey: string): Draft => ({
  dayKey,
  chestCm: '',
  waistCm: '',
  armCm: '',
  thighCm: '',
  hipCm: '',
  shoulderCm: '',
});

function toDraft(m: Measurement): Draft {
  const d = emptyDraft(m.dayKey);
  for (const { key } of FIELDS) {
    const v = m[key];
    if (typeof v === 'number') d[key] = String(v);
  }
  return d;
}

function fmtDate(dayKey: string): string {
  return new Intl.DateTimeFormat('en-GB', { day: 'numeric', month: 'short' }).format(fromDayKey(dayKey));
}

export function MeasurementsSection() {
  const { showToast } = useToast();
  const measurements = useLiveQuery(() => allMeasurements(), []);
  const [open, setOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [draft, setDraft] = useState<Draft>(emptyDraft(todayKey()));

  const openNew = () => {
    setEditId(null);
    setDraft(emptyDraft(todayKey()));
    setOpen(true);
  };
  const openEdit = (m: Measurement) => {
    setEditId(m.id);
    setDraft(toDraft(m));
    setOpen(true);
  };

  const save = async () => {
    const fields: Partial<Record<FieldKey, number>> = {};
    for (const { key } of FIELDS) {
      const n = Number(draft[key]);
      if (draft[key].trim() !== '' && Number.isFinite(n)) fields[key] = n;
    }
    if (Object.keys(fields).length === 0) {
      showToast('Enter at least one measurement', 'error');
      return;
    }
    if (editId) {
      await updateMeasurement(editId, { dayKey: draft.dayKey, ...fields });
    } else {
      await addMeasurement({ dayKey: draft.dayKey, ...fields });
    }
    setOpen(false);
    showToast('Measurement saved', 'success');
  };

  const remove = async (id: string) => {
    if (!window.confirm('Delete this measurement entry?')) return;
    await deleteMeasurement(id);
    showToast('Entry deleted', 'info');
  };

  const sorted = [...(measurements ?? [])].sort((a, b) => a.dayKey.localeCompare(b.dayKey));

  return (
    <div className="flex flex-col gap-4">
      <Button onClick={openNew} fullWidth>
        <IconPlus size={18} /> Add measurement
      </Button>

      {sorted.length === 0 ? (
        <EmptyState
          icon={<IconChart size={24} />}
          title="No measurements yet"
          body="Log chest, waist, arms and more to watch each one trend over time."
        />
      ) : (
        <>
          <div className="grid grid-cols-2 gap-3">
            {FIELDS.map(({ key, label }) => {
              const points = sorted
                .map((m) => m[key])
                .filter((v): v is number => typeof v === 'number')
                .map((value) => ({ value }));
              const latest = points.at(-1)?.value;
              return (
                <Card key={key} className="flex flex-col gap-1">
                  <div className="flex items-baseline justify-between">
                    <span className="text-xs font-medium text-muted">{label}</span>
                    <span className="metric text-lg font-semibold">
                      {latest != null ? latest : '—'}
                      {latest != null ? <span className="text-xs font-normal text-muted"> cm</span> : null}
                    </span>
                  </div>
                  {points.length > 1 ? <Sparkline data={points} /> : <div className="h-8" />}
                </Card>
              );
            })}
          </div>

          <div className="flex flex-col gap-2">
            <p className="text-xs font-medium uppercase tracking-wide text-muted">Entries</p>
            {[...sorted].reverse().map((m) => (
              <Card key={m.id} className="flex items-center gap-3 p-3">
                <button type="button" onClick={() => openEdit(m)} className="flex-1 text-left">
                  <span className="block text-sm font-medium">{fmtDate(m.dayKey)}</span>
                  <span className="block text-[11px] text-muted">
                    {FIELDS.filter(({ key }) => typeof m[key] === 'number')
                      .map(({ key, label }) => `${label} ${m[key]}`)
                      .join(' · ') || 'No values'}
                  </span>
                </button>
                <button
                  type="button"
                  onClick={() => remove(m.id)}
                  className="text-xs text-muted hover:text-accent"
                >
                  Delete
                </button>
              </Card>
            ))}
          </div>
        </>
      )}

      <Sheet open={open} onClose={() => setOpen(false)} title={editId ? 'Edit measurement' : 'New measurement'}>
        <div className="flex max-h-[70vh] flex-col gap-3 overflow-y-auto">
          <Input
            label="Date"
            type="date"
            value={draft.dayKey}
            onChange={(e) => setDraft((d) => ({ ...d, dayKey: e.target.value }))}
          />
          <div className="grid grid-cols-2 gap-3">
            {FIELDS.map(({ key, label }) => (
              <Input
                key={key}
                label={`${label} (cm)`}
                type="number"
                inputMode="decimal"
                step="any"
                value={draft[key]}
                onChange={(e) => setDraft((d) => ({ ...d, [key]: e.target.value }))}
              />
            ))}
          </div>
          <Button onClick={save} fullWidth size="lg">
            Save measurement
          </Button>
        </div>
      </Sheet>
    </div>
  );
}
