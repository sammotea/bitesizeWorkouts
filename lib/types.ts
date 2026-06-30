// ── Core domain types ───────────────────────────────────────────────────────

export type Category =
  | "major"
  | "minor"
  | "dynamic"
  | "static"
  | "mobilisation";

/** 8-part body taxonomy used for Avoid/Focus biases. */
export type BodyPart =
  | "neck"
  | "shoulders"
  | "chest"
  | "back"
  | "arms" // absorbs forearms/wrists
  | "core"
  | "upper-leg" // absorbs hips/glutes/quads/hamstrings
  | "lower-leg"; // absorbs calves/ankles

/** 5 = strongly preferred … 1 = strongly disliked. 3 = neutral default. */
export type Preference = 1 | 2 | 3 | 4 | 5;

export interface BookRef {
  title: string;
  page: number;
}

export interface Exercise {
  /** Stable, unique, opaque id — NOT derived from the name. */
  id: string;
  /** Freely editable label; may change beyond recognition. */
  name: string;
  category: Category;
  bodyParts: BodyPart[];
  preference: Preference;
  bookRef?: BookRef;
}

/** Which metrics a category logs. Derived from the category, not stored. */
export type MetricType = "strength" | "stretch" | "mobilisation";

export interface WorkoutType {
  key: "standard" | "fatigued" | "energised" | "rehab";
  label: string;
  /** How many of each category to draw. */
  slots: Partial<Record<Category, number>>;
  sets: number;
}

export interface Biases {
  avoid: BodyPart[];
  focus: BodyPart[];
}

/** One chosen exercise occupying a slot in a generated workout. */
export interface CompositionItem {
  exerciseId: string;
  category: Category;
  /** Slot ordering index within a single set. */
  slot: number;
}

export interface GeneratedWorkout {
  type: WorkoutType["key"];
  biases: Biases;
  sets: number;
  /** Ordered, one entry per exercise (single set). */
  composition: CompositionItem[];
}

// ── Logging / persistence shapes ─────────────────────────────────────────────

export interface SetLog {
  exerciseId: string;
  setNumber: number;
  weight: number | null;
  reps: number | null;
  durationSec: number | null;
  completed: boolean;
}

export interface SavedWorkout {
  id: string;
  performedAt: string;
  type: WorkoutType["key"];
  biases: Biases;
  composition: CompositionItem[];
  finished: boolean;
}

/** Latest recorded value for an exercise, used to placeholder inputs. */
export interface PreviousRecord {
  weight: number | null;
  reps: number | null;
  durationSec: number | null;
}
