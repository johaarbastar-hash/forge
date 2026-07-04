import { useNavigate } from 'react-router-dom';
import type { ReactNode } from 'react';

import { IconChevronLeft } from './icons';

type ScreenHeaderProps = {
  title: string;
  subtitle?: string;
  back?: boolean;
  trailing?: ReactNode;
};

export function ScreenHeader({ title, subtitle, back = false, trailing }: ScreenHeaderProps) {
  const navigate = useNavigate();
  return (
    <header className="mb-5 flex items-start justify-between gap-3">
      <div className="flex items-start gap-2">
        {back ? (
          <button
            type="button"
            aria-label="Back"
            onClick={() => navigate(-1)}
            className="-ml-2 mt-0.5 flex h-9 w-9 items-center justify-center rounded-control text-muted transition-colors hover:bg-white/5 hover:text-text"
          >
            <IconChevronLeft size={22} />
          </button>
        ) : null}
        <div>
          <h1 className="font-display text-2xl font-bold tracking-tight">{title}</h1>
          {subtitle ? <p className="mt-0.5 text-sm text-muted">{subtitle}</p> : null}
        </div>
      </div>
      {trailing}
    </header>
  );
}
