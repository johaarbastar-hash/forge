import { motion } from 'framer-motion';
import { useId } from 'react';
import type { ReactNode } from 'react';

import { useAppReducedMotion } from '../stores/motionPref';

type ProgressRingProps = {
  /** Progress 0–1; values beyond 1 render as a full ring. */
  value: number;
  size?: number;
  strokeWidth?: number;
  children?: ReactNode;
  'aria-label'?: string;
};

/**
 * The Forge Ring — ember-gradient progress ring with an animated sweep on
 * mount/value change. Under prefers-reduced-motion the sweep is disabled and
 * the ring renders directly at its value.
 */
export function ProgressRing({
  value,
  size = 168,
  strokeWidth = 12,
  children,
  'aria-label': ariaLabel,
}: ProgressRingProps) {
  const reducedMotion = useAppReducedMotion();
  const gradientId = useId();
  const clamped = Math.max(0, Math.min(1, value));
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const dashOffset = circumference * (1 - clamped);

  return (
    <div
      role="progressbar"
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={Math.round(clamped * 100)}
      aria-label={ariaLabel ?? 'Progress'}
      className="relative inline-flex items-center justify-center"
      style={{ width: size, height: size }}
    >
      <svg width={size} height={size} className="-rotate-90">
        <defs>
          <linearGradient id={gradientId} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#F97316" />
            <stop offset="100%" stopColor="#EF4444" />
          </linearGradient>
        </defs>
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="rgba(255,255,255,0.08)"
          strokeWidth={strokeWidth}
        />
        <motion.circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={`url(#${gradientId})`}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          initial={reducedMotion ? false : { strokeDashoffset: circumference }}
          animate={{ strokeDashoffset: dashOffset }}
          transition={reducedMotion ? { duration: 0 } : { duration: 0.9, ease: 'easeOut' }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">{children}</div>
    </div>
  );
}
