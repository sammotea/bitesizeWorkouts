# Bitesize Workouts

A personal (**n=1**) training app with two features sharing one exercise library:

- **Bitesize workout** (`/workout`) — press a button, get a workout composed by weighted-random
  selection, reroll until you like it, log your sets, save. History per-workout and per-exercise;
  future workouts prefill from your last records.
- **Piecemeal rehab** (`/rehab`) — a fixed daily program (3 exercises × 3 sets) generated once per
  day; tick individual sets off whenever through the day.

The landing page (`/`) is the switchboard between the two. Single user, no accounts. Hosted on
Vercel with a Neon (Postgres) database.

> Why it's built the way it is — the rationale, trade-offs, and context — lives in
> [DECISIONS.md](DECISIONS.md). This file covers **what it is and how to work on it**.

---

## The workout flow

1. **Generate** — `/workout` auto-shows a Standard workout on load.
2. **Modify** — **Regenerate** rerolls; **Options** opens a dropdown to change the workout *type*
   and add *biases* (focus on / avoid a body part). Changing any option re-rolls automatically.
3. **Accept** — tap any exercise to lock the workout in and expand into the logging view.
4. **Log** — work through the sets in order; each metric input is placeholdered with your previous
   record for that exercise (blank if there's no history).
5. **Finish** — add an optional comment + max heart rate, then save. Empty sets are skipped (not
   saved), so history shows only what you actually did.
6. **Review** — **History** lists past workouts; **Library** lists every exercise, each linking to
   its own logged progression.

## The rehab flow

Visit `/rehab` — the day's program is generated on first visit (from the `dailyRehab` pool) and
persisted, so it's identical for the whole day on every device. Tap a numbered pip to mark a set
done (tap again to undo); every tap saves instantly. The landing card shows live progress
("4/9 done today"). "A day" is your local calendar day, not UTC. Program shape is
`REHAB_TRACKER = { exercises: 3, sets: 3 }` in [`lib/constants.ts`](lib/constants.ts).

A special **once-a-day hold** (`REHAB_HOLD` in the same file — a "Deep squat", 2 min) sits at the
top, tracked outside the exercise library and pools: it's a fixed daily ritual, never sampled and
never part of workouts. Edit its `name`/`targetSeconds` freely; its reserved progress `key` stays
stable so tick state survives the change.

---

## Pools — membership + weighting per feature

Each exercise has intrinsic facts (name, category, body parts) plus a **`pools` map** that says
which selection pools it belongs to and how strongly:

```ts
type Weighting = 1 | 2 | 3 | 4 | 5 | "always";
pools: {
  workout?: Weighting;      // main bitesize draw (via its category slot)
  workoutRehab?: Weighting; // candidate for the workout's rehab slot
  dailyRehab?: Weighting;   // candidate for the piecemeal tracker
}
```

- **Presence = membership**: no `workout` entry → never appears in generated workouts; no
  `dailyRehab` → never in the tracker.
- **1–5** weights the draw (`{1: 0.15, 2: 0.5, 3: 1, 4: 2.5, 5: 5}` via `PREFERENCE_WEIGHT`).
- **`"always"` pins**: pinned exercises are chosen before weighted sampling. Pins **compete** for
  slots — if there are more pins than slots, the winners are sampled uniformly among them; the
  draw never grows past the slot count.

## How workout generation works

The library has **5 movement categories**: `major` / `minor` strength, `dynamic` / `static`
stretches, and `mobilisation`. Each **type** requests category slots plus **1 rehab slot** drawn
from the `workoutRehab` pool (any category; badged "Rehab" in the UI):

| Type           | Composition                                       | Rehab slot | Sets |
| -------------- | ------------------------------------------------- | ---------- | ---- |
| Standard       | 1 major · 1 minor · 1 dynamic · 1 static          | 1          | 2    |
| Fatigued       | 1 major · 1 minor · 1 dynamic · 1 static          | 1          | 1    |
| Energised      | 2 major · 2 minor · 1 dynamic · 1 static          | 1          | 2    |
| Stretches only | 2 dynamic · 2 static · 1 mobilisation             | 1          | 1    |

Selection (in [`lib/generator.ts`](lib/generator.ts)) is weighted-random, no duplicates per workout:

1. **Avoid is a hard filter** — any exercise tagged with an avoided body part is dropped entirely
   (category and rehab draws alike).
2. **Weight each candidate**: pool weighting × (`FOCUS_BOOST` = 4 if it matches a Focus body part),
   with `"always"` pins drawn first (competing for slots).
3. **Sample** each pool without replacement; the rehab slot excludes exercises already picked.
4. **Graceful degradation** — if a pool can't supply enough exercises after filtering, the workout
   silently includes fewer (or skips that slot). No warnings.

Metrics stay category-derived — a `minor`-category rehab pick logs weight + reps.

### Set order — circuit then cooldown

`expandWorkout()` is the single source of truth for set count + order:

- **Repeated circuit** (major, minor, dynamic — including the rehab pick when it's one of those
  categories) runs `sets` times, interleaved.
- **Tail** (static, mobilisation) then appears **once at the very end, single set** — never repeated.

So `workout.sets` is the count for the *repeated circuit*, not every exercise.

---

## Tech stack

- **Next.js 15 (App Router) + TypeScript** — pages, server components for reads, API routes for writes.
- **Tailwind CSS v4** — design tokens in `@theme` (see Design system).
- **Drizzle ORM + `@neondatabase/serverless`** — typed, serverless Postgres (Neon).
- **Zustand** — the ephemeral generate→log session state.
- **next/font** — Gabarito (display) + Familjen Grotesk (body).

---

## Project structure

```
app/
  page.tsx                 Landing — WORKOUT / REHAB cards (live rehab progress peek)
  workout/                 /workout — GeneratorView or LoggingView by session phase
  rehab/                   /rehab — the daily tracker (RehabView)
  layout.tsx               Shell: header (Home / History / Library), mint divider, fonts
  globals.css              Tailwind import + @theme palette/font tokens
  history/                 /history list + /history/[id] detail
  exercises/               /exercises library + /exercises/[id] progression
  api/
    workouts/              POST save, GET list, GET [id]
    exercises/last/        GET previous records for placeholders
    exercises/[id]/history/ GET per-exercise logged sets
    rehab/[date]/          GET day (get-or-create; ?peek=1 read-only) · PATCH tick
components/
  GeneratorView · LoggingView · OptionsPanel · RehabView · RehabPeek
  ExerciseRow · Button · HomeLink · PasswordForm
lib/
  generator.ts             Pool-based weighted selection (+ expandWorkout, generateRehabProgram)
  store.ts                 Zustand session store (phase, type, biases, logs)
  constants.ts             Categories, workout types, body parts, weighting, REHAB_TRACKER
  types.ts · format.ts · datetime.ts · clsx.ts   Shared types & helpers
  auth.ts                  Write-guard (no-op unless APP_SECRET set)
  session-auth.ts          Device-local copy of the save password
  db/  index.ts (client) · schema.ts (tables) · queries.ts
data/exercises.ts          The exercise library — hand-edited (see below)
drizzle/                   Generated migrations + metadata
```

---

## Data model

### Exercise library — `data/exercises.ts`

The single source both features read. **Edit this file by hand** — there is no admin UI.

```ts
interface Exercise {
  id: string;          // stable, opaque, NOT derived from the name (e.g. "ex_001")
  name: string;        // freely editable label
  category: Category;  // major | minor | dynamic | static | mobilisation
  bodyParts: BodyPart[]; // neck, shoulders, chest, back, arms, core, upper-leg, lower-leg
  pools: {             // role membership + weighting — see "Pools" above
    workout?: Weighting;
    workoutRehab?: Weighting;
    dailyRehab?: Weighting;
  };
  bookRef?: { title: string; page: number }; // shown next to the name
}
```

- **Rename freely** — the `id` stays fixed, so logged history is never broken.
- **Tune `pools`** to control where an exercise appears and how often (`"always"` to pin).
- **Edit `bodyParts`** to change how Focus/Avoid biases pick it up.
- Never reuse an `id`.

### Persistence — Postgres (`lib/db/schema.ts`)

```
workouts    id · performed_at · type · biases(jsonb) · composition(jsonb) · finished
            · comment · max_heart_rate
set_logs    id · workout_id → workouts · exercise_id · set_number
            · weight · reps · duration_sec · completed · created_at
rehab_days  date (PK, local YYYY-MM-DD) · exercise_ids(jsonb) · progress(jsonb) · created_at
```

- Only sets with at least one metric are saved; empty sets aren't written, so history shows only
  what was done. History renders only the metrics that were filled (no placeholder dashes).
- **Workout history** = `workouts` + aggregated `set_logs`.
- **Per-exercise history** = `set_logs` filtered by `exercise_id`, joined for the date.
- **Previous-record placeholder** = most recent set for that exercise, taking the latest non-null
  value per field independently (weight / reps / duration).
- **Rehab day** = one row per local calendar day; `progress` holds one boolean per set per
  exercise. Created on first visit (`GET` get-or-create); ticks are `PATCH`ed individually.

Metrics are derived from category: strength → weight + reps; stretch → hold (s) + reps;
mobilisation → time (s).

---

## Design system

Palette is sampled directly from the reference design; tokens in [`app/globals.css`](app/globals.css):

| Token (`bg-`/`text-`/`border-`) | Hex | Role |
| --- | --- | --- |
| `cream` | `#f4f3ee` | Page background |
| `line` | `#e3e1d9` | Light mid-tone — borders + standout/wrapper backgrounds |
| `charcoal-soft` | `#6f6c62` | Dark mid-tone — secondary text + section/nav labels |
| `charcoal` | `#2e2b25` | Ink — primary text |
| `mint` | `#a9d2ac` | Primary highlight — divider, active states, toggles |
| `mint-soft` | `#d6e7d6` | Secondary highlight — hovers |

**Typography** — two families, four sizes:

- **Gabarito** (`.font-display`): only **900** (titles + stat numbers) and **500** (buttons,
  section/nav labels). Loaded weights are limited to these two.
- **Familjen Grotesk**: body text.
- Sizes: `text-6xl` headings · `text-2xl` stat inputs · `text-lg` item titles · `text-sm` everything else.

**Conventions**

- Corners are ~4px on controls, ~6–8px on cards.
- **White-on-mid rule**: any component with a background that sits on a mid (`line`) background uses
  a **white** background (e.g. the controls inside the Options panel).
- In the logging view, unselected exercise cards are white; the card being edited switches to the
  mint highlight with its inputs/badge flipping to white for contrast.

---

## Local development

```bash
npm install

# Create .env.local with your Neon connection string:
#   DATABASE_URL="postgresql://...neon.tech/db?sslmode=require"
# (or, if the project is linked to Vercel: npx vercel env pull .env.local)

npm run db:push     # create the workouts + set_logs tables in your Neon DB
npm run dev         # http://localhost:3000
```

Set `APP_SECRET` in `.env.local` to a long random string — it's the save password (see Auth).

The app **runs without a database** — generate / reroll / accept all work and history pages show an
empty state. The database is only needed to **save** workouts and to see history + previous-record
placeholders.

### Auth

Writes (workout saves and rehab ticks) are guarded by a **password** you choose — set as the
server-only `APP_SECRET` env var. On the
first write on a device, an inline password field appears; the value is kept in `localStorage`
(plaintext, persists across sessions until cleared) and sent as the `x-app-secret` header on every
save. The server ([`lib/auth.ts`](lib/auth.ts)) compares it to `APP_SECRET`; a mismatch returns 401,
the client forgets it, and the field reappears. Reads (history/library) are open.

To change the password, update `APP_SECRET` in `.env.local` (restart dev) **and** in Vercel
(redeploy). If `APP_SECRET` is unset, the guard is skipped (saving is open) — handy for local dev.

---

## Deployment (Vercel)

If the Neon database was created via Vercel's **Storage** integration, `DATABASE_URL` is injected
into the project's environment automatically — no `.env` file is used in production.

1. Ensure `DATABASE_URL` exists in **Settings → Environment Variables** (Production).
2. Add `APP_SECRET` (the save password) as a Production env var.
3. **Redeploy** — env vars only apply to deployments created after they were added.
4. The schema must exist in the database (`npm run db:push` once, locally, against that DB).

---

## Environment variables

| Variable | Required | Purpose |
| --- | --- | --- |
| `DATABASE_URL` | Yes (for saving/history) | Neon Postgres connection string |
| `APP_SECRET` | Recommended | The save password (server-only). If unset, saving is open. |

> Secrets live only in `.env.local` (gitignored) or the Vercel dashboard — never committed.
> `APP_SECRET` is server-only (never `NEXT_PUBLIC_*`), so it isn't shipped to the browser — the user
> types it once per session. See [DECISIONS.md](DECISIONS.md).

---

## Scripts

| Command | Does |
| --- | --- |
| `npm run dev` / `build` / `start` | Next.js dev / production build / serve |
| `npm run db:push` | Push the Drizzle schema to the database |
| `npm run db:generate` | Regenerate migration SQL from the schema |
| `npm run db:migrate` | Apply generated migrations |
