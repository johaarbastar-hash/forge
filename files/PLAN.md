# PLAN.md — Forge build roadmap

**How to use this file (Claude Code):** find the first phase with unchecked boxes, complete it fully, run the checkpoint, verify acceptance criteria, tick the boxes, commit `feat(phase-N): <summary>`, then stop. One phase per run. Log any judgment calls in the Decisions section at the bottom.

Checkpoint baseline for every phase: `npm run typecheck && npm run test && npm run build` all pass.

---

## Phase 0 — Scaffold, design system, app shell

- [x] Vite + React 18 + TS strict; ESLint + Prettier; Vitest + jsdom configured
- [x] Tailwind with SPEC §6 tokens (colors, radius, fonts via Fontsource: Space Grotesk + Inter)
- [x] vite-plugin-pwa: manifest (Forge, theme/background `#09090B`), generated maskable icons (simple "F" ember mark), autoUpdate
- [x] React Router with lazy routes for all screens (placeholder-free: each route renders its real layout header + empty state component)
- [x] App shell: bottom tab bar (Home, Nutrition, Workout, Progress, More), glass treatment, active states; FAB rendering a quick-add sheet shell; root error boundary
- [x] Shared primitives: Card, Button, Input, Stepper, Modal/Sheet, ProgressRing (ember gradient), StatCard, EmptyState, Toast

**Checkpoint:** baseline + `npm run preview` → installable (manifest + SW detected), shell navigable at 390 px without layout breaks.
**Accept:** tab bar + FAB feel right on mobile width; ring renders with animated sweep; reduced-motion disables sweep.

## Phase 1 — Data core (DB, seed, domain math + tests)

- [x] `src/types` domain types per SPEC §3
- [x] Dexie schema v1, `migrations.ts` upgrade scaffold, `exportAll()/importAll()`
- [x] Repositories for every table; components/features never import Dexie
- [x] Seed loader (runs once): foods (SPEC §4.1 exactly), exercises (§4.2), split templates (§4.3), habits, quotes (30), achievements, mission/challenge definitions
- [x] `src/lib`: dates (`toDayKey`, week ranges Mon-start), BMI, macro aggregation (grams → macros incl. piece-based foods), streaks, XP ledger + `threshold(n)` level curve, e1RM (Epley), analytics scores (§5.10), goalHistory resolver (§5.9)
- [x] Vitest: streak edges (gap, month boundary, today unlogged), macro math (piece + per-100 + per-100ml), XP idempotency, level thresholds, score formulas, goalHistory day resolution

**Checkpoint:** baseline; all lib tests green.
**Accept:** fresh DB seeds exactly once; `exportAll()` returns full JSON.

## Phase 2 — Onboarding, Profile, Goals

- [x] 5-step wizard (SPEC §5.1) with RHF + zod validation, progress indicator, back/next
- [x] Goal suggestions (formulas per §5.1) shown editable with "suggestion, not medical advice" label
- [x] Profile screen (view/edit all fields, BMI "reference only"); Goals screen with visual progress per goal; edits append to goalHistory
- [x] Route guard: not onboarded → wizard

**Checkpoint:** baseline.
**Accept:** fresh install → wizard → dashboard skeleton shows name, BMI, goals; reload persists; goal edit affects today forward only (verified via a test on goalHistory).

## Phase 3 — Nutrition + Food database

- [x] Food DB screen: search, favorites filter, custom-food CRUD (per-100 g / per-100 ml / per-piece), edit seed foods
- [x] Meal logging flow (§5.3): category → search/recents/favorites → serving/gram stepper → running totals → save
- [x] Meal CRUD: edit, delete, duplicate (today/another day); favorite meal combos; recents (last 15 distinct foods)
- [x] Dashboard: Forge Ring (calories) + protein/carbs/fat/fiber bars live via useLiveQuery; PROTEIN_GOAL_HIT XP wired

**Checkpoint:** baseline.
**Accept:** logging a recent meal ≤ 3 taps; displayed macros match `lib` aggregator (spot-check vs a unit test case); deleting a meal updates ring instantly.

## Phase 4 — Water, Sleep, Weight, Quick Add, Dashboard v1

- [x] Water screen: +250/+500/+750/+1000, undo last, animated bottle fill, weekly/monthly averages; WATER_GOAL_HIT XP
- [x] Sleep log (hours + optional bedtime); SLEEP_GOAL_HIT XP. Weight log; WEIGHT_LOGGED XP
- [x] FAB quick-add sheet fully wired: Meal / Water / Weight / Workout(→ today's session)
- [x] Dashboard v1 complete per §5.2 order (streak row, weight card with trend arrow, XP level card, weekly mini-summary; Coach card placeholder-free — hidden until Phase 8)

**Checkpoint:** baseline.
**Accept:** every quick-add writes correctly and dashboard reflects it without reload; streak row matches lib streak tests.

## Phase 5 — Workouts

- [x] Split day view (scheduled day, default exercises, rest-day card)
- [x] Session logger: set rows (reps/weight steppers, 2.5 kg increments), copy-last-set, prefill from last session, add/swap/remove exercise, notes
- [x] Rest timer: 60/90/120/180 presets, timestamp-based (survives tab switch), chime + vibration where supported
- [x] Finish flow: auto duration, WORKOUT_COMPLETED XP, summary card
- [x] Exercise history + PRs: best weight, best e1RM, PR badge on new records; PR history list

**Checkpoint:** baseline.
**Accept:** full PPL push session loggable start→finish; PR badge fires on a new e1RM; switching tabs for 2 min doesn't desync the rest timer.

## Phase 6 — Progress, Calendar, Habits

- [x] Charts (7/30/90): weight raw + 7-day rolling avg, kcal vs goal, protein vs goal, water vs goal, workouts/week — Recharts in a lazy chunk
- [x] Measurements CRUD + per-field sparkline; progress photos (capture/upload → compress 1280 px JPEG q0.8 → Blob), timeline grid + two-photo compare
- [x] Calendar month grid with day dots; day detail sheet (meals, workout, water, weight, sleep, note, mood 1–5), past days editable
- [x] Habits screen: seeded + custom, daily check grid, current/best streaks (derived)

**Checkpoint:** baseline.
**Accept:** with demo data loaded (temporary dev hook is fine until Phase 8 button), all five charts render sane; a photo persists offline; editing a past day updates calendar dots.

## Phase 7 — Gamification

- [x] All XP events wired per SPEC §5.11 table incl. STREAK_DAY and ALL_MISSIONS_DONE; awards idempotent (unique dayKey+type)
- [x] Level system + full-screen level-up animation (ember burst; reduced-motion → simple fade)
- [x] Achievements grid (12 from §5.11), evaluation on relevant writes, unlock animation fires exactly once, unlocks persisted
- [x] Daily missions generated from goals (rest-day aware); weekly challenges (Mon–Sun) with progress bars

**Checkpoint:** baseline; idempotency test: completing the same goal twice in a day awards once.
**Accept:** demo-data day triggers correct missions/XP; achievement unlock replays never re-fire; level math matches `threshold(n)` tests.

## Phase 8 — Analytics, Coach, Search, Export, Reminders, PWA polish

- [ ] Weekly + monthly report screens (§5.10 metrics + all five scores, deltas vs previous period)
- [ ] Coach: 12 rules from §5.12 as pure tested functions; Coach page (all insights + metric context); dashboard top-3 card enabled
- [ ] Unified search (foods, favorite meals, exercises, dates incl. "12 Jul" parsing → calendar day)
- [ ] Export: CSVs per data type, JSON full dump, printable monthly report (print CSS)
- [ ] Reminders settings (§5.15): per-type toggles/times, in-app banners, Notification API path, honest copy about background limits
- [ ] PWA polish: icons/splash verified on device, offline pass (airplane-mode walkthrough of all tabs), install prompt in Settings
- [ ] Settings → Developer: Load demo data (30 days per §5.17), Wipe all data (double confirm)
- [ ] Final sweep: Definition of Done list in SPEC §7, item by item

**Checkpoint:** baseline + Lighthouse installable + offline walkthrough clean.
**Accept:** every §7 item verified and noted below.

---

## Decisions log

_Append one line per judgment call: date — decision — reason._

- 2026-07-04 — Tailwind v3.4 (classic `tailwind.config.js`) — CLAUDE.md says "implement tokens in Tailwind config"; v3 keeps the well-known JS config format.
- 2026-07-04 — Tooling-only devDependencies added: @vitejs/plugin-react, @eslint/js, globals, typescript-eslint, eslint-plugin-react-hooks, eslint-plugin-react-refresh, postcss, autoprefixer, @types/\*, @fontsource/inter, @fontsource/space-grotesk — build/lint/font plumbing for approved stack; no runtime domain deps.
- 2026-07-04 — PWA icons generated by `scripts/generate-icons.mjs` (dependency-free PNG writer on node:zlib); PNGs committed under `public/icons/` — avoids adding an image library for a one-off asset.
- 2026-07-04 — Phase 0 quick-add sheet actions navigate to each action's host screen (Meal→Nutrition, Water→Home, Weight→Progress, Workout→Workout) — real forms arrive with Phases 3–4; keeps "no dead buttons".
- 2026-07-04 — "More" sub-screens routed under `/more/*` — keeps the More tab active state correct on sub-screens.
- 2026-07-04 — App project rooted at `D:\Gym` with spec docs kept in `files/` — docs were delivered there; repo covers both.
- 2026-07-04 — `goalHistory` added as a Dexie table — SPEC §5.9 mandates the append log even though §3's table list doesn't name it.
- 2026-07-04 — Definitions without §3 tables (split templates, quotes, achievements, mission/challenge defs) ship as static `src/data` modules; DB seeding (foods/exercises/habits/settings) runs in Dexie's `populate` event, which fires exactly once per database creation.
- 2026-07-04 — String primary keys: seed rows use stable slugs (`food-rice`, `ex-bench-press`) so split templates and export dumps reference them safely; user rows use `crypto.randomUUID()`.
- 2026-07-04 — For piece-unit foods, `per100` holds the SPEC §4.1 per-piece base values verbatim (with `pieceGrams`); macro lib scales by pieces — avoids normalizing to invented per-100 numbers.
- 2026-07-04 — devDependency `fake-indexeddb` added — needed to unit-test Dexie seeding/idempotency; test-only.
- 2026-07-04 — Exercise `equipment` labels (barbell/dumbbell/cable/machine/bodyweight) chosen; SPEC defines the field but not the values.
- 2026-07-04 — PPL/UL/FB day defaults picked from §4.2 pools (group exercises + 1 core; second weekly visit varies movements); editable later per §4.3.
- 2026-07-04 — `weightGainRatePerWeek` regresses only full 7-day rolling windows (partial ramp-in windows would flatten the slope); callers pass leading context days.
- 2026-07-04 — Dependency `@hookform/resolvers` added — the standard bridge for CLAUDE.md's mandated "RHF + zod resolvers"; both base libraries are on the approved list.
- 2026-07-04 — Mifflin-St Jeor uses the +5 (male) constant — SPEC §3 has no sex field and the single-user app targets a teenage gym-goer; suggestions stay editable and labeled.
- 2026-07-04 — Wizard step 5 recomputes suggestions on entry but never overwrites fields the user already edited (RHF dirtyFields).
- 2026-07-04 — Onboarding is a full-screen route outside the tab shell; guards: fresh → `/onboarding`, onboarded visiting `/onboarding` → `/`.
- 2026-07-04 — zod v4 installed (latest): number validation uses the v4 `error` param instead of v3's `invalid_type_error`.
- 2026-07-05 — Added `favoriteMeals` table via a real schema v2 migration (SPEC §5.3 needs named combos; §3 lists no table). Export schemaVersion is now 2; existing data upgrades in place, no re-seed. Validates the migration scaffold end-to-end.
- 2026-07-05 — PROTEIN_GOAL_HIT awarded by `evaluateProteinGoal(dayKey)` (composes goals+meals+xp repos), called after each meal write; evaluated against the goal active that day (goalHistory); idempotent, never revoked on delete.
- 2026-07-05 — Macro bars for carbs/fat/fiber scale relative to the largest of the three (SPEC gives no targets for them); only protein tracks against a real goal.
- 2026-07-05 — Meal builder auto-opens the Recents tab when any history exists, making a recent-meal log a 3-tap flow (open → recent food → save); favorite combos log in 1 tap from the Quick-log row.
- 2026-07-05 — Meal builder models one row per food (tap a food to toggle it in/out), then adjusts quantity; piece foods stepped in whole pieces, g/ml foods in 10-unit steps.
- 2026-07-05 — Streak row derives workout/protein/water streaks from the xpEvents ledger (days with WORKOUT_COMPLETED / PROTEIN_GOAL_HIT / WATER_GOAL_HIT). The ledger already captures "goal hit that day against that day's goal", so historical streaks stay correct across goal edits; nothing extra is stored.
- 2026-07-05 — Water and Sleep have no tab/FAB home in SPEC §2, so both are added to the More menu as their entry points; Water is also reachable from the dashboard card and FAB. Logged as a small nav addition.
- 2026-07-05 — FAB quick-add: Meal opens the shared MealBuilderSheet, Water/Weight open inline quick panels in a sheet, Workout navigates to /workout (per the plan's "→ today's session"). Water/Weight panels are shared with the Water screen and dashboard.
- 2026-07-05 — Water weekly/monthly figures use tracked-day averages (mean over logged days in the last 7/30) rather than total÷window, matching the app's zero-log-excluded analytics convention.
- 2026-07-05 — Dashboard weight trend compares the latest weigh-in to the nearest one ≥7 days earlier (falls back to the earliest); shows ↑/↓/→ with the kg delta.
- 2026-07-05 — Added `zustand` (approved dep) for the rest timer store, persisted to localStorage. The timer stores a target `endsAt` timestamp (not a counter), so remaining = endsAt − now stays correct through tab throttling and even a full reload (verified: resumed at 2:47 after reload). localStorage use is transient UI state, allowed by CLAUDE.md.
- 2026-07-05 — Starting a session prefills each exercise from its last session's sets (else one 8×20 set); "Last session" and "Copy last set" also available per exercise.
- 2026-07-05 — PR baseline is 0 when an exercise has no prior completed history, so a first-ever record counts as a PR (consistent across the live badge, finish summary, and history screen; enables the Phase 7 first_pr achievement). Scheduled-day prefill equals last session, so it shows no false PR.
- 2026-07-05 — Rest days show a rest card with an optional "Train anyway" that starts an empty custom session; the session logger and finish/PR/XP path are identical to a scheduled day.
- 2026-07-05 — Session edits persist to the in-progress workout on every change (survives navigation); Finish sets completed + auto duration (from createdAt) and awards WORKOUT_COMPLETED once per day. "Reopen to edit" flips completed back to false.
- 2026-07-05 — Recharts (approved dep, already installed) lives only in the lazy ProgressScreen chunk (~411 kB), keeping it out of the entry bundle per CLAUDE.md.
- 2026-07-05 — Charts use the current goal as a single reference line (not per-day goalHistory) for simplicity; the goal-line charts force the Y-axis domain to include the goal so it stays visible even when logs fall short.
- 2026-07-05 — Progress screen is one route with Charts/Body/Photos sub-tabs; photos stored as compressed JPEG Blobs (canvas, max edge 1280, q0.8) via `src/lib/image.ts`, rendered through object URLs revoked on cleanup.
- 2026-07-05 — Calendar water-goal dot uses the current water goal; day-detail sheet reuses WaterQuickPanel/WeightQuickPanel/MealBuilderSheet for that day plus inline sleep + note/mood, so editing a past day updates dots live via liveQuery.
- 2026-07-05 — Habit streaks derived from habitLogs (done days) via the existing streak lib; check grid covers the trailing 7 days.
- 2026-07-05 — `loadDemoData()` (SPEC §5.17, full 30-day generator) added now and wired to a temporary "Load demo data" button on Settings; Phase 8 will formalise Developer tools (add Wipe + double-confirm). Meals tuned to ~2750 kcal / ~120 g protein so goal lines and analytics are exercised.
- 2026-07-05 — STREAK_DAY = a day with any log whose previous day also had a log (awards 15 once/day); ALL_MISSIONS_DONE = all *applicable* daily missions done (workout mission excluded on rest days). Both awarded by `evaluateDay(dayKey)`.
- 2026-07-05 — Gamification is driven by one global watcher (`useGamification` in AppShell) on a liveQuery signal: it awards day-level XP, unlocks newly-earned achievements, and queues full-screen celebrations. All awards idempotent, so the write-back settles without looping.
- 2026-07-05 — Level-up detection tracks the last-celebrated level in localStorage (`forge-last-level`); initialised to the current level so it never fires on first load, fires once per real increase. Celebrations use a zustand FIFO queue rendered one-at-a-time by `CelebrationOverlay`.
- 2026-07-05 — `first_pr` achievement = a genuine PR (a later session beat an earlier one), distinct from `first_workout`; the first-ever session's zero-baseline PR badge does not count here. `early_bird` = workout finish (createdAt + duration) before 08:00 local.
- 2026-07-05 — Daily missions + weekly challenges live on the Achievements screen (SPEC §2 gives them no dedicated home); demo data pre-unlocks achievements silently so the live watcher doesn't replay 11 celebrations.

## DoD verification (fill in Phase 8)

- [ ] typecheck / test / build clean
- [ ] Installable + offline verified
- [ ] 360–430 px pass on all screens
- [ ] Empty states everywhere, no console errors
- [ ] All required unit tests green (SPEC §7.5)
- [ ] Zero TODOs / placeholders / `any`
