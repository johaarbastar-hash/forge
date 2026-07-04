import { Component } from 'react';
import type { ErrorInfo, ReactNode } from 'react';

import { Button } from '../components/Button';
import { IconFlame } from '../components/icons';

export function ErrorFallback({ onRetry }: { onRetry?: () => void }) {
  return (
    <div className="flex min-h-dvh flex-col items-center justify-center gap-4 bg-bg px-6 text-center text-text">
      <div className="flex h-14 w-14 items-center justify-center rounded-full bg-surface-2 text-accent">
        <IconFlame size={28} />
      </div>
      <div>
        <h1 className="font-display text-xl font-bold">Something broke</h1>
        <p className="mt-1 max-w-[32ch] text-sm text-muted">
          Forge hit an unexpected error. Your data is safe on this device — reload to keep going.
        </p>
      </div>
      <Button onClick={onRetry ?? (() => window.location.assign('/'))}>Reload Forge</Button>
    </div>
  );
}

type ErrorBoundaryProps = { children: ReactNode };
type ErrorBoundaryState = { hasError: boolean };

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  state: ErrorBoundaryState = { hasError: false };

  static getDerivedStateFromError(): ErrorBoundaryState {
    return { hasError: true };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('Root error boundary caught:', error, info.componentStack);
  }

  render() {
    if (this.state.hasError) {
      return <ErrorFallback onRetry={() => window.location.reload()} />;
    }
    return this.props.children;
  }
}
