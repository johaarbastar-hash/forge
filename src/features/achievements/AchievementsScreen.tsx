import { useLiveQuery } from 'dexie-react-hooks';

import { Card } from '../../components/Card';
import { ScreenHeader } from '../../components/ScreenHeader';
import { IconCheck, IconTrophy } from '../../components/icons';
import { achievementDefs } from '../../data/achievements';
import { allUnlocks } from '../../db/repositories/achievementsRepo';
import { missionContextFor } from '../../db/repositories/gamificationRepo';
import { getGoals } from '../../db/repositories/goalsRepo';
import { mealsByDays } from '../../db/repositories/mealsRepo';
import { allWeightLogs } from '../../db/repositories/weightRepo';
import { allWorkouts } from '../../db/repositories/workoutsRepo';
import { allXpEvents } from '../../db/repositories/xpRepo';
import { todayKey, weekKeys } from '../../lib/dates';
import { dailyMissionStatus, weeklyChallengeStatus } from '../../lib/gamification';

function ProgressBar({ current, target }: { current: number; target: number }) {
  const pct = target > 0 ? Math.min(1, current / target) : 0;
  return (
    <div className="h-1.5 w-full overflow-hidden rounded-full bg-white/10">
      <div
        className={`h-full rounded-full ${pct >= 1 ? 'bg-success' : 'bg-accent'}`}
        style={{ width: `${Math.round(pct * 100)}%` }}
      />
    </div>
  );
}

export function AchievementsScreen() {
  const today = todayKey();

  const data = useLiveQuery(async () => {
    const week = weekKeys(today);
    const weekSet = new Set(week);
    const [ctx, goals, weekMeals, workouts, weightLogs, xpEvents] = await Promise.all([
      missionContextFor(today),
      getGoals(),
      mealsByDays(week),
      allWorkouts(),
      allWeightLogs(),
      allXpEvents(),
    ]);

    const trackedDays = new Set(weekMeals.map((m) => m.dayKey)).size;
    const proteinHitDays = new Set(
      xpEvents.filter((e) => e.type === 'PROTEIN_GOAL_HIT' && weekSet.has(e.dayKey)).map((e) => e.dayKey),
    ).size;
    const workoutsThisWeek = workouts.filter((w) => w.completed && weekSet.has(w.dayKey)).length;
    const weightLogsThisWeek = weightLogs.filter((w) => weekSet.has(w.dayKey)).length;

    return {
      missions: dailyMissionStatus(ctx),
      challenges: weeklyChallengeStatus({
        workoutsThisWeek,
        workoutsTarget: goals?.workoutsPerWeek ?? 0,
        proteinHitDays,
        trackedDays,
        weightLogsThisWeek,
      }),
      unlocked: new Set((await allUnlocks()).map((u) => u.achievementId)),
    };
  }, [today]);

  const missions = data?.missions.filter((m) => m.applicable) ?? [];
  const unlockedCount = data ? [...data.unlocked].length : 0;

  return (
    <div className="flex flex-col gap-4">
      <ScreenHeader title="Achievements" subtitle={`${unlockedCount}/12 unlocked · missions & challenges`} back />

      <Card className="flex flex-col gap-3">
        <p className="text-xs font-medium uppercase tracking-wide text-muted">Today’s missions</p>
        {missions.map((m) => (
          <div key={m.id} className="flex items-center gap-2 text-sm">
            <span
              className={`flex h-5 w-5 items-center justify-center rounded-full border ${
                m.done ? 'border-success bg-success/20 text-success' : 'border-white/15 text-transparent'
              }`}
            >
              <IconCheck size={12} />
            </span>
            <span className={m.done ? 'text-text' : 'text-muted'}>{m.title}</span>
          </div>
        ))}
        {missions.every((m) => m.done) && missions.length > 0 ? (
          <p className="rounded-control bg-ember/10 px-3 py-1.5 text-xs text-ember">
            All missions done — +30 XP earned today.
          </p>
        ) : null}
      </Card>

      <Card className="flex flex-col gap-3">
        <p className="text-xs font-medium uppercase tracking-wide text-muted">This week’s challenges</p>
        {(data?.challenges ?? []).map((c) => (
          <div key={c.id} className="flex flex-col gap-1.5">
            <div className="flex items-center justify-between text-sm">
              <span className={c.done ? 'text-text' : 'text-muted'}>{c.title}</span>
              <span className="metric text-xs text-muted">
                {Math.min(c.current, c.target)}/{c.target}
              </span>
            </div>
            <ProgressBar current={c.current} target={c.target} />
          </div>
        ))}
      </Card>

      <div>
        <p className="mb-2 text-xs font-medium uppercase tracking-wide text-muted">Achievements</p>
        <div className="grid grid-cols-2 gap-3">
          {achievementDefs.map((a) => {
            const unlocked = data?.unlocked.has(a.id) ?? false;
            return (
              <Card
                key={a.id}
                className={`flex flex-col items-center gap-1.5 py-4 text-center ${unlocked ? '' : 'opacity-45'}`}
              >
                <span
                  className={`flex h-11 w-11 items-center justify-center rounded-full ${
                    unlocked ? 'bg-ember text-text' : 'bg-surface-2 text-muted'
                  }`}
                >
                  <IconTrophy size={22} />
                </span>
                <span className="font-display text-xs font-semibold">{a.title}</span>
                <span className="text-[10px] text-muted">{a.description}</span>
              </Card>
            );
          })}
        </div>
      </div>
    </div>
  );
}
