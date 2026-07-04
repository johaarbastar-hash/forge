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

- [ ] 5-step wizard (SPEC §5.1) with RHF + zod validation, progress indicator, back/next
- [ ] Goal suggestions (formulas per §5.1) shown editable with "suggestion, not medical advice" label
- [ ] Profile screen (view/edit all fields, BMI "reference only"); Goals screen with visual progress per goal; edits append to goalHistory
- [ ] Route guard: not onboarded → wizard

**Checkpoint:** baseline.
**Accept:** fresh install → wizard → dashboard skeleton shows name, BMI, goals; reload persists; goal edit affects today forward only (verified via a test on goalHistory).

## Phase 3 — Nutrition + Food database

- [ ] Food DB screen: search, favorites filter, custom-food CRUD (per-100 g / per-100 ml / per-piece), edit seed foods
- [ ] Meal logging flow (§5.3): category → search/recents/favorites → serving/gram stepper → running totals → save
- [ ] Meal CRUD: edit, delete, duplicate (today/another day); favorite meal combos; recents (last 15 distinct foods)
- [ ] Dashboard: Forge Ring (calories) + protein/carbs/fat/fiber bars live via useLiveQuery; PROTEIN_GOAL_HIT XP wired

**Checkpoint:** baseline.
**Accept:** logging a recent meal ≤ 3 taps; displayed macros match `lib` aggregator (spot-check vs a unit test case); deleting a meal updates ring instantly.

## Phase 4 — Water, Sleep, Weight, Quick Add, Dashboard v1

- [ ] Water screen: +250/+500/+750/+1000, undo last, animated bottle fill, weekly/monthly averages; WATER_GOAL_HIT XP
- [ ] Sleep log (hours + optional bedtime); SLEEP_GOAL_HIT XP. Weight log; WEIGHT_LOGGED XP
- [ ] FAB quick-add sheet fully wired: Meal / Water / Weight / Workout(→ today's session)
- [ ] Dashboard v1 complete per §5.2 order (streak row, weight card with trend arrow, XP level card, weekly mini-summary; Coach card placeholder-free — hidden until Phase 8)

**Checkpoint:** baseline.
**Accept:** every quick-add writes correctly and dashboard reflects it without reload; streak row matches lib streak tests.

## Phase 5 — Workouts

- [ ] Split day view (scheduled day, default exercises, rest-day card)
- [ ] Session logger: set rows (reps/weight steppers, 2.5 kg increments), copy-last-set, prefill from last session, add/swap/remove exercise, notes
- [ ] Rest timer: 60/90/120/180 presets, timestamp-based (survives tab switch), chime + vibration where supported
- [ ] Finish flow: auto duration, WORKOUT_COMPLETED XP, summary card
- [ ] Exercise history + PRs: best weight, best e1RM, PR badge on new records; PR history list

**Checkpoint:** baseline.
**Accept:** full PPL push session loggable start→finish; PR badge fires on a new e1RM; switching tabs for 2 min doesn't desync the rest timer.

## Phase 6 — Progress, Calendar, Habits

- [ ] Charts (7/30/90): weight raw + 7-day rolling avg, kcal vs goal, protein vs goal, water vs goal, workouts/week — Recharts in a lazy chunk
- [ ] Measurements CRUD + per-field sparkline; progress photos (capture/upload → compress 1280 px JPEG q0.8 → Blob), timeline grid + two-photo compare
- [ ] Calendar month grid with day dots; day detail sheet (meals, workout, water, weight, sleep, note, mood 1–5), past days editable
- [ ] Habits screen: seeded + custom, daily check grid, current/best streaks (derived)

**Checkpoint:** baseline.
**Accept:** with demo data loaded (temporary dev hook is fine until Phase 8 button), all five charts render sane; a photo persists offline; editing a past day updates calendar dots.

## Phase 7 — Gamification

- [ ] All XP events wired per SPEC §5.11 table incl. STREAK_DAY and ALL_MISSIONS_DONE; awards idempotent (unique dayKey+type)
- [ ] Level system + full-screen level-up animation (ember burst; reduced-motion → simple fade)
- [ ] Achievements grid (12 from §5.11), evaluation on relevant writes, unlock animation fires exactly once, unlocks persisted
- [ ] Daily missions generated from goals (rest-day aware); weekly challenges (Mon–Sun) with progress bars

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

## DoD verification (fill in Phase 8)

- [ ] typecheck / test / build clean
- [ ] Installable + offline verified
- [ ] 360–430 px pass on all screens
- [ ] Empty states everywhere, no console errors
- [ ] All required unit tests green (SPEC §7.5)
- [ ] Zero TODOs / placeholders / `any`
