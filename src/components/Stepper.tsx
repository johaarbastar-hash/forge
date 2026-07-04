import { IconPlus } from './icons';

type StepperProps = {
  value: number;
  onChange: (next: number) => void;
  step?: number;
  min?: number;
  max?: number;
  unit?: string;
  label?: string;
  format?: (value: number) => string;
};

function IconMinus() {
  return (
    <svg width={20} height={20} viewBox="0 0 24 24" fill="none" aria-hidden>
      <path d="M5 12h14" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" />
    </svg>
  );
}

export function Stepper({
  value,
  onChange,
  step = 1,
  min = 0,
  max = Number.MAX_SAFE_INTEGER,
  unit,
  label,
  format,
}: StepperProps) {
  // Round to 2 decimals so 2.5-kg style steps never accumulate float noise.
  const clamp = (n: number) => Math.min(max, Math.max(min, Math.round(n * 100) / 100));
  const display = format ? format(value) : String(value);
  return (
    <div className="flex w-full items-center justify-between gap-3">
      {label ? <span className="text-sm font-medium text-muted">{label}</span> : null}
      <div className="flex items-center gap-2">
        <button
          type="button"
          aria-label={label ? `Decrease ${label}` : 'Decrease'}
          disabled={value <= min}
          onClick={() => onChange(clamp(value - step))}
          className="flex h-11 w-11 items-center justify-center rounded-control border bg-surface-2 text-text transition-colors duration-150 hover:bg-white/10 disabled:pointer-events-none disabled:opacity-40"
        >
          <IconMinus />
        </button>
        <div className="min-w-[4.5rem] text-center">
          <span className="metric text-xl font-semibold">{display}</span>
          {unit ? <span className="ml-1 text-sm text-muted">{unit}</span> : null}
        </div>
        <button
          type="button"
          aria-label={label ? `Increase ${label}` : 'Increase'}
          disabled={value >= max}
          onClick={() => onChange(clamp(value + step))}
          className="flex h-11 w-11 items-center justify-center rounded-control border bg-surface-2 text-text transition-colors duration-150 hover:bg-white/10 disabled:pointer-events-none disabled:opacity-40"
        >
          <IconPlus size={20} />
        </button>
      </div>
    </div>
  );
}
