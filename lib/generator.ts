import { EXERCISES } from "@/data/exercises";
import {
  CATEGORY_ORDER,
  FOCUS_BOOST,
  PREFERENCE_WEIGHT,
  WORKOUT_TYPES,
} from "./constants";
import type {
  Biases,
  Category,
  Exercise,
  GeneratedWorkout,
  WorkoutType,
} from "./types";

/** Does this exercise touch any of the given body parts? */
function touchesAny(ex: Exercise, parts: Biases["avoid"]): boolean {
  return ex.bodyParts.some((p) => parts.includes(p));
}

/** Weight for an exercise given the active biases. */
function weightFor(ex: Exercise, biases: Biases): number {
  const base = PREFERENCE_WEIGHT[ex.preference];
  const focused = biases.focus.length > 0 && touchesAny(ex, biases.focus);
  return focused ? base * FOCUS_BOOST : base;
}

/**
 * Draw `count` distinct exercises from `pool` by weighted sampling without
 * replacement. Returns fewer than `count` (possibly zero) if the pool is too
 * small — graceful degradation, no error.
 */
function sampleWeighted(
  pool: Exercise[],
  weights: Map<string, number>,
  count: number,
  rng: () => number,
): Exercise[] {
  const remaining = [...pool];
  const picked: Exercise[] = [];

  while (picked.length < count && remaining.length > 0) {
    const total = remaining.reduce((s, e) => s + (weights.get(e.id) ?? 0), 0);
    if (total <= 0) break; // every remaining candidate has zero weight

    let r = rng() * total;
    let idx = 0;
    for (let i = 0; i < remaining.length; i++) {
      r -= weights.get(remaining[i].id) ?? 0;
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
 * Generate a candidate workout for the given type and biases.
 *
 * - Avoid is a HARD constraint: exercises touching an avoided body part are
 *   filtered out entirely.
 * - Focus + per-exercise preference shape the sampling weights.
 * - If a category cannot supply the requested count, the workout silently
 *   includes fewer items (or skips the category). No warnings.
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
  const eligible = EXERCISES.filter((ex) => !touchesAny(ex, biases.avoid));

  const weights = new Map<string, number>(
    eligible.map((ex) => [ex.id, weightFor(ex, biases)]),
  );

  const chosen: Exercise[] = [];
  // Walk categories in display order so slot indices are stable.
  for (const category of CATEGORY_ORDER) {
    const count = type.slots[category as Category] ?? 0;
    if (count === 0) continue;
    const pool = eligible.filter((ex) => ex.category === category);
    chosen.push(...sampleWeighted(pool, weights, count, rng));
  }

  return {
    type: typeKey,
    biases,
    sets: type.sets,
    composition: chosen.map((ex, slot) => ({
      exerciseId: ex.id,
      category: ex.category,
      slot,
    })),
  };
}

/**
 * Expand a generated composition into the interleaved per-set logging order.
 * e.g. standard 2-set => [major, minor, dynamic, static, major, minor, dynamic, static].
 * Returns one entry per (set, exercise) pair.
 */
export function expandToSets(
  workout: GeneratedWorkout,
): { exerciseId: string; category: Category; setNumber: number }[] {
  const out: { exerciseId: string; category: Category; setNumber: number }[] =
    [];
  for (let set = 1; set <= workout.sets; set++) {
    for (const item of workout.composition) {
      out.push({
        exerciseId: item.exerciseId,
        category: item.category,
        setNumber: set,
      });
    }
  }
  return out;
}
