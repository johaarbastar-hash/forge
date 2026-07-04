import { Suspense } from 'react';
import { Outlet } from 'react-router-dom';

import { QuickAdd } from './QuickAdd';
import { TabBar } from './TabBar';

function RouteLoading() {
  return (
    <div className="flex h-40 items-center justify-center" role="status" aria-label="Loading">
      <div className="h-6 w-6 animate-spin rounded-full border-2 border-white/10 border-t-accent" />
    </div>
  );
}

export function AppShell() {
  return (
    <div className="mx-auto min-h-dvh w-full max-w-lg">
      <main className="px-4 pb-36 pt-6">
        <Suspense fallback={<RouteLoading />}>
          <Outlet />
        </Suspense>
      </main>
      <QuickAdd />
      <TabBar />
    </div>
  );
}
