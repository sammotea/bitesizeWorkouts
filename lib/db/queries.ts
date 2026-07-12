import { desc, eq, inArray } from "drizzle-orm";
import { getDb } from "./index";
import { rehabDays, setLogs, workouts } from "./schema";
import { generateRehabProgram } from "@/lib/generator";
import { REHAB_HOLD, REHAB_TRACKER } from "@/lib/constants";
import type {
  Biases,
  CompositionItem,
  PreviousRecord,
  RehabDay,
  SetLog,
  WorkoutType,
} from "@/lib/types";

export interface SaveWorkoutInput {
  type: WorkoutType["key"];
  biases: Biases;
  composition: CompositionItem[];
  sets: SetLog[];
  comment: string | null;
  maxHeartRate: number | null;
}

export async function saveWorkout(input: SaveWorkoutInput): Promise<string> {
  const db = getDb();
  const [workout] = await db
    .insert(workouts)
    .values({
      type: input.type,
      biases: input.biases,
      composition: input.composition,
      finished: true,
      comment: input.comment,
      maxHeartRate: input.maxHeartRate,
    })
    .returning({ id: workouts.id });

  if (input.sets.length > 0) {
    await db.insert(setLogs).values(
      input.sets.map((s) => ({
        workoutId: workout.id,
        exerciseId: s.exerciseId,
        setNumber: s.setNumber,
        weight: s.weight != null ? String(s.weight) : null,
        reps: s.reps,
        durationSec: s.durationSec,
        completed: s.completed,
      })),
    );
  }

  return workout.id;
}

export async function listWorkouts() {
  const db = getDb();
  return db
    .select()
    .from(workouts)
    .orderBy(desc(workouts.performedAt))
    .limit(200);
}

export async function getWorkout(id: string) {
  const db = getDb();
  const [workout] = await db
    .select()
    .from(workouts)
    .where(eq(workouts.id, id));
  if (!workout) return null;

  const sets = await db
    .select()
    .from(setLogs)
    .where(eq(setLogs.workoutId, id))
    .orderBy(setLogs.setNumber);

  return { workout, sets };
}

/** All logged sets for one exercise, newest first, joined to workout date. */
export async function getExerciseHistory(exerciseId: string) {
  const db = getDb();
  return db
    .select({
      setId: setLogs.id,
      workoutId: setLogs.workoutId,
      setNumber: setLogs.setNumber,
      weight: setLogs.weight,
      reps: setLogs.reps,
      durationSec: setLogs.durationSec,
      completed: setLogs.completed,
      performedAt: workouts.performedAt,
      workoutType: workouts.type,
    })
    .from(setLogs)
    .innerJoin(workouts, eq(setLogs.workoutId, workouts.id))
    .where(eq(setLogs.exerciseId, exerciseId))
    .orderBy(desc(workouts.performedAt), setLogs.setNumber);
}

/**
 * Latest non-null value per field, per exercise — used to placeholder inputs.
 * For each field we independently take the most recent completed set that has
 * a value (so a blank latest set doesn't erase a usable placeholder).
 */
export async function getPreviousRecords(
  ids: string[],
): Promise<Record<string, PreviousRecord>> {
  const result: Record<string, PreviousRecord> = {};
  if (ids.length === 0) return result;

  const db = getDb();
  const rows = await db
    .select({
      exerciseId: setLogs.exerciseId,
      weight: setLogs.weight,
      reps: setLogs.reps,
      durationSec: setLogs.durationSec,
      completed: setLogs.completed,
      performedAt: workouts.performedAt,
    })
    .from(setLogs)
    .innerJoin(workouts, eq(setLogs.workoutId, workouts.id))
    .where(inArray(setLogs.exerciseId, ids))
    .orderBy(desc(workouts.performedAt));

  for (const id of ids) {
    result[id] = { weight: null, reps: null, durationSec: null };
  }

  // rows are newest-first; first non-null wins per field.
  for (const row of rows) {
    if (!row.completed) continue;
    const rec = result[row.exerciseId];
    if (!rec) continue;
    if (rec.weight === null && row.weight != null) rec.weight = Number(row.weight);
    if (rec.reps === null && row.reps != null) rec.reps = row.reps;
    if (rec.durationSec === null && row.durationSec != null)
      rec.durationSec = row.durationSec;
  }

  return result;
}

// ── Daily rehab tracker ──────────────────────────────────────────────────────

function toRehabDay(row: typeof rehabDays.$inferSelect): RehabDay {
  return {
    date: row.date,
    exerciseIds: row.exerciseIds,
    progress: row.progress,
  };
}

/** Read-only peek (used by the landing page) — never creates a row. */
export async function getRehabDay(date: string): Promise<RehabDay | null> {
  const db = getDb();
  const [row] = await db
    .select()
    .from(rehabDays)
    .where(eq(rehabDays.date, date));
  return row ? toRehabDay(row) : null;
}

/**
 * Get the day's program, generating + persisting it on first request.
 * Persisted picks keep the day identical across devices and immune to
 * mid-day library edits.
 */
export async function getOrCreateRehabDay(date: string): Promise<RehabDay> {
  const existing = await getRehabDay(date);
  if (existing) {
    // Backfill the special daily hold for days created before it existed.
    if (!(REHAB_HOLD.key in existing.progress)) {
      const progress = { ...existing.progress, [REHAB_HOLD.key]: [false] };
      const db = getDb();
      await db
        .update(rehabDays)
        .set({ progress })
        .where(eq(rehabDays.date, date));
      return { ...existing, progress };
    }
    return existing;
  }

  const exerciseIds = generateRehabProgram();
  const progress: Record<string, boolean[]> = Object.fromEntries(
    exerciseIds.map((id) => [id, Array(REHAB_TRACKER.sets).fill(false)]),
  );
  progress[REHAB_HOLD.key] = [false];

  const db = getDb();
  await db
    .insert(rehabDays)
    .values({ date, exerciseIds, progress })
    .onConflictDoNothing(); // lost race → the other insert wins

  return (await getRehabDay(date))!;
}

/** Toggle one set tick; returns the updated day (null if day/exercise unknown). */
export async function setRehabTick(
  date: string,
  exerciseId: string,
  setIndex: number,
  done: boolean,
): Promise<RehabDay | null> {
  const day = await getRehabDay(date);
  if (!day) return null;
  const ticks = day.progress[exerciseId];
  if (!ticks || setIndex < 0 || setIndex >= ticks.length) return null;

  const progress = {
    ...day.progress,
    [exerciseId]: ticks.map((t, i) => (i === setIndex ? done : t)),
  };

  const db = getDb();
  await db
    .update(rehabDays)
    .set({ progress })
    .where(eq(rehabDays.date, date));

  return { ...day, progress };
}
