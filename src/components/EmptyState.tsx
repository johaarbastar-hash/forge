import type { ReactNode } from 'react';

import { Button } from './Button';

type EmptyStateProps = {
  icon: ReactNode;
  title: string;
  body: string;
  actionLabel?: string;
  onAction?: () => void;
};

export function EmptyState({ icon, title, body, actionLabel, onAction }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center gap-3 rounded-card border border-dashed border-white/10 bg-surface px-6 py-10 text-center">
      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-surface-2 text-muted">
        {icon}
      </div>
      <div>
        <h3 className="font-display text-base font-semibold">{title}</h3>
        <p className="mt-1 max-w-[26ch] text-sm text-muted">{body}</p>
      </div>
      {actionLabel && onAction ? (
        <Button variant="secondary" size="sm" onClick={onAction}>
          {actionLabel}
        </Button>
      ) : null}
    </div>
  );
}
