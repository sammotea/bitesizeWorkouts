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

Three tables: `workouts`, `set_logs`, `rehab_days`. Reads happen in server components; writes go
through thin API routes.

## Exercise library as hand-edited TypeScript

`data/exercises.ts` is the source of truth and is **edited by hand** — deliberately no admin UI.
For one person, editing a typed file is faster and simpler than building CRUD screens.

- **IDs are opaque and stable** (`ex_001`, …), decoupled from names, so renaming an exercise never
  orphans its logged history (`set_logs.exercise_id` references the id).
- **Body-part taxonomy reduced to 8** (`neck, shoulders, chest, back, arms, core, upper-leg,
  lower-leg`) — `arms` absorbs forearms/wrists; `upper-leg` absorbs hips/glutes/quads/hamstrings;
  `lower-leg` absorbs calves/ankles. Coarse on purpose; finer tags weren't worth the friction.
- **"Tissue" = mobilisation** — the stretches composition's tissue slot maps onto the existing
  mobilisations category rather than adding a sixth category.
- Body-part tags and pool weightings were seeded as best guesses, to be refined in the file over time.

## Pools: both features are first-class

When the daily rehab tracker arrived, the shape was redesigned from the ground up rather than
bolting a `rehabPreference` next to `preference` (which would have made the tracker a second-class
add-on):

- **`category` is pure movement taxonomy** (5 values). An earlier `rehab` *category* was removed —
  "rehab" is a *role* an exercise plays in a feature, not a kind of movement. Old saved workouts
  that stored `category: "rehab"` still render because history derefs live exercise data by id.
- **`pools` map**: presence = membership, value = weighting (1–5 or `"always"`). This unifies the
  "flag + preference" pair into one optional entry, keeps every pool symmetric (`workout` is not
  privileged), and makes new features additive — a new pool key, no reshape.
- **Same exercise, different weights per feature** — e.g. weight 2 in the main workout draw but
  pinned in the tracker.
- **Pins compete for slots**: slot counts are hard; if `"always"` entries exceed them, winners are
  sampled uniformly among the pinned. Chosen over "pins grow the draw" to keep program sizes fixed.
- Every selection in the app is one primitive: *draw N from pool P — pins first, then weighted.*

## Daily rehab tracker

- **Persisted daily program** (`rehab_days`, one row per day): generated on first visit, then
  frozen — identical across devices and immune to mid-day library edits. Chosen over date-seeded
  RNG, which would silently reshuffle when the library changes.
- **Client-local dates** (`YYYY-MM-DD` from the browser clock): "a day" is the user's day, not UTC.
- **Tick-only sets** — binary pips, tap to toggle, optimistic UI, every tap saves. No finish
  button; the feature is piecemeal by design.
- **Create-on-GET** is an unguarded write (worst case: empty rows for arbitrary dates) — accepted
  for n=1 so the page loads without auth; ticks themselves are password-guarded.
- **Special daily hold outside the library** (`REHAB_HOLD`): a once-a-day fixture (a 2-minute deep
  squat) that never fits the sampled/pooled model — it's a fixed ritual, not an exercise, and never
  appears in workouts. Kept as config (name + `targetSeconds`) with a *stable reserved progress
  key* so its tick state survives changing the name or duration. Stored in the same `rehab_days`
  `progress` jsonb (variable-length arrays already allow a 1-tick item), so it needed no migration;
  existing days backfill the key on read. A countdown timer would be a later UI-only add.
- **Swap by explicit pick, not redraw.** A drill can be swapped for any other `dailyRehab`
  candidate via a picker (chosen over a random reroll: rehab is deliberate — you swap *to* address a
  specific niggle, not to reshuffle). The swap keeps the drill's slot position, discards its ticks,
  and seeds the newcomer fresh; other drills' progress and the hold are untouched. It reuses the
  tick `PATCH` route (a discriminated `{action:"swap"}` body) and the same password guard — no new
  endpoint. The server validates the target is a real, not-already-scheduled `dailyRehab` exercise,
  so a stale client can't corrupt the day.
- Today-only view for now; per-day rows make a history/streak view a cheap later addition.

## Generator behaviour

- **Avoid = hard constraint, Focus = soft boost.** Avoiding a body part removes those exercises
  entirely; focusing multiplies their selection weight (×4). This matches the mental model of
  "never today" vs "lean towards".
- **Per-exercise pool weighting (1–5)** biases likelihood multiplicatively, so a 5 is ~5× a
  neutral 3 and a 1 is rare but not impossible; `"always"` pins.
- **Graceful degradation, silently.** If constraints leave a pool short, the workout just has
  fewer items. For a personal tool, a quietly-shorter workout beats an error dialog.
- **Whole-workout reroll**, plus **auto-reroll when options change**, so the shown workout always
  reflects the current settings. Weighting constants are intentionally tunable in `lib/constants.ts`.
- **Always-on rehab slot.** Every type carries `rehabSlots: 1`, drawn from the `workoutRehab` pool
  (any category, badged "Rehab" in the UI; metrics stay category-derived). Encoded per-type rather
  than as a special global rule — explicit and controllable.
- **Circuit-then-cooldown ordering.** Set count is not uniform across a workout: strength,
  dynamic (and rehab picks of those categories) form a circuit repeated `sets` times; static and
  mobilisation are a "tail" run once at the very end (single set). Categories are classified as
  `REPEATED_CATEGORIES` / `TAIL_CATEGORIES` in `lib/constants.ts`, and `expandWorkout()` in
  `lib/generator.ts` is the single source of truth for the resulting order — logging, saving, and
  history all go through it, so the rule lives in exactly one place. (Category-level rather than
  per-type: the "static goes last" rule is global. A per-type or block-based model would be more
  flexible but is over-built for n=1.)

## UI / interaction

- **Landing as switchboard.** With two features, `/` is a two-card landing (Workout / Rehab, the
  rehab card showing live progress); the generator lives at `/workout` and still shows a workout
  immediately — no config step. Standard is the implicit default; the other types are quiet
  toggles in Options. There's no page title on the generator (tried one, removed it).
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
