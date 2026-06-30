# Bitesize Workouts

A personal (`n=1`) workout generator. Press **Generate**, optionally biased by workout type and
body-part focus/avoidance, get a weighted-random workout from a structured exercise library,
reroll until happy, lock it in, log your sets, and save. History is viewable per-workout and
per-exercise.

## Stack

- **Next.js (App Router) + TypeScript**
- **Tailwind CSS v4** — Gabarito (display) + Familjen Grotesk (body) via `next/font`
- **Drizzle ORM + Neon (Vercel Postgres)** — durable history
- **Zustand** — client session state

## Local setup

```bash
npm install
cp .env.example .env        # fill in DATABASE_URL (Neon) + APP_SECRET
npm run db:push             # create tables in your Neon database
npm run dev                 # http://localhost:3000
```

The app runs without a database — generate/reroll/accept all work, and history pages show an
empty state. A database is only needed to **save** workouts and see history / previous-record
placeholders.

## Editing the exercise library

Everything lives in [`data/exercises.ts`](data/exercises.ts). Edit by hand to:

- **Rename** an exercise — the `id` stays fixed, so history is never broken.
- **Set preference** — `1` (strongly disliked) … `3` (neutral) … `5` (strongly preferred).
  Higher preference = more likely to be drawn.
- **Refine `bodyParts`** — used by the Avoid (hard filter) and Focus (×4 boost) biases.
  Taxonomy: `neck, shoulders, chest, back, arms, core, upper-leg, lower-leg`.
- Add a `bookRef: { title, page }` to surface a book page reference next to the name.

Never reuse an `id`. Generator weighting constants live in
[`lib/constants.ts`](lib/constants.ts) (`PREFERENCE_WEIGHT`, `FOCUS_BOOST`).

## Workout types

| Type      | Composition                          | Sets |
| --------- | ------------------------------------ | ---- |
| Standard  | 1 major, 1 minor, 1 dynamic, 1 static | 2    |
| Fatigued  | 1 major, 1 minor, 1 dynamic, 1 static | 1    |
| Energised | 2 major, 2 minor, 1 dynamic, 1 static | 2    |
| Rehab     | 1 minor, 1 dynamic, 1 static, 1 mobilisation | 1 |

If a category can't supply enough exercises after the Avoid filter, the workout silently
includes fewer items (no warning).

## Deploy (Vercel)

1. Push to a Git repo and import into Vercel.
2. Add a **Neon** Postgres integration (or set `DATABASE_URL` manually).
3. Set env vars in Vercel: `DATABASE_URL`, `APP_SECRET`, `NEXT_PUBLIC_APP_SECRET`
   (the last two should match — they guard the save endpoint for this single-user app).
4. Run `npm run db:push` against the production database once (or apply the migration in
   [`drizzle/`](drizzle)).

## Scripts

- `npm run dev` / `build` / `start`
- `npm run db:generate` — regenerate migration SQL from the schema
- `npm run db:push` — push the schema to the database
- `npm run db:migrate` — apply generated migrations
