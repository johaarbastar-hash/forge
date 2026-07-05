import { useEffect, useRef, useState } from 'react';

import { remainingSeconds, useRestTimer } from '../../stores/restTimer';

const PRESETS = [60, 90, 120, 180];

/** Short two-tone chime via Web Audio; silently no-ops where unsupported. */
function playChime() {
  try {
    const Ctx =
      window.AudioContext ??
      (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!Ctx) return;
    const ctx = new Ctx();
    const now = ctx.currentTime;
    [880, 1320].forEach((freq, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.frequency.value = freq;
      osc.type = 'sine';
      const t = now + i * 0.18;
      gain.gain.setValueAtTime(0.0001, t);
      gain.gain.exponentialRampToValueAtTime(0.25, t + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.16);
      osc.connect(gain).connect(ctx.destination);
      osc.start(t);
      osc.stop(t + 0.18);
    });
    setTimeout(() => void ctx.close(), 600);
  } catch {
    // audio blocked / unavailable — ignore
  }
}

function fmt(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${String(s).padStart(2, '0')}`;
}

export function RestTimer() {
  const { endsAt, durationSec, start, stop } = useRestTimer();
  const [now, setNow] = useState(() => Date.now());
  const firedRef = useRef(false);

  // Display tick only — the source of truth is the endsAt timestamp, so a
  // throttled background tab resyncs the instant it returns to the foreground.
  useEffect(() => {
    if (endsAt === null) return;
    const id = setInterval(() => setNow(Date.now()), 250);
    return () => clearInterval(id);
  }, [endsAt]);

  const remaining = remainingSeconds(endsAt, now);
  const running = endsAt !== null && remaining > 0;

  // Reset the one-shot fire guard whenever a new countdown starts.
  useEffect(() => {
    if (running) firedRef.current = false;
  }, [running, endsAt]);

  // Fire chime + vibration exactly once when a running timer hits zero.
  useEffect(() => {
    if (endsAt !== null && remaining === 0 && !firedRef.current) {
      firedRef.current = true;
      playChime();
      navigator.vibrate?.([200, 80, 200]);
      stop();
    }
  }, [endsAt, remaining, stop]);

  const fraction = durationSec && running ? remaining / durationSec : 0;

  return (
    <div className="flex flex-col gap-3 rounded-card border bg-surface-2 p-4">
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium uppercase tracking-wide text-muted">Rest timer</span>
        {running ? (
          <button
            type="button"
            onClick={stop}
            className="text-xs text-muted underline-offset-2 hover:text-text hover:underline"
          >
            Skip
          </button>
        ) : null}
      </div>

      {running ? (
        <div className="flex items-center gap-3">
          <span className="metric text-3xl font-bold tabular-nums">{fmt(remaining)}</span>
          <div className="h-2 flex-1 overflow-hidden rounded-full bg-white/10">
            <div
              className="h-full rounded-full bg-ember transition-[width] duration-300 ease-linear"
              style={{ width: `${Math.round(fraction * 100)}%` }}
            />
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-4 gap-2">
          {PRESETS.map((sec) => (
            <button
              key={sec}
              type="button"
              onClick={() => start(sec)}
              className="rounded-control border bg-surface py-2 text-sm font-medium transition-colors duration-150 hover:bg-white/10"
            >
              {sec}s
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
