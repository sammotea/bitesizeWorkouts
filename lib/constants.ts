import type {
  BodyPart,
  Category,
  MetricType,
  Preference,
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

export const WORKOUT_TYPES: Record<WorkoutType["key"], WorkoutType> = {
  standard: {
    key: "standard",
    label: "Standard",
    slots: { major: 1, minor: 1, dynamic: 1, static: 1 },
    sets: 2,
  },
  fatigued: {
    key: "fatigued",
    label: "Fatigued",
    slots: { major: 1, minor: 1, dynamic: 1, static: 1 },
    sets: 1,
  },
  energised: {
    key: "energised",
    label: "Energised",
    slots: { major: 2, minor: 2, dynamic: 1, static: 1 },
    sets: 2,
  },
  rehab: {
    key: "rehab",
    label: "Rehab only",
    slots: { minor: 1, dynamic: 1, static: 1, mobilisation: 1 },
    sets: 1,
  },
};

/** Short abbreviations for compact slot summaries (e.g. "1Maj 1Min"). */
export const CATEGORY_ABBR: Record<Category, string> = {
  major: "Maj",
  minor: "Min",
  dynamic: "Dyn",
  static: "Sta",
  mobilisation: "Mob",
};

/** Order categories appear within a single set. */
export const CATEGORY_ORDER: Category[] = [
  "major",
  "minor",
  "dynamic",
  "static",
  "mobilisation",
];

// ── Generator weighting (tunable) ────────────────────────────────────────────

/** Relative likelihood multiplier per preference grade. */
export const PREFERENCE_WEIGHT: Record<Preference, number> = {
  1: 0.15, // strongly disliked — rare but not impossible
  2: 0.5,
  3: 1, // neutral
  4: 2.5,
  5: 5, // strongly preferred
};

/** Multiplier applied when an exercise matches a Focus body part. */
export const FOCUS_BOOST = 4;
