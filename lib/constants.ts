import type {
  BodyPart,
  Category,
  MetricType,
  Weighting,
  WorkoutType,
} from "./types";

export const CATEGORY_LABELS: Record<Category, string> = {
  major: "Major strength",
  minor: "Minor strength",
  dynamic: "Dynamic stretch",
  static: "Static stretch",
  mobilisation: "Mobilisation",
};

export const BODY_PARTS: BodyPart[] = [
  "neck",
  "shoulders",
  "chest",
  "back",
  "arms",
  "core",
  "upper-leg",
  "lower-leg",
];

export const BODY_PART_LABELS: Record<BodyPart, string> = {
  neck: "Neck",
  shoulders: "Shoulders",
  chest: "Chest",
  back: "Back",
  arms: "Arms",
  core: "Core",
  "upper-leg": "Upper leg",
  "lower-leg": "Lower leg",
};

/** Metric set is derived from the exercise's category. */
export const CATEGORY_METRIC: Record<Category, MetricType> = {
  major: "strength",
  minor: "strength",
  dynamic: "stretch",
  static: "stretch",
  mobilisation: "mobilisation",
};

// Every type draws `rehabSlots` picks from the workoutRehab pool in addition
// to its category slots. static/mobilisation are "tail" categories — placed
// once at the end, single set (see expandWorkout).
export const WORKOUT_TYPES: Record<WorkoutType["key"], WorkoutType> = {
  standard: {
    key: "standard",
    label: "Standard",
    slots: { major: 1, minor: 1, dynamic: 1, static: 1 },
    rehabSlots: 1,
    sets: 2,
  },
  fatigued: {
    key: "fatigued",
    label: "Fatigued",
    slots: { major: 1, minor: 1, dynamic: 1, static: 1 },
    rehabSlots: 1,
    sets: 1,
  },
  energised: {
    key: "energised",
    label: "Energised",
    slots: { major: 2, minor: 2, dynamic: 1, static: 1 },
    rehabSlots: 1,
    sets: 2,
  },
  stretches: {
    key: "stretches",
    label: "Stretches only",
    slots: { dynamic: 2, static: 2, mobilisation: 1 },
    rehabSlots: 1,
    sets: 1,
  },
};

/** Order categories appear within a single set (composition order). */
export const CATEGORY_ORDER: Category[] = [
  "major",
  "minor",
  "dynamic",
  "static",
  "mobilisation",
];

/** Categories that repeat once per set (the circuit). Rehab-slot picks repeat
 *  with the circuit too, positioned after dynamic. */
export const REPEATED_CATEGORIES: Category[] = ["major", "minor", "dynamic"];

/** Categories placed once at the very end, single set (the cooldown tail). */
export const TAIL_CATEGORIES: Category[] = ["static", "mobilisation"];

// ── Daily rehab tracker ──────────────────────────────────────────────────────

/** Shape of each day's tracker program (tunable). */
export const REHAB_TRACKER = { exercises: 3, sets: 3 };

// ── Selection weighting (tunable) ────────────────────────────────────────────

/** Relative likelihood multiplier per 1–5 weighting ("always" pins instead). */
export const PREFERENCE_WEIGHT: Record<Exclude<Weighting, "always">, number> = {
  1: 0.15, // strongly disliked — rare but not impossible
  2: 0.5,
  3: 1, // neutral
  4: 2.5,
  5: 5, // strongly preferred
};

/** Multiplier applied when an exercise matches a Focus body part. */
export const FOCUS_BOOST = 4;
