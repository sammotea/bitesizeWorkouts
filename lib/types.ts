// ── Core domain types ───────────────────────────────────────────────────────

/** Pure movement taxonomy — drives metrics and workout category slots. */
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

/**
 * Selection weighting within a pool.
 * 5 = strongly preferred … 1 = strongly disliked; "always" = pinned — chosen
 * before weighted sampling (pins compete if they exceed the slot count).
 */
export type Weighting = 1 | 2 | 3 | 4 | 5 | "always";

/**
 * Role membership + weighting, one entry per selection pool.
 * Presence = membership: an exercise without `workout` never appears in
 * generated workouts; without `dailyRehab` it never appears in the tracker.
 */
export interface ExercisePools {
  /** Main bitesize-workout draw (via its category slot). */
  workout?: Weighting;
  /** Candidate for the workout's rehab slot. */
  workoutRehab?: Weighting;
  /** Candidate for the piecemeal daily rehab tracker. */
  dailyRehab?: Weighting;
}

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
  pools: ExercisePools;
  bookRef?: BookRef;
}

/** Which metrics a category logs. Derived from the category, not stored. */
export type MetricType = "strength" | "stretch" | "mobilisation";

export interface WorkoutType {
  key: "standard" | "fatigued" | "energised" | "stretches";
  label: string;
  /** How many of each category to draw (from the `workout` pool). */
  slots: Partial<Record<Category, number>>;
  /** How many rehab-role picks to draw (from the `workoutRehab` pool). */
  rehabSlots: number;
  /** Sets for the repeated circuit (strength/dynamic/rehab picks). Tail
   *  categories (static/mobilisation) always run a single set — see
   *  expandWorkout(). */
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
  /** Set when this pick fills the workout's rehab slot (badged in the UI). */
  role?: "rehab";
}

export interface GeneratedWorkout {
  type: WorkoutType["key"];
  biases: Biases;
  sets: number;
  /** Ordered, one entry per exercise (single set). */
  composition: CompositionItem[];
}

// ── Daily rehab tracker ──────────────────────────────────────────────────────

/** One day's rehab program + tick state. Date is the client's local day. */
export interface RehabDay {
  date: string; // YYYY-MM-DD
  exerciseIds: string[];
  /** Per exercise: one boolean per set. */
  progress: Record<string, boolean[]>;
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
