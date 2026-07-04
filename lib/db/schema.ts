import {
  boolean,
  integer,
  jsonb,
  numeric,
  pgTable,
  text,
  timestamp,
  uuid,
} from "drizzle-orm/pg-core";
import type { Biases, CompositionItem, WorkoutType } from "@/lib/types";

export const workouts = pgTable("workouts", {
  id: uuid("id").defaultRandom().primaryKey(),
  performedAt: timestamp("performed_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
  type: text("type").$type<WorkoutType["key"]>().notNull(),
  biases: jsonb("biases").$type<Biases>().notNull(),
  composition: jsonb("composition").$type<CompositionItem[]>().notNull(),
  finished: boolean("finished").default(true).notNull(),
  comment: text("comment"),
  maxHeartRate: integer("max_heart_rate"),
});

export const setLogs = pgTable("set_logs", {
  id: uuid("id").defaultRandom().primaryKey(),
  workoutId: uuid("workout_id")
    .notNull()
    .references(() => workouts.id, { onDelete: "cascade" }),
  exerciseId: text("exercise_id").notNull(),
  setNumber: integer("set_number").notNull(),
  // numeric kept as string by drizzle; we coerce at the edges.
  weight: numeric("weight"),
  reps: integer("reps"),
  durationSec: integer("duration_sec"),
  completed: boolean("completed").default(false).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
});

export type WorkoutRow = typeof workouts.$inferSelect;
export type SetLogRow = typeof setLogs.$inferSelect;
