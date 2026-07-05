import { useLiveQuery } from 'dexie-react-hooks';
import { useState } from 'react';

import { Button } from '../../components/Button';
import { Card } from '../../components/Card';
import { ScreenHeader } from '../../components/ScreenHeader';
import { IconDumbbell } from '../../components/icons';
import { getSplitTemplate } from '../../data/splits';
import { allExercises } from '../../db/repositories/exercisesRepo';
import { getProfile } from '../../db/repositories/profileRepo';
import {
  allWorkouts,
  createWorkout,
  startEntriesFor,
  updateWorkout,
  workoutByDay,
} from '../../db/repositories/workoutsRepo';
import { isPr } from '../../lib/e1rm';
import { todayKey, weekdayOf } from '../../lib/dates';
import { historyByExercise, setsVolume } from '../../lib/workoutHistory';
import type { Exercise, Workout } from '../../types';
import { SessionLogger } from './SessionLogger';

function Loading() {
  return (
    <div className="flex h-40 items-center justify-center" role="status" aria-label="Loading">
      <div className="h-6 w-6 animate-spin rounded-full border-2 border-white/10 border-t-accent" />
    </div>
  );
}

function SummaryCard({
  workout,
  exercisesById,
  priorCompleted,
}: {
  workout: Workout;
  exercisesById: Map<string, Exercise>;
  priorCompleted: Workout[];
}) {
  const history = historyByExercise(priorCompleted.filter((w) => w.id !== workout.id));
  const totalSets = workout.entries.reduce((s, e) => s + e.sets.length, 0);
  const volume = workout.entries.reduce((s, e) => s + setsVolume(e.sets), 0);
  const prExercises = workout.entries
    .filter((e) => isPr(e.sets, history.get(e.exerciseId) ?? { bestWeightKg: 0, bestE1rm: 0 }).pr)
    .map((e) => exercisesById.get(e.exerciseId)?.name ?? 'Exercise');

  return (
    <Card className="flex flex-col gap-3">
      <div className="flex items-center gap-2">
        <span className="flex h-9 w-9 items-center justify-center rounded-control bg-ember text-text">
          <IconDumbbell size={18} />
        </span>
        <div>
          <p className="font-display text-sm font-semibold">{workout.splitDay} session complete</p>
          <p className="text-xs text-muted">+50 XP earned</p>
        </div>
      </div>
      <div className="grid grid-cols-3 gap-2 text-center">
        <div>
          <p className="metric text-lg font-semibold">{workout.durationMin}</p>
          <p className="text-[11px] text-muted">minutes</p>
        </div>
        <div>
          <p className="metric text-lg font-semibold">{totalSets}</p>
          <p className="text-[11px] text-muted">sets</p>
        </div>
        <div>
          <p className="metric text-lg font-semibold">{Math.round(volume)}</p>
          <p className="text-[11px] text-muted">kg volume</p>
        </div>
      </div>
      {prExercises.length > 0 ? (
        <p className="rounded-control bg-ember/10 px-3 py-2 text-xs text-ember">
          New PR: {prExercises.join(', ')}
        </p>
      ) : null}
    </Card>
  );
}

export function WorkoutScreen() {
  const today = todayKey();
  const [starting, setStarting] = useState(false);

  const data = useLiveQuery(async () => {
    const [profile, workout, exercises, workouts] = await Promise.all([
      getProfile(),
      workoutByDay(today),
      allExercises(),
      allWorkouts(),
    ]);
    return {
      profile: profile ?? null,
      workout: workout ?? null,
      exercisesById: new Map(exercises.map((e) => [e.id, e])),
      completed: workouts.filter((w) => w.completed),
    };
  }, [today]);

  if (!data) {
    return (
      <div>
        <ScreenHeader title="Workout" subtitle="Today’s session" />
        <Loading />
      </div>
    );
  }

  const { profile, workout, exercisesById } = data;
  const splitDay = profile ? getSplitTemplate(profile.splitId)?.schedule[weekdayOf(today)] : undefined;
  const isRestDay = !splitDay || !('exerciseIds' in splitDay);
  const dayLabel = splitDay && 'label' in splitDay ? splitDay.label : 'Workout';

  const startSession = async (exerciseIds: string[], label: string) => {
    setStarting(true);
    try {
      const entries = await startEntriesFor(exerciseIds);
      await createWorkout({ dayKey: today, splitDay: label, entries });
    } finally {
      setStarting(false);
    }
  };

  // Completed session → summary + reopen.
  if (workout?.completed) {
    return (
      <div className="flex flex-col gap-4">
        <ScreenHeader title="Workout" subtitle={`${dayLabel} · done`} />
        <SummaryCard workout={workout} exercisesById={exercisesById} priorCompleted={data.completed} />
        <Button variant="secondary" onClick={() => updateWorkout(workout.id, { completed: false })}>
          Reopen to edit
        </Button>
      </div>
    );
  }

  // Session in progress.
  if (workout) {
    return (
      <div className="flex flex-col gap-4">
        <ScreenHeader title={`${workout.splitDay} day`} subtitle="Log your sets" />
        <SessionLogger workout={workout} exercisesById={exercisesById} />
      </div>
    );
  }

  // Rest day.
  if (isRestDay) {
    return (
      <div className="flex flex-col gap-4">
        <ScreenHeader title="Workout" subtitle="Today" />
        <Card className="flex flex-col items-center gap-2 py-8 text-center">
          <span className="flex h-12 w-12 items-center justify-center rounded-full bg-surface-2 text-muted">
            <IconDumbbell size={24} />
          </span>
          <h3 className="font-display text-base font-semibold">Rest day</h3>
          <p className="max-w-[26ch] text-sm text-muted">
            Recovery is training too. Let the work you’ve done settle in.
          </p>
          <Button
            variant="ghost"
            size="sm"
            disabled={starting}
            onClick={() => startSession([], 'Custom')}
          >
            Train anyway
          </Button>
        </Card>
      </div>
    );
  }

  // Training day, not started → preview scheduled exercises.
  const exerciseIds = splitDay && 'exerciseIds' in splitDay ? splitDay.exerciseIds : [];
  return (
    <div className="flex flex-col gap-4">
      <ScreenHeader title={`${dayLabel} day`} subtitle="Today’s plan" />
      <Card className="flex flex-col gap-2">
        <p className="text-xs font-medium uppercase tracking-wide text-muted">Scheduled exercises</p>
        <ul className="flex flex-col divide-y divide-white/5">
          {exerciseIds.map((id) => (
            <li key={id} className="flex items-center gap-2 py-2 text-sm">
              <span className="h-1.5 w-1.5 rounded-full bg-accent" />
              {exercisesById.get(id)?.name ?? id}
            </li>
          ))}
        </ul>
      </Card>
      <Button size="lg" disabled={starting} onClick={() => startSession(exerciseIds, dayLabel)}>
        {starting ? 'Starting…' : 'Start session'}
      </Button>
    </div>
  );
}
