import { RouterProvider, createHashRouter } from 'react-router-dom';

import { ToastProvider } from '../components/Toast';
import { AppShell } from './AppShell';
import { ErrorBoundary, ErrorFallback } from './ErrorBoundary';
import { RedirectIfOnboarded, RequireOnboarded } from './guards';

// Hash routing keeps the app working under any host sub-path (e.g. GitHub
// Pages' /forge/) with no server-side SPA fallback needed.
const router = createHashRouter([
  {
    path: '/onboarding',
    element: <RedirectIfOnboarded />,
    errorElement: <ErrorFallback />,
    children: [
      {
        index: true,
        lazy: async () => ({
          Component: (await import('../features/onboarding/OnboardingScreen')).OnboardingScreen,
        }),
      },
    ],
  },
  {
    path: '/',
    element: <RequireOnboarded />,
    errorElement: <ErrorFallback />,
    children: [
      {
        element: <AppShell />,
        children: [
          {
            index: true,
            lazy: async () => ({
              Component: (await import('../features/home/HomeScreen')).HomeScreen,
            }),
          },
          {
            path: 'nutrition',
            lazy: async () => ({
              Component: (await import('../features/nutrition/NutritionScreen')).NutritionScreen,
            }),
          },
          {
            path: 'nutrition/foods',
            lazy: async () => ({
              Component: (await import('../features/nutrition/FoodDatabaseScreen'))
                .FoodDatabaseScreen,
            }),
          },
          {
            path: 'water',
            lazy: async () => ({
              Component: (await import('../features/water/WaterScreen')).WaterScreen,
            }),
          },
          {
            path: 'sleep',
            lazy: async () => ({
              Component: (await import('../features/sleep/SleepScreen')).SleepScreen,
            }),
          },
          {
            path: 'workout',
            lazy: async () => ({
              Component: (await import('../features/workout/WorkoutScreen')).WorkoutScreen,
            }),
          },
          {
            path: 'workout/history/:exerciseId',
            lazy: async () => ({
              Component: (await import('../features/workout/ExerciseHistoryScreen'))
                .ExerciseHistoryScreen,
            }),
          },
          {
            path: 'progress',
            lazy: async () => ({
              Component: (await import('../features/progress/ProgressScreen')).ProgressScreen,
            }),
          },
          {
            path: 'more',
            lazy: async () => ({
              Component: (await import('../features/more/MoreScreen')).MoreScreen,
            }),
          },
          {
            path: 'more/calendar',
            lazy: async () => ({
              Component: (await import('../features/calendar/CalendarScreen')).CalendarScreen,
            }),
          },
          {
            path: 'more/habits',
            lazy: async () => ({
              Component: (await import('../features/habits/HabitsScreen')).HabitsScreen,
            }),
          },
          {
            path: 'more/goals',
            lazy: async () => ({
              Component: (await import('../features/goals/GoalsScreen')).GoalsScreen,
            }),
          },
          {
            path: 'more/analytics',
            lazy: async () => ({
              Component: (await import('../features/analytics/AnalyticsScreen')).AnalyticsScreen,
            }),
          },
          {
            path: 'more/achievements',
            lazy: async () => ({
              Component: (await import('../features/achievements/AchievementsScreen'))
                .AchievementsScreen,
            }),
          },
          {
            path: 'more/coach',
            lazy: async () => ({
              Component: (await import('../features/coach/CoachScreen')).CoachScreen,
            }),
          },
          {
            path: 'more/search',
            lazy: async () => ({
              Component: (await import('../features/search/SearchScreen')).SearchScreen,
            }),
          },
          {
            path: 'more/export',
            lazy: async () => ({
              Component: (await import('../features/export/ExportScreen')).ExportScreen,
            }),
          },
          {
            path: 'more/profile',
            lazy: async () => ({
              Component: (await import('../features/profile/ProfileScreen')).ProfileScreen,
            }),
          },
          {
            path: 'more/settings',
            lazy: async () => ({
              Component: (await import('../features/settings/SettingsScreen')).SettingsScreen,
            }),
          },
        ],
      },
    ],
  },
]);

export function App() {
  return (
    <ErrorBoundary>
      <ToastProvider>
        <RouterProvider router={router} />
      </ToastProvider>
    </ErrorBoundary>
  );
}
