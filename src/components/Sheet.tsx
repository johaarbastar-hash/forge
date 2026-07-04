import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { useEffect } from 'react';
import type { ReactNode } from 'react';

import { IconClose } from './icons';

type SheetProps = {
  open: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
};

/** Bottom sheet with glass treatment. Doubles as the app's modal primitive. */
export function Sheet({ open, onClose, title, children }: SheetProps) {
  const reducedMotion = useReducedMotion();

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  return (
    <AnimatePresence>
      {open ? (
        <div className="fixed inset-0 z-40 flex items-end justify-center">
          <motion.button
            type="button"
            aria-label="Close"
            className="absolute inset-0 bg-black/60"
            onClick={onClose}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: reducedMotion ? 0 : 0.15, ease: 'easeOut' }}
          />
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-label={title}
            className="glass relative w-full max-w-lg rounded-t-card border-t px-4 pb-6 pt-3 pb-safe"
            initial={reducedMotion ? { opacity: 0 } : { y: '100%' }}
            animate={reducedMotion ? { opacity: 1 } : { y: 0 }}
            exit={reducedMotion ? { opacity: 0 } : { y: '100%' }}
            transition={
              reducedMotion
                ? { duration: 0.1 }
                : { type: 'spring', stiffness: 380, damping: 34 }
            }
          >
            <div className="mx-auto mb-3 h-1 w-10 rounded-full bg-white/20" />
            <div className="mb-4 flex items-center justify-between">
              <h2 className="font-display text-lg font-semibold">{title}</h2>
              <button
                type="button"
                aria-label="Close sheet"
                onClick={onClose}
                className="flex h-9 w-9 items-center justify-center rounded-control text-muted transition-colors hover:bg-white/5 hover:text-text"
              >
                <IconClose size={20} />
              </button>
            </div>
            {children}
          </motion.div>
        </div>
      ) : null}
    </AnimatePresence>
  );
}
