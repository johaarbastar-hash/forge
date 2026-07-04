# CLAUDE.md — Forge

Offline-first fitness PWA for a teenage gym-goer (weight gain, muscle, consistency). Single user, metric, local-only data.

**Read order every session:** this file → `PLAN.md` (find the next unchecked phase) → the relevant sections of `SPEC.md`. SPEC is the source of truth for product decisions — do not re-decide things it already pins down (food macros, XP values, formulas, coach rules, palette).

## Commands

```bash
npm run dev          # vite dev server
npm run build        # production build (must pass before a phase is done)
npm run preview      # serve the build (PWA/offline checks happen here, not in dev)
npm run typecheck    # tsc --noEmit
npm run test         # vitest run
npm run lint         # eslint
```

## Workflow rules

1. Work on **exactly one phase** from `PLAN.md` at a time, in order. Do not start the next phase in the same run.
2. A phase is done only when its checkpoint commands pass **and** its acceptance criteria are verified. Then tick its checkboxes in `PLAN.md` and commit: `feat(phase-N): <summary>`.
3. If the spec is silent on something, pick the simplest option consistent with SPEC and add one line to the "Decisions" log at the bottom of `PLAN.md`. Never invent nutrition values, XP amounts, or formulas — those are pinned in SPEC.
4. Approved dependencies: react, react-dom, react-router-dom, zustand, dexie, dexie-react-hooks, framer-motion, recharts, react-hook-form, date-fns, zod, vite-plugin-pwa, tailwindcss, vitest, @testing-library/react, jsdom, eslint, prettier. Anything else → add to the Decisions log with a one-line justification.

## Architecture rules

- **Folders:** `src/app` (router, providers, shell) · `src/components` (shared primitives) · `src/features/<name>` (screens + feature components) · `src/db` (dexie schema, migrations, repositories) · `src/stores` (zustand) · `src/hooks` · `src/lib` (pure domain functions) · `src/types` · `src/data` (seed data) · `src/styles`.
- **Repositories only:** `src/db/repositories/*` is the sole importer of Dexie. Features call repositories; components never touch the DB directly. This is the Supabase migration seam — keep it clean.
- **Pure lib:** All domain math (dates, streaks, BMI, macro aggregation, XP/levels, e1RM, analytics scores, coach rules) lives in `src/lib` as pure functions with unit tests. No React, no DB imports in `lib`.
- **Derived state is computed, never stored.** No stored streak counters, no stored averages. Exceptions: the append-only `xpEvents` ledger and `achievementUnlocks` (SPEC §3, §5.11).
- **Dates:** day-bucket with local `YYYY-MM-DD` via `toDayKey()` in `src/lib/dates.ts`. Never `toISOString()` for day keys. Week starts Monday. All timer logic (rest timer) uses timestamps, not `setInterval` counting.
- **XP awards are idempotent:** unique (dayKey, type) index; award functions must be safe to call repeatedly.
- **Live UI:** use `dexie-react-hooks` `useLiveQuery` so dashboard/cards update instantly after any write.
- **Photos:** compress to max edge 1280 px JPEG q0.8 before storing as Blob.
- **Performance:** lazy-load all routes; keep Recharts out of the entry chunk; memoize chart data transforms.

## Code style

- TypeScript strict. No `any`, no `@ts-ignore`, no non-null `!` without a comment justifying it.
- Named exports. Components `PascalCase.tsx`, hooks `useX.ts`, lib/util files `camelCase.ts`.
- Forms via React Hook Form + zod resolvers. No raw uncontrolled forms.
- No TODO comments, no stubbed functions, no placeholder screens — if it's in a phase, it works.

## Design tokens (implement in Tailwind config; full system in SPEC §6)

- Colors: bg `#09090B`, surface `#131316`, surface-2 `#1C1C21`, border `white/8%`, text `#FAFAFA`, muted `#A1A1AA`, accent `#EF4444`, accent-deep `#B91C1C`, ember gradient `#F97316→#EF4444` (rings/streaks/level-up only), success `#22C55E`, warning `#F59E0B`.
- Type: Space Grotesk (display + metric numbers, `tabular-nums`), Inter (body/UI).
- Radius: cards 16 px, controls 12 px, FAB round. Glass (blur + white/5) only on tab bar, FAB, and sheets.
- Motion: 150–250 ms ease-out; springs for FAB/level-up/achievements; respect `prefers-reduced-motion` everywhere.

## Do NOT

- Do not use localStorage for domain data.
- Do not bucket days in UTC.
- Do not store derived values (streaks, averages, level).
- Do not invent food macros, XP values, formulas, or coach rules — SPEC pins them.
- Do not hand-roll a service worker — use vite-plugin-pwa `autoUpdate`.
- Do not build a push notification server; reminders are in-app + Notification API only (SPEC §5.15).
- Do not skip a phase checkpoint or batch multiple phases into one run.
