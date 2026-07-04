# Bitesize Workouts

A personal (**n=1**) workout generator. Press a button, get a workout composed by weighted-random
selection from a structured exercise library, reroll until you like it, log your sets, and finish.
History is kept per-workout and per-exercise, and future workouts prefill from your last records.

Single user, no accounts. Hosted on Vercel with a Neon (Postgres) database.

> Why it's built the way it is — the rationale, trade-offs, and context — lives in
> [DECISIONS.md](DECISIONS.md). This file covers **what it is and how to work on it**.

---

## What it does

1. **Generate** — the home page (`/`) auto-shows a Standard workout on load.
2. **Modify** — **Regenerate** rerolls; **Options** opens a dropdown to change the workout *type*
   and add *biases* (focus on / avoid a body part). Changing any option re-rolls automatically.
3. **Accept** — tap any exercise to lock the workout in and expand into the logging view.
4. **Log** — work through the sets in order; each metric input is placeholdered with your previous
   record for that exercise (blank if there's no history).
5. **Finish** — add an optional comment + max heart rate, then save. Empty sets are skipped (not
   saved), so history shows only what you actually did.
6. **Review** — **History** lists past workouts; **Library** lists every exercise, each linking to
   its own logged progression.

---

## How generation works

The library has **6 categories**: `major` / `minor` strength, `dynamic` / `static` stretches,
`rehab`, and `mobilisation`. Every workout also **always includes 1 rehab** exercise. Each **type**
requests a fixed number of slots per category:

| Type           | Composition                                             | Sets |
| -------------- | ------------------------------------------------------- | ---- |
| Standard       | 1 major · 1 minor · 1 dynamic · 1 rehab · 1 static      | 2    |
| Fatigued       | 1 major · 1 minor · 1 dynamic · 1 rehab · 1 static      | 1    |
| Energised      | 2 major · 2 minor · 1 dynamic · 1 rehab · 1 static      | 2    |
| Stretches only | 2 dynamic · 1 rehab · 2 static · 1 mobilisation         | 1    |

Selection (in [`lib/generator.ts`](lib/generator.ts)) is weighted-random, no duplicates per workout:

1. **Avoid is a hard filter** — any exercise tagged with an avoided body part is dropped entirely.
2. **Weight each candidate**: `preferenceWeight[1–5] × (matches a Focus body part ? 4 : 1)`.
   Preference weights are `{1: 0.15, 2: 0.5, 3: 1, 4: 2.5, 5: 5}` (3 = neutral). Constants live in
   [`lib/constants.ts`](lib/constants.ts) (`PREFERENCE_WEIGHT`, `FOCUS_BOOST`).
3. **Sample** the required count per category without replacement.
4. **Graceful degradation** — if a category can't supply enough exercises after filtering, the
   workout silently includes fewer (or skips that slot). No warnings.

### Set order — circuit then cooldown

`expandWorkout()` is the single source of truth for set count + order:

- **Repeated circuit** (major, minor, dynamic, rehab) runs `sets` times, interleaved —
  e.g. a 2-set Standard is `major, minor, dynamic, rehab, major, minor, dynamic, rehab`.
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
  page.tsx                 Home — renders GeneratorView or LoggingView by session phase
  layout.tsx               Shell: header (Home / History / Library), mint divider, fonts
  globals.css              Tailwind import + @theme palette/font tokens
  history/                 /history list + /history/[id] detail
  exercises/               /exercises library + /exercises/[id] progression
  api/
    workouts/              POST save, GET list, GET [id]
    exercises/last/        GET previous records for placeholders
    exercises/[id]/history/ GET per-exercise logged sets
components/
  GeneratorView · LoggingView · OptionsPanel · ExerciseRow · Button · HomeLink
lib/
  generator.ts             Pure weighted selection
  store.ts                 Zustand session store (phase, type, biases, logs)
  constants.ts             Categories, workout types, body parts, weighting
  types.ts · format.ts · datetime.ts · clsx.ts   Shared types & helpers
  auth.ts                  Optional write-guard (no-op unless APP_SECRET set)
  db/  index.ts (client) · schema.ts (tables) · queries.ts
data/exercises.ts          The exercise library — hand-edited (see below)
drizzle/                   Generated migration + metadata
```

---

## Data model

### Exercise library — `data/exercises.ts`

The single source the generator reads. **Edit this file by hand** — there is no admin UI.

```ts
interface Exercise {
  id: string;          // stable, opaque, NOT derived from the name (e.g. "ex_001")
  name: string;        // freely editable label
  category: Category;  // major | minor | dynamic | static | mobilisation
  bodyParts: BodyPart[]; // neck, shoulders, chest, back, arms, core, upper-leg, lower-leg
  preference: 1|2|3|4|5; // 1 strongly disliked … 3 neutral … 5 strongly preferred
  bookRef?: { title: string; page: number }; // shown next to the name
}
```

- **Rename freely** — the `id` stays fixed, so logged history is never broken.
- **Tune `preference`** to make an exercise appear more/less often.
- **Edit `bodyParts`** to change how Focus/Avoid biases pick it up.
- Never reuse an `id`.

### Persistence — Postgres (`lib/db/schema.ts`)

```
workouts   id · performed_at · type · biases(jsonb) · composition(jsonb) · finished
           · comment · max_heart_rate
set_logs   id · workout_id → workouts · exercise_id · set_number
           · weight · reps · duration_sec · completed · created_at
```

- Only sets with at least one metric are saved; empty sets aren't written, so history shows only
  what was done. History renders only the metrics that were filled (no placeholder dashes).
- **Workout history** = `workouts` + aggregated `set_logs`.
- **Per-exercise history** = `set_logs` filtered by `exercise_id`, joined for the date.
- **Previous-record placeholder** = most recent set for that exercise, taking the latest non-null
  value per field independently (weight / reps / duration).

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

Saving is guarded by a **password** you choose — set as the server-only `APP_SECRET` env var. On the
first save on a device, an inline password field appears; the value is kept in `localStorage`
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
