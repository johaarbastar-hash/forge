# Forge — Product Specification

**Tagline:** Build Yourself.

A production-quality, offline-first PWA for a teenage gym-goer focused on healthy weight gain, muscle building, and consistency. Single user, metric units (kg / cm / ml), week starts Monday, English UI.

This document is the source of truth for **what** to build. `CLAUDE.md` defines **how** to build it. `PLAN.md` defines **in what order**. If something is genuinely unspecified, choose the simplest option consistent with this spec and log it under "Decisions" in `PLAN.md`.

---

## 1. Non-negotiable constraints

- **Stack:** React 18 + TypeScript (strict) + Vite + Tailwind CSS + Framer Motion + Zustand + React Router + Recharts + React Hook Form + Dexie (IndexedDB) + vite-plugin-pwa + date-fns + Vitest.
- **Storage:** IndexedDB via Dexie. **Never** localStorage for domain data (progress photos and months of logs exceed its quota). localStorage is allowed only for trivial UI prefs.
- **Dates:** All day-bucketed data keyed by local `YYYY-MM-DD` string via a single `toDayKey()` helper. Never `toISOString()` for day bucketing. Week = Monday–Sunday.
- **Derived, not stored:** Streaks, averages, scores, and level are computed by pure functions from logs. The only stored gamification state is the append-only XP event ledger and the achievement-unlock records.
- **Profiles:** Single user in v1. Keep all DB access behind a repository layer so profile scoping / Supabase sync can be added later without touching feature code.
- **Nutrition data:** Use ONLY the seed food values in §4.1. Do not invent macro values. Custom foods are user-entered. Label seed data in-app as "approximate values — editable."
- **No external APIs.** Everything runs locally, including the AI Coach.

---

## 2. Navigation & app shell

Bottom tab bar (mobile-first): **Home · Nutrition · Workout · Progress · More**.
"More" contains: Calendar, Habits, Goals, Analytics, Achievements, Coach, Search, Export, Profile, Settings.
Global floating action button (FAB), bottom-right above tab bar → quick-add sheet: **Meal / Water / Weight / Workout**.
All routes lazy-loaded. Root error boundary. Every list screen has a designed empty state that tells the user what to do first.

---

## 3. Data model (Dexie tables, schema v1)

| Table | Key fields (all rows have `id`, timestamps) |
|---|---|
| `profile` | name, age, heightCm, startWeightKg, experience ('beginner'\|'intermediate'\|'advanced'), splitId, onboarded |
| `goals` | weightKg, calories, proteinG, waterMl, sleepH, workoutsPerWeek |
| `foods` | name, per100: {kcal,proteinG,carbsG,fatG,fiberG}, unit ('g'\|'ml'\|'piece'), pieceGrams?, defaultServing {label, grams}, isCustom, isFavorite |
| `meals` | dayKey, category ('breakfast'\|'lunch'\|'dinner'\|'snack'\|'preWorkout'\|'postWorkout'), items: [{foodId, grams}], cachedMacros, time |
| `waterLogs` | dayKey, ml, time |
| `sleepLogs` | dayKey, hours, bedtime? |
| `weightLogs` | dayKey, kg |
| `exercises` | name, muscleGroup ('push'\|'pull'\|'legs'\|'core'), equipment, isCustom |
| `workouts` | dayKey, splitDay, entries: [{exerciseId, sets: [{reps, weightKg}]}], durationMin, notes, completed |
| `measurements` | dayKey, chestCm?, waistCm?, armCm?, thighCm?, hipCm?, shoulderCm? |
| `photos` | dayKey, blob (JPEG, max edge 1280px, q0.8), note? |
| `habits` | name, icon, target ('daily'), isActive — seed: Gym, Stretching, Reading, Meditation, Water Goal, Protein Goal, Sleep Goal, Steps |
| `habitLogs` | habitId, dayKey, done |
| `dayNotes` | dayKey, note, mood (1–5) |
| `xpEvents` | dayKey, type, amount — **unique index on (dayKey, type)** for idempotency |
| `achievementUnlocks` | achievementId, dayKey |
| `settings` | reminders config, developer flags |

Repository layer: `src/db/repositories/*` is the only place Dexie is imported. Include `db/migrations.ts` with a versioned upgrade path from day one, and an `exportAll()` / `importAll()` used by Export.

---

## 4. Seed data (ship exactly this)

### 4.1 Foods (19 items)

Values are approximate IFCT/USDA-based defaults per the stated base. `pieceGrams` given where unit is `piece`.

| Food | Base | kcal | Protein | Carbs | Fat | Fiber | Default serving |
|---|---|---|---|---|---|---|---|
| Rice, white, cooked | 100 g | 130 | 2.7 | 28.2 | 0.3 | 0.4 | 1 katori = 150 g |
| Roti (whole wheat) | 1 piece = 40 g | 115 | 4.0 | 23.0 | 1.0 | 3.5 | 1 piece |
| Dal (toor, cooked) | 100 g | 95 | 5.5 | 14.5 | 1.8 | 3.0 | 1 katori = 150 g |
| Paneer | 100 g | 290 | 18.0 | 4.0 | 22.0 | 0 | 50 g |
| Chicken breast, cooked | 100 g | 165 | 31.0 | 0 | 3.6 | 0 | 100 g |
| Egg, whole, boiled | 1 piece = 50 g | 75 | 6.3 | 0.5 | 5.0 | 0 | 1 piece |
| Milk, full-fat | 100 ml | 64 | 3.2 | 4.8 | 3.6 | 0 | 1 glass = 250 ml |
| Banana | 1 piece = 120 g | 105 | 1.3 | 27.0 | 0.4 | 3.1 | 1 piece |
| Apple | 1 piece = 180 g | 95 | 0.5 | 25.0 | 0.3 | 4.4 | 1 piece |
| Oats, dry | 100 g | 389 | 14.0 | 66.0 | 7.0 | 10.0 | 40 g |
| Peanut butter | 100 g | 590 | 25.0 | 20.0 | 50.0 | 6.0 | 1 tbsp = 16 g |
| Sattu | 100 g | 410 | 22.0 | 60.0 | 6.0 | 16.0 | 30 g |
| Chole (chickpea curry) | 100 g | 150 | 6.0 | 18.0 | 6.0 | 5.0 | 1 katori = 150 g |
| Rajma (curry) | 100 g | 140 | 6.0 | 17.5 | 5.5 | 5.5 | 1 katori = 150 g |
| Bhatura | 1 piece = 70 g | 290 | 5.5 | 34.0 | 14.5 | 1.5 | 1 piece |
| Muesli | 100 g | 390 | 9.5 | 70.0 | 7.0 | 7.5 | 45 g |
| Mixed dry fruits & nuts | 100 g | 580 | 17.0 | 22.0 | 47.0 | 8.0 | 30 g |
| Whey protein shake | 1 scoop = 30 g | 120 | 24.0 | 3.0 | 1.5 | 0 | 1 scoop |
| Curd (full-fat dahi) | 100 g | 65 | 3.5 | 4.5 | 3.8 | 0 | 1 katori = 150 g |

### 4.2 Exercises (28 items)

- **Push:** Barbell Bench Press, Incline Dumbbell Press, Overhead Press, Lateral Raise, Cable Fly, Tricep Rope Pushdown, Overhead Tricep Extension, Dips
- **Pull:** Deadlift, Pull-up, Lat Pulldown, Barbell Row, Seated Cable Row, Face Pull, Barbell Curl, Hammer Curl
- **Legs:** Back Squat, Leg Press, Romanian Deadlift, Leg Extension, Seated Leg Curl, Walking Lunge, Standing Calf Raise, Hip Thrust
- **Core:** Plank, Hanging Knee Raise, Cable Crunch, Russian Twist

### 4.3 Split templates (user picks one at onboarding; day→exercise mapping editable later)

- **PPL (6-day, default):** Mon Push, Tue Pull, Wed Legs, Thu Push, Fri Pull, Sat Legs, Sun Rest. Each day defaults to 5–6 exercises from the matching group + 1 core.
- **Upper/Lower (4-day):** Mon Upper, Tue Lower, Thu Upper, Fri Lower.
- **Full Body (3-day):** Mon / Wed / Fri.

### 4.4 Motivation quotes

Ship 30 short original training/discipline quotes in `src/data/quotes.ts` (no attributed celebrity quotes). Dashboard shows one per day, deterministic by dayKey.

---

## 5. Features

### 5.1 Onboarding (first run)

5-step wizard: (1) name + age, (2) height + current weight, (3) goal weight + experience, (4) split choice, (5) suggested goals review.
Suggested goals (all editable, labeled "suggestion, not medical advice"): calories = Mifflin-St Jeor × 1.5 activity + 350 surplus, rounded to 50; protein = 1.8 × bodyweight kg, rounded to 5; water = 35 ml × kg rounded to 250; sleep = 8 h; workouts/week from split. Completing the wizard writes profile + goals and lands on Dashboard.

### 5.2 Dashboard (Home)

Order: greeting + date + daily quote → calorie ring with protein/carbs/fat/fiber bars → water card (quick +250 shortcut) → today's workout card (split day, start/resume/completed state) → streak row (workout / protein / water, flame icons with counts) → weight card (current, goal, BMI, 7-day trend arrow) → XP level card with progress bar → Coach top-3 insights → weekly mini-summary (workouts done/planned, avg kcal, avg protein). Everything updates live via Dexie liveQuery hooks. BMI = kg / (m²), shown with label "reference only."

### 5.3 Nutrition

Log meals by category. Add flow: pick category → search/recents/favorites → pick food → quantity stepper in servings or grams → running macro total → save. Meal CRUD: edit, delete, duplicate (to today or another day). Favorite meals = saved named combos, loggable in 2 taps. Recents = last 15 distinct foods. Food database screen: search, filter (favorites / custom), custom food CRUD (per-100 or per-piece entry), edit seed foods allowed.

### 5.4 Water

Quick buttons +250 / +500 / +750 / +1000 ml, undo last, animated bottle that fills toward goal (Framer Motion), today total, weekly and monthly averages.

### 5.5 Workouts

Today view shows scheduled split day with default exercises. Session flow: start → per-exercise set logger (reps + weight steppers with 2.5 kg increments, "copy last set", "same as last session" prefill) → rest timer (presets 60/90/120/180 s, timestamp-based so it survives tab switches, subtle chime + vibration where supported) → notes → finish (duration auto from start, XP awarded). Swap/add/remove exercises in session. History per exercise: all sets, best weight, best e1RM (Epley: `weight × (1 + reps/30)`), PR badge fires when either improves. Rest day shows a rest card, not an empty screen.

### 5.6 Progress

Charts (Recharts, ranges 7/30/90 days): weight (raw dots + 7-day rolling average line), calories vs goal, protein vs goal, water vs goal, workout frequency per week. Measurements: dated entries for chest/waist/arm/thigh/hip/shoulder with per-field sparkline. Photos: capture or upload → compress to max edge 1280 px JPEG q0.8 → store as Blob → timeline grid + side-by-side compare of any two.

### 5.7 Calendar

Month grid; each day shows dot indicators (meal / workout / water-goal / weight). Tap a day → detail sheet: meals, workout summary, water total, weight, sleep, note + mood (1–5 emoji scale), all editable for past days.

### 5.8 Habits

Seeded habits (§3) + custom. Daily check-off grid, per-habit current and best streak (derived).

### 5.9 Goals

Edit all goal values; each shows current-period progress visually (ring or bar). Changing a goal affects future days only; past-day evaluations use the goal value snapshotted implicitly by recomputing against current goals is NOT acceptable — store a `goalHistory` append log {field, value, effectiveFromDayKey} and evaluate each day against the goal active that day.

### 5.10 Analytics

Weekly and monthly report screens. Metrics: avg calories, avg protein, avg water, avg sleep, workout consistency, weight-gain rate (slope of 7-day rolling average, kg/week). Scores (0–100, formulas fixed):

- **Nutrition** = 50 × (days protein ≥ goal ÷ tracked days) + 50 × (days |kcal − goal| ≤ 10% ÷ tracked days)
- **Consistency** = 100 × min(1, workouts done ÷ workouts planned)
- **Recovery** = 70 × min(1, avg sleep ÷ sleep goal) + 30 × (had ≥1 rest day per week ? 1 : 0.5)
- **Hydration** = 100 × min(1, avg water ÷ goal)
- **Health** = 0.3·Nutrition + 0.3·Consistency + 0.2·Recovery + 0.2·Hydration

Days with zero logs are excluded from "tracked days," never counted as failures.

### 5.11 Gamification

**XP ledger** (`xpEvents`, unique per dayKey+type — re-triggering never double-awards):

| Event | XP |
|---|---|
| WORKOUT_COMPLETED | 50 |
| PROTEIN_GOAL_HIT | 30 |
| WATER_GOAL_HIT | 20 |
| SLEEP_GOAL_HIT | 20 |
| WEIGHT_LOGGED | 10 |
| ALL_MISSIONS_DONE | 30 |
| STREAK_DAY (consecutive day with any log) | 15 |

**Level** = largest n where cumulative XP ≥ threshold(n); `threshold(n) = round(200 × n^1.5 / 10) × 10`, level 1 at 0 XP. Level-up: full-screen Framer Motion moment (ember burst, level number scale-in), respects `prefers-reduced-motion`.

**Achievements** (unlock animation = card flip + glow, fires once): first_workout · streak_7 · streak_30 · first_leg_day (workout containing a legs-group exercise) · first_chest_day (contains bench/incline/fly) · water_3l (≥3000 ml in one day) · first_protein_goal · gain_1kg (weight ≥ start + 1.0) · first_pr · meals_50 (50 meals logged) · level_5 · early_bird (workout finished before 08:00).

**Daily missions** (generated from goals each day): drink water goal · hit protein goal · finish scheduled workout (skipped on rest days) · sleep ≥ goal. **Weekly challenges** (Mon–Sun): train N days (from goal) · hit protein every tracked day · log weight ≥ 3 times.

### 5.12 AI Coach (local rule engine)

Pure function: `(last 14 days of data, goals, now) → Insight[]` where Insight = {id, priority 1–5, message, metric?}. Deterministic, fully unit-testable, no APIs. Rules (message templates, tone: direct, specific, encouraging):

1. `protein_gap` — after 18:00 and protein < goal: "You're {gap} g short on protein — a shake or 100 g paneer covers it."
2. `water_gap` — after 18:00 and water < goal: "Drink another {gap} ml to hit your water goal."
3. `weight_on_track` — 7-day avg up 0.2–0.6 kg vs prior week: "Weight up {x} kg this week — right in the lean-gain zone."
4. `weight_stalled` — flat (±0.1 kg) for 14 days: "Weight's been flat 2 weeks. Add ~200 kcal/day and reassess."
5. `weight_too_fast` — up > 0.8 kg/week for 2 weeks: "Gaining fast — trim ~150 kcal/day to keep it lean."
6. `skipped_day` — scheduled day yesterday with no workout: "You skipped {day} day. Slot it in today or tomorrow."
7. `consistency_praise` — weekly workout target met: "That's {n}/{n} sessions this week. Great consistency."
8. `sleep_low` — 3-day avg < goal − 1 h: "Averaging {x} h sleep. Muscle grows when you rest."
9. `calories_low` — 3-day avg < goal − 15%: "Eating well under target 3 days running — gaining needs fuel."
10. `streak_risk` — streak ≥ 3 and nothing logged today by 20:00: "Your {n}-day streak is on the line — log anything today."
11. `pr_congrats` — new PR this week: "New PR on {exercise}: {weight} kg × {reps}. Strong."
12. `rest_reminder` — 6+ consecutive training days: "Six days straight — schedule a rest day, recovery is training too."

Dashboard shows top 3 by priority; Coach page shows all with metric context.

### 5.13 Search

Unified page: foods, favorite meals, exercises, and dates (accepts `YYYY-MM-DD` and "12 Jul" style → opens calendar day). Debounced, grouped results.

### 5.14 Export

CSV per data type (meals, water, weight, workouts, sleep, habits), JSON full dump (via `exportAll()`), printable report = clean print-CSS view of the current monthly analytics report.

### 5.15 Reminders

Settings screen with per-type toggles + times: water (repeating interval), meals, workout, sleep, weigh-in (weekly). Baseline mechanism = in-app banners while the app is open; additionally use the Notification API when permission granted. State honestly in Settings copy: "Reminders fire while Forge is open; background push arrives with cloud sync later." Do not build a push server.

### 5.16 PWA

vite-plugin-pwa, `autoUpdate` strategy, full manifest (name Forge, theme `#09090B`, background `#09090B`), generated maskable icons (512/192) + apple-touch-icon + splash, offline-capable after first load, install prompt surfaced in Settings.

### 5.17 Developer utilities

Settings → Developer: **Load demo data** (generates 30 days of plausible logs — meals from seed foods, workouts per split, water 2–3.5 L, weight trending +0.3 kg/week, sleep 6.5–8.5 h — so charts and analytics are testable) and **Wipe all data** (double-confirm). Both clearly marked.

---

## 6. Design system

North star: **Apple Fitness dark aesthetic** with Strong's logger density. Premium, disciplined, ember-warm — not neon gamer.

**Palette:** bg `#09090B` · surface `#131316` · surface-2 `#1C1C21` · border `rgba(255,255,255,0.08)` · text `#FAFAFA` · muted `#A1A1AA` · accent `#EF4444` · accent-deep `#B91C1C` · ember gradient `#F97316 → #EF4444` (rings, streak flames, level-up only) · success `#22C55E` · warning `#F59E0B`.

**Type:** Space Grotesk (display, headings, big metric numbers — always `tabular-nums`) + Inter (UI/body). Metric numbers are the heroes: large, tight, with small muted unit labels.

**Signature element:** the **Forge Ring** — the ember-gradient calorie ring on Home with animated sweep on load; streak counts use the same ember treatment. Spend the boldness here; keep everything else quiet.

**Surfaces:** cards `rounded-2xl` on surface colors with 1px border. Glassmorphism (`bg-white/5 + backdrop-blur-xl + border-white/10`) reserved for the tab bar, FAB, and modal sheets only.

**Motion:** 150–250 ms ease-out for UI; springs for FAB sheet, level-up, achievement unlock; page transitions subtle fade/slide. Always respect `prefers-reduced-motion`.

**Copy voice:** plain verbs, sentence case, specific ("Log breakfast", not "Submit"). Empty states are invitations to act. Errors say what happened and what to do.

---

## 7. Definition of Done (global)

1. `npm run typecheck`, `npm run test`, `npm run build` all pass clean.
2. Lighthouse: installable PWA; app works offline after first load.
3. Fully usable at 360–430 px width; sensible at desktop widths.
4. Every screen has a designed empty state; no console errors; no dead buttons.
5. Unit tests green for: dayKey/date utils, streaks (incl. gaps, month boundaries, today-not-yet-logged), macro aggregation, BMI, XP ledger idempotency + level curve, PR/e1RM detection, all analytics score formulas, all 12 coach rules.
6. No TODOs, no placeholder code, no `any`.
