import { useNavigate } from 'react-router-dom';

import { Button } from '../../components/Button';
import { Card } from '../../components/Card';
import { ScreenHeader } from '../../components/ScreenHeader';
import { useToast } from '../../components/Toast';
import { IconChevronRight, IconDownload } from '../../components/icons';
import { exportAll } from '../../db/export';
import { allExercises } from '../../db/repositories/exercisesRepo';
import { allFoods } from '../../db/repositories/foodsRepo';
import { allHabits, allHabitLogs } from '../../db/repositories/habitsRepo';
import { allMeals } from '../../db/repositories/mealsRepo';
import { allSleepLogs } from '../../db/repositories/sleepRepo';
import { allWaterLogs } from '../../db/repositories/waterRepo';
import { allWeightLogs } from '../../db/repositories/weightRepo';
import { allWorkouts } from '../../db/repositories/workoutsRepo';
import { toCsv } from '../../lib/csv';
import { CATEGORY_LABELS } from '../nutrition/mealFormatting';

function download(filename: string, content: string, mime: string) {
  const blob = new Blob([content], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export function ExportScreen() {
  const navigate = useNavigate();
  const { showToast } = useToast();

  const csvExports: { label: string; file: string; build: () => Promise<string> }[] = [
    {
      label: 'Meals',
      file: 'forge-meals.csv',
      build: async () => {
        const [meals, foods] = await Promise.all([allMeals(), allFoods()]);
        const byId = new Map(foods.map((f) => [f.id, f.name]));
        return toCsv(
          ['dayKey', 'time', 'category', 'foods', 'kcal', 'protein', 'carbs', 'fat', 'fiber'],
          meals.map((m) => [
            m.dayKey,
            m.time,
            CATEGORY_LABELS[m.category],
            m.items.map((i) => `${byId.get(i.foodId) ?? i.foodId} (${i.grams}g)`).join('; '),
            Math.round(m.cachedMacros.kcal),
            m.cachedMacros.proteinG,
            m.cachedMacros.carbsG,
            m.cachedMacros.fatG,
            m.cachedMacros.fiberG,
          ]),
        );
      },
    },
    {
      label: 'Water',
      file: 'forge-water.csv',
      build: async () => {
        const water = await allWaterLogs();
        return toCsv(
          ['dayKey', 'time', 'ml'],
          water.sort((a, b) => a.dayKey.localeCompare(b.dayKey)).map((w) => [w.dayKey, w.time, w.ml]),
        );
      },
    },
    {
      label: 'Weight',
      file: 'forge-weight.csv',
      build: async () => {
        const weight = await allWeightLogs();
        return toCsv(['dayKey', 'kg'], weight.map((w) => [w.dayKey, w.kg]));
      },
    },
    {
      label: 'Workouts',
      file: 'forge-workouts.csv',
      build: async () => {
        const [workouts, exercises] = await Promise.all([allWorkouts(), allExercises()]);
        const byId = new Map(exercises.map((e) => [e.id, e.name]));
        const rows: (string | number)[][] = [];
        for (const w of workouts) {
          for (const entry of w.entries) {
            entry.sets.forEach((set, i) => {
              rows.push([
                w.dayKey,
                w.splitDay,
                w.completed ? 'yes' : 'no',
                byId.get(entry.exerciseId) ?? entry.exerciseId,
                i + 1,
                set.reps,
                set.weightKg,
              ]);
            });
          }
        }
        return toCsv(['dayKey', 'splitDay', 'completed', 'exercise', 'set', 'reps', 'weightKg'], rows);
      },
    },
    {
      label: 'Sleep',
      file: 'forge-sleep.csv',
      build: async () => {
        const sleep = await allSleepLogs();
        return toCsv(
          ['dayKey', 'hours', 'bedtime'],
          sleep.map((s) => [s.dayKey, s.hours, s.bedtime ?? '']),
        );
      },
    },
    {
      label: 'Habits',
      file: 'forge-habits.csv',
      build: async () => {
        const [logs, habits] = await Promise.all([allHabitLogs(), allHabits()]);
        const byId = new Map(habits.map((h) => [h.id, h.name]));
        return toCsv(
          ['dayKey', 'habit', 'done'],
          logs
            .sort((a, b) => a.dayKey.localeCompare(b.dayKey))
            .map((l) => [l.dayKey, byId.get(l.habitId) ?? l.habitId, l.done ? 'yes' : 'no']),
        );
      },
    },
  ];

  const runCsv = async (item: (typeof csvExports)[number]) => {
    const content = await item.build();
    download(item.file, content, 'text/csv');
    showToast(`${item.label} exported`, 'success');
  };

  const runJson = async () => {
    const dump = await exportAll();
    download('forge-backup.json', JSON.stringify(dump, null, 2), 'application/json');
    showToast('Full backup exported', 'success');
  };

  return (
    <div className="flex flex-col gap-4">
      <ScreenHeader title="Export" subtitle="Your data, portable" back />

      <Card className="flex flex-col gap-2">
        <p className="text-xs font-medium uppercase tracking-wide text-muted">CSV by data type</p>
        <div className="grid grid-cols-2 gap-2">
          {csvExports.map((item) => (
            <Button key={item.file} variant="secondary" size="sm" onClick={() => runCsv(item)}>
              <IconDownload size={16} /> {item.label}
            </Button>
          ))}
        </div>
      </Card>

      <Card className="flex flex-col gap-3">
        <div>
          <p className="text-sm font-medium">Full backup (JSON)</p>
          <p className="text-xs text-muted">Everything, including photos — re-importable later.</p>
        </div>
        <Button onClick={runJson}>
          <IconDownload size={16} /> Download JSON backup
        </Button>
      </Card>

      <button
        type="button"
        onClick={() => navigate('/more/analytics')}
        className="flex items-center justify-between rounded-card border bg-surface px-4 py-3.5 text-left transition-colors hover:bg-white/5"
      >
        <span>
          <span className="block text-sm font-medium">Printable report</span>
          <span className="block text-xs text-muted">Open the monthly report and print it</span>
        </span>
        <IconChevronRight size={18} className="text-muted" />
      </button>
    </div>
  );
}
