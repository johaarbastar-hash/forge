import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { createContext, useCallback, useContext, useMemo, useRef, useState } from 'react';
import type { ReactNode } from 'react';

import { IconCheck, IconClose } from './icons';

export type ToastKind = 'success' | 'error' | 'info';

type ToastItem = { id: number; kind: ToastKind; message: string };

type ToastContextValue = {
  showToast: (message: string, kind?: ToastKind) => void;
};

const ToastContext = createContext<ToastContextValue | null>(null);

export function useToast(): ToastContextValue {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used within <ToastProvider>');
  return ctx;
}

const AUTO_DISMISS_MS = 3200;

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const nextId = useRef(1);
  const reducedMotion = useReducedMotion();

  const dismiss = useCallback((id: number) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const showToast = useCallback(
    (message: string, kind: ToastKind = 'info') => {
      const id = nextId.current++;
      setToasts((prev) => [...prev.slice(-2), { id, kind, message }]);
      setTimeout(() => dismiss(id), AUTO_DISMISS_MS);
    },
    [dismiss],
  );

  const value = useMemo(() => ({ showToast }), [showToast]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div
        aria-live="polite"
        className="pointer-events-none fixed inset-x-0 top-3 z-50 flex flex-col items-center gap-2 px-4"
      >
        <AnimatePresence>
          {toasts.map((toast) => (
            <motion.div
              key={toast.id}
              initial={reducedMotion ? { opacity: 0 } : { opacity: 0, y: -12, scale: 0.97 }}
              animate={reducedMotion ? { opacity: 1 } : { opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: reducedMotion ? 0.1 : 0.2, ease: 'easeOut' }}
              className="pointer-events-auto flex w-full max-w-sm items-center gap-2 rounded-control border bg-surface-2 px-3 py-2.5 shadow-lg shadow-black/40"
            >
              <span
                className={
                  toast.kind === 'success'
                    ? 'text-success'
                    : toast.kind === 'error'
                      ? 'text-accent'
                      : 'text-muted'
                }
              >
                {toast.kind === 'success' ? <IconCheck size={18} /> : <IconClose size={18} />}
              </span>
              <p className="flex-1 text-sm">{toast.message}</p>
              <button
                type="button"
                aria-label="Dismiss notification"
                onClick={() => dismiss(toast.id)}
                className="text-muted transition-colors hover:text-text"
              >
                <IconClose size={16} />
              </button>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  );
}
