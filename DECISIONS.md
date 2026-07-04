# Decisions & Context

The reasoning behind how Bitesize Workouts is built. For *what it is and how to run it*, see
[README.md](README.md).

## Premise

A single-user (**n=1**) tool for one person to generate and log their own workouts. There are no
accounts, no sharing, no multi-tenant concerns. This premise is the reason behind most decisions
below — "good enough for me" beats "robust for everyone".

## Persistence: Neon Postgres

Chosen over `localStorage` so history and previous-record placeholders survive across devices and
browser clears. Vercel's Neon integration makes setup near-zero (`DATABASE_URL` auto-injected). The
`@neondatabase/serverless` HTTP driver suits Vercel's serverless functions. Drizzle gives typed
queries without a heavy ORM.

Two tables only: `workouts` and `set_logs`. Reads happen in server components; writes go through
thin API routes.

## Exercise library as hand-edited TypeScript

`data/exercises.ts` is the source of truth and is **edited by hand** — deliberately no admin UI.
For one person, editing a typed file is faster and simpler than building CRUD screens.

- **IDs are opaque and stable** (`ex_001`, …), decoupled from names, so renaming an exercise never
  orphans its logged history (`set_logs.exercise_id` references the id).
- **Body-part taxonomy reduced to 8** (`neck, shoulders, chest, back, arms, core, upper-leg,
  lower-leg`) — `arms` absorbs forearms/wrists; `upper-leg` absorbs hips/glutes/quads/hamstrings;
  `lower-leg` absorbs calves/ankles. Coarse on purpose; finer tags weren't worth the friction.
- **"Tissue" = mobilisation** — the rehab composition's tissue slot maps onto the existing
  mobilisations category rather than adding a sixth category.
- Body-part tags and preferences were seeded as best guesses, to be refined in the file over time.

## Generator behaviour

- **Avoid = hard constraint, Focus = soft boost.** Avoiding a body part removes those exercises
  entirely; focusing multiplies their selection weight (×4). This matches the mental model of
  "never today" vs "lean towards".
- **Per-exercise preference (1–5)** biases likelihood multiplicatively, so a 5 is ~5× a neutral 3
  and a 1 is rare but not impossible.
- **Graceful degradation, silently.** If constraints leave a category short, the workout just has
  fewer items. For a personal tool, a quietly-shorter workout beats an error dialog.
- **Whole-workout reroll**, plus **auto-reroll when options change**, so the shown workout always
  reflects the current settings. Weighting constants are intentionally tunable in `lib/constants.ts`.
- **Always-on rehab.** Every type carries `rehab: 1`, so a rehab exercise is always included (drawn
  from a category currently seeded with one ankle drill). Encoded per-type rather than as a special
  global rule — explicit and controllable.
- **Circuit-then-cooldown ordering.** Set count is no longer uniform across a workout: strength,
  dynamic, and rehab form a circuit repeated `sets` times; static and mobilisation are a "tail" run
  once at the very end (single set). Categories are classified as `REPEATED_CATEGORIES` /
  `TAIL_CATEGORIES` in `lib/constants.ts`, and `expandWorkout()` in `lib/generator.ts` is the single
  source of truth for the resulting order — logging, saving, and history all go through it, so the
  rule lives in exactly one place. (Category-level rather than per-type: the "static goes last" rule
  is global. A per-type or block-based model would be more flexible but is over-built for n=1.)

## UI / interaction

- **Generator-first home.** The index *is* the generator and shows a workout immediately — no
  landing or config step. Standard is the implicit default; the other types are quiet toggles in
  Options. There's no page title on the generator (tried one, removed it).
- **Tap-to-accept.** Committing to a workout is a single tap on any exercise, which expands into the
  logging view.
- **Empty = not done.** Finishing records blank sets as incomplete rather than forcing entry.
- **Minimal, derived design system.** Palette sampled directly from the reference PNG and reduced to
  six tokens (background, two mid-tones, ink, two greens). Type scale reduced to four sizes; Gabarito
  limited to two weights (900 / 500). The goal is consistency through constraint.
- **White-on-mid rule.** Components with a background that sit on a mid-tone background use white, to
  stay legible without introducing more palette steps.

## Security / auth

- Secrets live only in `.env.local` (gitignored) or the Vercel dashboard. The repo has been audited
  to confirm no credentials are present in any commit.
- **Saving requires a password you set.** The authoritative value is `APP_SECRET`, server-only
  (never `NEXT_PUBLIC_*`, so it never ships in the bundle) — set once in `.env.local` + Vercel. On
  the first save on a device an inline password field appears; the entry is kept in `localStorage`
  and sent as `x-app-secret`. The server compares it to `APP_SECRET` and 401s on mismatch (client
  then forgets it and re-shows the field). Reads stay open.
- The `localStorage` copy is **plaintext** — readable by same-origin JS, devtools, and anything that
  scrapes the browser profile. This is a **knowingly accepted** trade-off: the PIN only gates
  writing workouts to a private DB (no PII/money), so "enter once per device" convenience wins over
  encrypting it. A proper httpOnly-cookie login was considered and declined as over-engineering here.
- This replaced an earlier `NEXT_PUBLIC_APP_SECRET` guard, which was security theatre (a public
  "secret" is no secret). The session-password approach is genuinely secret-free on the client until
  the user types it, which is the right amount of protection for a private n=1 tool.

## Known limitations / future

- **No real auth.** If this ever became multi-user, the open write endpoint would need proper
  authentication — the current `lib/auth.ts` shared-secret guard is a placeholder for that.
- **Weighting is feel-based.** The preference/focus constants haven't been tuned against real usage
  yet; they're easy to adjust.
- **No automated tests.** Correctness has been verified manually (generator distributions checked by
  script, save/load round-trips checked end-to-end). A pure generator + pure helpers would be
  straightforward to unit-test if desired.
