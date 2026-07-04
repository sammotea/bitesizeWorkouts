import type { Exercise } from "@/lib/types";

/**
 * The exercise library — the single source the generator reads.
 *
 * EDIT THIS FILE BY HAND to:
 *  - rename exercises (the `id` stays fixed, so history is never broken)
 *  - set `preference` (1 = strongly disliked … 3 = neutral … 5 = strongly preferred)
 *  - refine `bodyParts` (used by the Avoid / Focus biases)
 *
 * `id` values are opaque and must remain stable + unique. Never reuse an id.
 * Book page references are from "Becoming a Supple Leopard" (Kelly Starrett).
 */
const SL = "Supple Leopard";

export const EXERCISES: Exercise[] = [
  // ── Major strength ─────────────────────────────────────────────────────────
  { id: "ex_001", name: "Squat", category: "major", bodyParts: ["upper-leg"], preference: 3 },
  { id: "ex_002", name: "Bulgarian split squat", category: "major", bodyParts: ["upper-leg"], preference: 4 },
  { id: "ex_003", name: "Incline row", category: "major", bodyParts: ["back", "arms"], preference: 4 },
  { id: "ex_005", name: "Dumbbell pullover", category: "major", bodyParts: ["chest", "back"], preference: 2 },
  { id: "ex_006", name: "Seated tricep press", category: "major", bodyParts: ["arms"], preference: 3 },
  { id: "ex_007", name: "Hammer curl", category: "major", bodyParts: ["arms"], preference: 2 },
  { id: "ex_008", name: "Kettlebell swings", category: "major", bodyParts: ["upper-leg", "back", "core"], preference: 3 },
  { id: "ex_068", name: "Bicep curl", category: "major", bodyParts: ["arms"], preference: 4 },
  { id: "ex_069", name: "One-arm shoulder press", category: "major", bodyParts: ["shoulders"], preference: 4 },

  // ── Minor strength ─────────────────────────────────────────────────────────
  { id: "ex_004", name: "Dumbbell fly", category: "minor", bodyParts: ["chest", "shoulders"], preference: 2 },
  { id: "ex_009", name: "Calf raise", category: "minor", bodyParts: ["lower-leg"], preference: 3 },
  { id: "ex_010", name: "Shrug", category: "minor", bodyParts: ["shoulders", "back"], preference: 4 },
  { id: "ex_013", name: "Front raise", category: "minor", bodyParts: ["shoulders"], preference: 4 },
  { id: "ex_014", name: "Side raise", category: "minor", bodyParts: ["shoulders"], preference: 4 },
  { id: "ex_015", name: "Scapula press", category: "minor", bodyParts: ["shoulders", "back"], preference: 1 },
  { id: "ex_016", name: "Rotator cuff", category: "minor", bodyParts: ["shoulders"], preference: 3 },
  { id: "ex_017", name: "Seated Russian twist", category: "minor", bodyParts: ["core"], preference: 2 },
  { id: "ex_018", name: "Raised heel lunge", category: "minor", bodyParts: ["upper-leg"], preference: 4 },
  { id: "ex_019", name: "Wrist curl", category: "minor", bodyParts: ["arms"], preference: 4 },
  { id: "ex_020", name: "Single leg RDL", category: "minor", bodyParts: ["upper-leg", "back"], preference: 4 },
  { id: "ex_021", name: "Standing hip rotation aeroplanes", category: "minor", bodyParts: ["upper-leg", "core"], preference: 4 },
  { id: "ex_022", name: "Curtsey squat", category: "minor", bodyParts: ["upper-leg"], preference: 4 },
  { id: "ex_023", name: "Extended lunge", category: "minor", bodyParts: ["upper-leg"], preference: 4 },
  { id: "ex_024", name: "Prone TYI", category: "minor", bodyParts: ["shoulders", "back"], preference: 4 },
  { id: "ex_026", name: "Supraspinatus lateral raise", category: "minor", bodyParts: ["shoulders"], preference: 3 },
  { id: "ex_027", name: "Prone scapular retraction", category: "minor", bodyParts: ["back", "shoulders"], preference: 3 },
  { id: "ex_028", name: "Prone rotator cuff rotation", category: "minor", bodyParts: ["shoulders"], preference: 3 },
  { id: "ex_029", name: "Bench pigeon raise", category: "minor", bodyParts: ["upper-leg"], preference: 2 },
  { id: "ex_030", name: "Hip rotator", category: "minor", bodyParts: ["upper-leg"], preference: 4 },

  // ── Dynamic stretches ──────────────────────────────────────────────────────
  { id: "ex_025", name: "Clam", category: "dynamic", bodyParts: ["upper-leg"], preference: 4 },
  { id: "ex_031", name: "Good morning", category: "dynamic", bodyParts: ["back", "upper-leg"], preference: 5 },
  { id: "ex_032", name: "Rolling knees", category: "dynamic", bodyParts: ["upper-leg"], preference: 2 },
  { id: "ex_033", name: "Thread the needle", category: "dynamic", bodyParts: ["back", "shoulders"], preference: 2 },
  { id: "ex_034", name: "Head circles", category: "dynamic", bodyParts: ["neck"], preference: 3 },
  { id: "ex_035", name: "Scapular wall slides", category: "dynamic", bodyParts: ["shoulders", "back"], preference: 3 },
  { id: "ex_036", name: "Alternating cossack squats", category: "dynamic", bodyParts: ["upper-leg"], preference: 4 },
  { id: "ex_037", name: "Frog squat", category: "dynamic", bodyParts: ["upper-leg"], preference: 3 },
  { id: "ex_039", name: "Forward-back ankle flexion", category: "dynamic", bodyParts: ["lower-leg"], preference: 2 },
  { id: "ex_040", name: "Bent knee scythes", category: "dynamic", bodyParts: ["upper-leg"], preference: 3 },
  { id: "ex_051", name: "End-range hip flexion", category: "dynamic", bodyParts: ["upper-leg"], preference: 3 },

  // ── Rehab ──────────────────────────────────────────────────────────────────
  { id: "ex_038", name: "1-2-5 ankle flexion", category: "rehab", bodyParts: ["lower-leg"], preference: 5 },
  { id: "ex_050", name: "Ankle mobility heel raise", category: "rehab", bodyParts: ["lower-leg"], preference: 5 },

  // ── Static stretches ───────────────────────────────────────────────────────
  { id: "ex_041", name: "Piriformis stretch", category: "static", bodyParts: ["upper-leg"], preference: 3 },
  { id: "ex_042", name: "Levator scapulae", category: "static", bodyParts: ["neck", "shoulders"], preference: 3 },
  { id: "ex_043", name: "Child pose", category: "static", bodyParts: ["back", "shoulders"], preference: 3 },
  { id: "ex_044", name: "Ankle sit", category: "static", bodyParts: ["lower-leg"], preference: 3 },
  { id: "ex_045", name: "Couch stretch", category: "static", bodyParts: ["upper-leg"], preference: 3, bookRef: { title: SL, page: 391 } },
  { id: "ex_046", name: "Double-leg plantarflexion", category: "static", bodyParts: ["lower-leg"], preference: 3, bookRef: { title: SL, page: 423 } },
  { id: "ex_047", name: "Toe dorsiflexion", category: "static", bodyParts: ["lower-leg"], preference: 3, bookRef: { title: SL, page: 441 } },
  { id: "ex_048", name: "Toe plantarflexion", category: "static", bodyParts: ["lower-leg"], preference: 3, bookRef: { title: SL, page: 441 } },

  // ── Mobilisations ──────────────────────────────────────────────────────────
  { id: "ex_049", name: "Tibia stretch", category: "mobilisation", bodyParts: ["lower-leg"], preference: 3 },
  { id: "ex_052", name: "Overhead rib mobilisation", category: "mobilisation", bodyParts: ["chest", "back", "shoulders"], preference: 3, bookRef: { title: SL, page: 301 } },
  { id: "ex_053", name: "Trap scrub", category: "mobilisation", bodyParts: ["shoulders", "back"], preference: 3, bookRef: { title: SL, page: 304 } },
  { id: "ex_054", name: "Shoulder rotator smash and floss", category: "mobilisation", bodyParts: ["shoulders"], preference: 3, bookRef: { title: SL, page: 312 } },
  { id: "ex_055", name: "Blue Angel", category: "mobilisation", bodyParts: ["shoulders", "chest"], preference: 3, bookRef: { title: SL, page: 324 } },
  { id: "ex_056", name: "Banded single-leg flexion", category: "mobilisation", bodyParts: ["upper-leg"], preference: 3, bookRef: { title: SL, page: 370 } },
  { id: "ex_057", name: "Hip external rotation with flexion", category: "mobilisation", bodyParts: ["upper-leg"], preference: 3, bookRef: { title: SL, page: 373 } },
  { id: "ex_058", name: "Hip capsule mobilization", category: "mobilisation", bodyParts: ["upper-leg"], preference: 3, bookRef: { title: SL, page: 379 } },
  { id: "ex_059", name: "Suprapatellar smash", category: "mobilisation", bodyParts: ["upper-leg"], preference: 3, bookRef: { title: SL, page: 388 } },
  { id: "ex_060", name: "Quad smash", category: "mobilisation", bodyParts: ["upper-leg"], preference: 3, bookRef: { title: SL, page: 388 } },
  { id: "ex_061", name: "Knee voodoo", category: "mobilisation", bodyParts: ["upper-leg"], preference: 3, bookRef: { title: SL, page: 389 } },
  { id: "ex_062", name: "Reverse ballerina", category: "mobilisation", bodyParts: ["lower-leg"], preference: 3, bookRef: { title: SL, page: 395 } },
  { id: "ex_063", name: "Olympic wall squat", category: "mobilisation", bodyParts: ["upper-leg"], preference: 3, bookRef: { title: SL, page: 401 } },
  { id: "ex_064", name: "Knee gap", category: "mobilisation", bodyParts: ["upper-leg"], preference: 3, bookRef: { title: SL, page: 415 } },
  { id: "ex_065", name: "Voodoo calf mobilization", category: "mobilisation", bodyParts: ["lower-leg"], preference: 3, bookRef: { title: SL, page: 428 } },
  { id: "ex_066", name: "Classic calf mobilization with distraction", category: "mobilisation", bodyParts: ["lower-leg"], preference: 3, bookRef: { title: SL, page: 429 } },
  { id: "ex_067", name: "Banded heel cord (anterior bias)", category: "mobilisation", bodyParts: ["lower-leg"], preference: 3, bookRef: { title: SL, page: 430 } },
];

/** Fast lookup by id. */
export const EXERCISE_BY_ID: Record<string, Exercise> = Object.fromEntries(
  EXERCISES.map((e) => [e.id, e]),
);

export function getExercise(id: string): Exercise | undefined {
  return EXERCISE_BY_ID[id];
}
