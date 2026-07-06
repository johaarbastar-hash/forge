import { Suspense } from 'react';
import { Outlet } from 'react-router-dom';

import { CelebrationOverlay } from '../components/CelebrationOverlay';
import { QuickAdd } from './QuickAdd';
import { TabBar } from './TabBar';
import { useGamification } from './useGamification';
import { useReminders } from './useReminders';

function RouteLoading() {
  return (
    <div className="flex h-40 items-center justify-center" role="status" aria-label="Loading">
      <div className="h-6 w-6 animate-spin rounded-full border-2 border-white/10 border-t-accent" />
    </div>
  );
}

export function AppShell() {
  useGamification();
  useReminders();
  return (
    <div className="relative mx-auto flex h-dvh w-full max-w-lg flex-col overflow-hidden">
      <main className="flex-1 overflow-y-auto px-4 pb-24 pt-6">
        <Suspense fallback={<RouteLoading />}>
          <Outlet />
        </Suspense>
      </main>
      <TabBar />
      <QuickAdd />
      <CelebrationOverlay />
    </div>
  );
}
