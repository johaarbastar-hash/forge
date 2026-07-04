import { useLiveQuery } from 'dexie-react-hooks';
import { Suspense } from 'react';
import { Navigate, Outlet } from 'react-router-dom';

import { IconFlame } from '../components/icons';
import { getProfile } from '../db/repositories/profileRepo';

type OnboardState = 'loading' | 'onboarded' | 'fresh';

function useOnboardState(): OnboardState {
  // undefined = query still running; null = no profile row yet
  const profile = useLiveQuery(async () => (await getProfile()) ?? null, []);
  if (profile === undefined) return 'loading';
  return profile !== null && profile.onboarded ? 'onboarded' : 'fresh';
}

export function Splash() {
  return (
    <div className="flex min-h-dvh items-center justify-center bg-bg" role="status" aria-label="Loading Forge">
      <span className="flex h-14 w-14 animate-pulse items-center justify-center rounded-full bg-ember text-text">
        <IconFlame size={28} />
      </span>
    </div>
  );
}

/** Wraps the app shell: fresh installs are sent to the onboarding wizard. */
export function RequireOnboarded() {
  const state = useOnboardState();
  if (state === 'loading') return <Splash />;
  if (state === 'fresh') return <Navigate to="/onboarding" replace />;
  return <Outlet />;
}

/** Wraps the wizard: already-onboarded users land on the dashboard instead. */
export function RedirectIfOnboarded() {
  const state = useOnboardState();
  if (state === 'loading') return <Splash />;
  if (state === 'onboarded') return <Navigate to="/" replace />;
  return (
    <Suspense fallback={<Splash />}>
      <Outlet />
    </Suspense>
  );
}
