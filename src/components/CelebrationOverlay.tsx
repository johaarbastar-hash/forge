import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { useEffect } from 'react';

import { achievementDefs } from '../data/achievements';
import { useCelebrations } from '../stores/celebrations';
import { IconFlame, IconTrophy } from './icons';

const AUTO_DISMISS_MS = 4200;

function EmberBurst({ reduced }: { reduced: boolean }) {
  if (reduced) return null;
  return (
    <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
      {Array.from({ length: 12 }).map((_, i) => {
        const angle = (i / 12) * Math.PI * 2;
        return (
          <motion.span
            key={i}
            className="absolute h-2 w-2 rounded-full bg-ember"
            initial={{ x: 0, y: 0, opacity: 1, scale: 1 }}
            animate={{
              x: Math.cos(angle) * 160,
              y: Math.sin(angle) * 160,
              opacity: 0,
              scale: 0.3,
            }}
            transition={{ duration: 1.1, ease: 'easeOut' }}
          />
        );
      })}
    </div>
  );
}

export function CelebrationOverlay() {
  const current = useCelebrations((s) => s.queue[0]);
  const dismiss = useCelebrations((s) => s.dismiss);
  const reduced = useReducedMotion() ?? false;

  useEffect(() => {
    if (!current) return;
    const id = setTimeout(dismiss, AUTO_DISMISS_MS);
    return () => clearTimeout(id);
  }, [current, dismiss]);

  const achievement =
    current?.kind === 'achievement' ? achievementDefs.find((a) => a.id === current.id) : undefined;

  return (
    <AnimatePresence>
      {current ? (
        <motion.button
          type="button"
          onClick={dismiss}
          aria-label="Dismiss"
          className="fixed inset-0 z-[60] flex flex-col items-center justify-center bg-black/90 px-8"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: reduced ? 0.1 : 0.2 }}
        >
          {current.kind === 'level' ? (
            <div className="relative flex flex-col items-center gap-4">
              <EmberBurst reduced={reduced} />
              <motion.div
                className="flex h-28 w-28 items-center justify-center rounded-full bg-ember text-text shadow-2xl shadow-accent/40"
                initial={reduced ? { opacity: 0 } : { scale: 0.3, rotate: -20 }}
                animate={reduced ? { opacity: 1 } : { scale: 1, rotate: 0 }}
                transition={reduced ? { duration: 0.15 } : { type: 'spring', stiffness: 260, damping: 16 }}
              >
                <IconFlame size={52} />
              </motion.div>
              <div className="text-center">
                <p className="font-display text-sm uppercase tracking-widest text-muted">Level up</p>
                <p className="metric font-display text-5xl font-bold">Level {current.level}</p>
              </div>
            </div>
          ) : (
            <motion.div
              className="flex w-full max-w-xs flex-col items-center gap-3 rounded-card border bg-surface p-6 text-center shadow-2xl shadow-ember/20"
              initial={reduced ? { opacity: 0 } : { rotateY: 90, opacity: 0 }}
              animate={reduced ? { opacity: 1 } : { rotateY: 0, opacity: 1 }}
              transition={reduced ? { duration: 0.15 } : { type: 'spring', stiffness: 200, damping: 18 }}
            >
              <span className="flex h-16 w-16 items-center justify-center rounded-full bg-ember text-text">
                <IconTrophy size={30} />
              </span>
              <div>
                <p className="font-display text-xs uppercase tracking-widest text-ember">Achievement</p>
                <p className="mt-1 font-display text-lg font-bold">{achievement?.title}</p>
                <p className="mt-1 text-sm text-muted">{achievement?.description}</p>
              </div>
            </motion.div>
          )}
          <p className="mt-8 text-xs text-muted">Tap to dismiss</p>
        </motion.button>
      ) : null}
    </AnimatePresence>
  );
}
