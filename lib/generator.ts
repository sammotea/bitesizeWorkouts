import { EXERCISES } from "@/data/exercises";
import {
  CATEGORY_ORDER,
  FOCUS_BOOST,
  PREFERENCE_WEIGHT,
  REPEATED_CATEGORIES,
  TAIL_CATEGORIES,
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

/** One (exercise, set) entry in logging/save order. */
export interface WorkoutSlot {
  exerciseId: string;
  category: Category;
  setNumber: number;
}

/**
 * Expand a workout into the ordered (exercise, set) list used by logging,
 * saving, and history. The single source of truth for set count + order:
 *   - Repeated categories (strength/dynamic/rehab) run the circuit `sets` times,
 *     interleaved (all exercises set 1, then all set 2, …).
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
      out.push({ exerciseId: it.exerciseId, category: it.category, setNumber: set });
    }
  }
  for (const it of tail) {
    out.push({ exerciseId: it.exerciseId, category: it.category, setNumber: 1 });
  }
  return out;
}
