import { useLiveQuery } from 'dexie-react-hooks';
import { useParams } from 'react-router-dom';

import { Card } from '../../components/Card';
import { EmptyState } from '../../components/EmptyState';
import { ScreenHeader } from '../../components/ScreenHeader';
import { StatCard } from '../../components/StatCard';
import { IconDumbbell } from '../../components/icons';
import { getExercise } from '../../db/repositories/exercisesRepo';
import { exerciseHistory } from '../../db/repositories/workoutsRepo';
import { e1rm } from '../../lib/e1rm';
import { fromDayKey } from '../../lib/dates';

export function ExerciseHistoryScreen() {
  const { exerciseId = '' } = useParams();

  const data = useLiveQuery(async () => {
    const [exercise, sessions] = await Promise.all([
      getExercise(exerciseId),
      exerciseHistory(exerciseId),
    ]);
    return { exercise: exercise ?? null, sessions };
  }, [exerciseId]);

  if (!data) {
    return (
      <div>
        <ScreenHeader title="History" back />
        <div className="flex h-40 items-center justify-center" role="status" aria-label="Loading">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-white/10 border-t-accent" />
        </div>
      </div>
    );
  }

  const { exercise, sessions } = data;
  const bestWeight = sessions.reduce((m, s) => Math.max(m, s.bestWeightKg), 0);
  const bestE1rm = sessions.reduce((m, s) => Math.max(m, s.bestE1rm), 0);
  // A session is a PR session if it set an all-time best at that point in time.
  const ordered = [...sessions];
  let runWeight = 0;
  let runE1rm = 0;
  const prSessions = new Set<string>();
  for (const s of ordered) {
    if (s.bestWeightKg > runWeight + 1e-9 || s.bestE1rm > runE1rm + 1e-9) prSessions.add(s.workoutId);
    runWeight = Math.max(runWeight, s.bestWeightKg);
    runE1rm = Math.max(runE1rm, s.bestE1rm);
  }

  return (
    <div className="flex flex-col gap-4">
      <ScreenHeader title={exercise?.name ?? 'Exercise'} subtitle="History and records" back />

      {sessions.length === 0 ? (
        <EmptyState
          icon={<IconDumbbell size={24} />}
          title="No sessions yet"
          body="Log a workout with this exercise and your sets, best weight and e1RM records show up here."
        />
      ) : (
        <>
          <div className="grid grid-cols-2 gap-3">
            <StatCard label="Best weight" value={String(bestWeight)} unit="kg" />
            <StatCard label="Best e1RM" value={bestE1rm.toFixed(1)} unit="kg" sub="Epley estimate" />
          </div>

          <div className="flex flex-col gap-2">
            {[...sessions].reverse().map((s) => (
              <Card key={s.workoutId} className="flex flex-col gap-2 p-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">
                    {new Intl.DateTimeFormat('en-GB', {
                      day: 'numeric',
                      month: 'short',
                      year: 'numeric',
                    }).format(fromDayKey(s.dayKey))}
                  </span>
                  {prSessions.has(s.workoutId) ? (
                    <span className="rounded-full bg-ember/15 px-2 py-0.5 text-[10px] font-semibold uppercase text-ember">
                      PR
                    </span>
                  ) : null}
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {s.sets.map((set, i) => (
                    <span
                      key={i}
                      className="metric rounded-control bg-surface-2 px-2 py-1 text-xs tabular-nums"
                      title={`e1RM ${e1rm(set.weightKg, set.reps).toFixed(1)} kg`}
                    >
                      {set.reps} × {set.weightKg} kg
                    </span>
                  ))}
                </div>
              </Card>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
