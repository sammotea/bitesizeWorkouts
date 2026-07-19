import { EXERCISES } from "@/data/exercises";
import {
  CATEGORY_ORDER,
  FOCUS_BOOST,
  PREFERENCE_WEIGHT,
  REHAB_TRACKER,
  REPEATED_CATEGORIES,
  TAIL_CATEGORIES,
  WORKOUT_TYPES,
} from "./constants";
import type {
  Biases,
  Category,
  CompositionItem,
  Exercise,
  ExercisePools,
  GeneratedWorkout,
  Weighting,
  WorkoutType,
} from "./types";

/** Does this exercise touch any of the given body parts? */
function touchesAny(ex: Exercise, parts: Biases["avoid"]): boolean {
  return ex.bodyParts.some((p) => parts.includes(p));
}

/**
 * Draw `count` distinct exercises by weighted sampling without replacement.
 * `weightOf` returns each candidate's relative likelihood (0 excludes it).
 * Returns fewer than `count` (possibly zero) if the pool is too small —
 * graceful degradation, no error.
 */
function sampleWeighted(
  pool: Exercise[],
  weightOf: (ex: Exercise) => number,
  count: number,
  rng: () => number,
): Exercise[] {
  const remaining = [...pool];
  const picked: Exercise[] = [];

  while (picked.length < count && remaining.length > 0) {
    const total = remaining.reduce((s, e) => s + weightOf(e), 0);
    if (total <= 0) break; // every remaining candidate has zero weight

    let r = rng() * total;
    let idx = 0;
    for (let i = 0; i < remaining.length; i++) {
      r -= weightOf(remaining[i]);
      if (r <= 0) {
        idx = i;
        break;
      }
    }
    picked.push(remaining[idx]);
    remaining.splice(idx, 1);
  }

  return picked;
}

/**
 * Draw `count` distinct exercises from a pool, honouring pins.
 *
 * - "always" entries are chosen before weighted sampling. Pins COMPETE for
 *   slots: if there are more pins than `count`, `count` are sampled uniformly
 *   among them — the draw never grows past `count`.
 * - Remaining slots are filled by weighted sampling over the 1–5 weightings
 *   (via PREFERENCE_WEIGHT), optionally boosted per-exercise (Focus bias).
 */
function drawFromPool(
  pool: Exercise[],
  getWeighting: (ex: Exercise) => Weighting | undefined,
  count: number,
  rng: () => number,
  boost: (ex: Exercise) => number = () => 1,
): Exercise[] {
  const pins = pool.filter((ex) => getWeighting(ex) === "always");
  if (pins.length >= count) {
    return sampleWeighted(pins, () => 1, count, rng);
  }

  const rest = pool.filter((ex) => {
    const w = getWeighting(ex);
    return w !== undefined && w !== "always";
  });
  const weightOf = (ex: Exercise) =>
    PREFERENCE_WEIGHT[getWeighting(ex) as Exclude<Weighting, "always">] *
    boost(ex);

  return [...pins, ...sampleWeighted(rest, weightOf, count - pins.length, rng)];
}

/**
 * Generate a candidate workout for the given type and biases.
 *
 * - Avoid is a HARD constraint: exercises touching an avoided body part are
 *   filtered out entirely (category and rehab draws alike).
 * - Focus multiplies selection weight; per-exercise pool weightings shape the
 *   rest ("always" pins first, competing for slots).
 * - Category slots draw from `pools.workout`; the rehab slot(s) draw from
 *   `pools.workoutRehab` (excluding already-picked exercises) and are placed
 *   after the dynamics with `role: "rehab"`.
 * - If a pool cannot supply the requested count, the workout silently includes
 *   fewer items. No warnings.
 *
 * `rng` is injectable for deterministic testing; defaults to Math.random.
 */
export function generateWorkout(
  typeKey: WorkoutType["key"],
  biases: Biases,
  rng: () => number = Math.random,
): GeneratedWorkout {
  const type = WORKOUT_TYPES[typeKey];

  // Hard Avoid filter, applied once across the whole library.
  const available = EXERCISES.filter((ex) => !touchesAny(ex, biases.avoid));
  const boost = (ex: Exercise) =>
    biases.focus.length > 0 && touchesAny(ex, biases.focus) ? FOCUS_BOOST : 1;

  // Category slots, drawn from the `workout` pool.
  const byCategory = new Map<Category, Exercise[]>();
  for (const category of CATEGORY_ORDER) {
    const count = type.slots[category] ?? 0;
    if (count === 0) continue;
    const pool = available.filter(
      (ex) => ex.category === category && ex.pools.workout !== undefined,
    );
    byCategory.set(
      category,
      drawFromPool(pool, (ex) => ex.pools.workout, count, rng, boost),
    );
  }

  // Rehab slot(s), drawn from the `workoutRehab` pool (no duplicates).
  const taken = new Set(
    [...byCategory.values()].flat().map((ex) => ex.id),
  );
  const rehabPool = available.filter(
    (ex) => ex.pools.workoutRehab !== undefined && !taken.has(ex.id),
  );
  const rehabPicks = drawFromPool(
    rehabPool,
    (ex) => ex.pools.workoutRehab,
    type.rehabSlots,
    rng,
    boost,
  );

  // Composition order: major, minor, dynamic, rehab picks, static, mobilisation.
  const ordered: { ex: Exercise; role?: "rehab" }[] = [
    ...REPEATED_CATEGORIES.flatMap((c) =>
      (byCategory.get(c) ?? []).map((ex) => ({ ex })),
    ),
    ...rehabPicks.map((ex) => ({ ex, role: "rehab" as const })),
    ...TAIL_CATEGORIES.flatMap((c) =>
      (byCategory.get(c) ?? []).map((ex) => ({ ex })),
    ),
  ];

  return {
    type: typeKey,
    biases,
    sets: type.sets,
    composition: ordered.map(({ ex, role }, slot) => ({
      exerciseId: ex.id,
      category: ex.category,
      slot,
      ...(role ? { role } : {}),
    })),
  };
}

/** One (exercise, set) entry in logging/save order. */
export interface WorkoutSlot {
  exerciseId: string;
  category: Category;
  setNumber: number;
  role?: CompositionItem["role"];
}

/**
 * Expand a workout into the ordered (exercise, set) list used by logging,
 * saving, and history. The single source of truth for set count + order:
 *   - Repeated categories (strength/dynamic — incl. rehab picks of those
 *     categories) run the circuit `sets` times, interleaved.
 *   - Tail categories (static/mobilisation) each appear once at the very end.
 */
export function expandWorkout(workout: GeneratedWorkout): WorkoutSlot[] {
  const repeated = workout.composition.filter((c) =>
    REPEATED_CATEGORIES.includes(c.category),
  );
  const tail = workout.composition.filter((c) =>
    TAIL_CATEGORIES.includes(c.category),
  );

  const out: WorkoutSlot[] = [];
  for (let set = 1; set <= workout.sets; set++) {
    for (const it of repeated) {
      out.push({
        exerciseId: it.exerciseId,
        category: it.category,
        setNumber: set,
        role: it.role,
      });
    }
  }
  for (const it of tail) {
    out.push({
      exerciseId: it.exerciseId,
      category: it.category,
      setNumber: 1,
      role: it.role,
    });
  }
  return out;
}

// ── Daily rehab tracker ──────────────────────────────────────────────────────

/**
 * Pick the day's rehab program from the `dailyRehab` pool — pins first
 * (competing for slots), weighted sampling for the rest. Returns exercise ids.
 */
export function generateRehabProgram(
  rng: () => number = Math.random,
): string[] {
  const pool = EXERCISES.filter((ex) => ex.pools.dailyRehab !== undefined);
  return drawFromPool(
    pool,
    (ex) => ex.pools.dailyRehab,
    REHAB_TRACKER.exercises,
    rng,
  ).map((ex) => ex.id);
}

/**
 * All exercises in the `dailyRehab` pool, minus any `excludeIds` — the
 * candidate list for swapping a drill in the tracker. Sorted by name so the
 * picker is stable and browsable.
 */
export function dailyRehabCandidates(excludeIds: string[] = []): Exercise[] {
  const exclude = new Set(excludeIds);
  return EXERCISES.filter(
    (ex) => ex.pools.dailyRehab !== undefined && !exclude.has(ex.id),
  ).sort((a, b) => a.name.localeCompare(b.name));
}

/** Convenience: does this exercise belong to the given pool? */
export function inPool(ex: Exercise, pool: keyof ExercisePools): boolean {
  return ex.pools[pool] !== undefined;
}
