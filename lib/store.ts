"use client";

import { create } from "zustand";
import { generateWorkout, expandWorkout } from "./generator";
import type {
  Biases,
  BodyPart,
  GeneratedWorkout,
  PreviousRecord,
  WorkoutType,
} from "./types";

export type Phase = "generator" | "logging";

export interface LogEntry {
  weight: string;
  reps: string;
  durationSec: string;
}

/** key = `${exerciseId}:${setNumber}` */
export function logKey(exerciseId: string, setNumber: number): string {
  return `${exerciseId}:${setNumber}`;
}

/** A single bias row in the modifier UI. `part: null` is an empty draft row. */
export interface BiasRow {
  kind: "focus" | "avoid";
  part: BodyPart | null;
}

const emptyRow = (): BiasRow => ({ kind: "focus", part: null });

/** Collapse the UI rows into the generator's Biases shape (deduped). */
function deriveBiases(rows: BiasRow[]): Biases {
  const focus: BodyPart[] = [];
  const avoid: BodyPart[] = [];
  for (const r of rows) {
    if (!r.part) continue;
    (r.kind === "focus" ? focus : avoid).push(r.part);
  }
  return { focus: [...new Set(focus)], avoid: [...new Set(avoid)] };
}

/** Roll a fresh workout for the current type + bias rows. */
function roll(typeKey: WorkoutType["key"], rows: BiasRow[]): GeneratedWorkout {
  return generateWorkout(typeKey, deriveBiases(rows));
}

interface SessionState {
  phase: Phase;
  typeKey: WorkoutType["key"];
  biasRows: BiasRow[];
  workout: GeneratedWorkout | null;
  prevRecords: Record<string, PreviousRecord>;
  logs: Record<string, LogEntry>;
  saving: boolean;

  /** Toggle a non-standard type; clicking the active one reverts to standard. */
  toggleType: (key: WorkoutType["key"]) => void;
  setBiasKind: (index: number, kind: "focus" | "avoid") => void;
  setBiasPart: (index: number, part: BodyPart) => void;
  removeBias: (index: number) => void;
  clearBiases: () => void;
  /** Re-roll a fresh workout with the current type + biases. */
  regenerate: () => void;
  /** Generate an initial workout on first load if none exists yet. */
  ensureWorkout: () => void;
  accept: () => Promise<void>;
  updateLog: (key: string, field: keyof LogEntry, value: string) => void;
  reset: () => void;
}

export const useSession = create<SessionState>((set, get) => ({
  phase: "generator",
  typeKey: "standard",
  biasRows: [emptyRow()],
  workout: null,
  prevRecords: {},
  logs: {},
  saving: false,

  toggleType: (key) =>
    set((s) => {
      const typeKey = s.typeKey === key ? "standard" : key;
      return { typeKey, workout: roll(typeKey, s.biasRows) };
    }),

  setBiasKind: (index, kind) =>
    set((s) => {
      const rows = s.biasRows.map((r, i) => (i === index ? { ...r, kind } : r));
      // Toggling +/- on an empty draft row doesn't change the biases, so
      // don't re-roll the workout — only regenerate when a part is selected.
      if (rows[index].part === null) return { biasRows: rows };
      return {
        biasRows: rows,
        workout: roll(s.typeKey, rows),
      };
    }),

  setBiasPart: (index, part) =>
    set((s) => {
      const rows = s.biasRows.map((r, i) =>
        i === index ? { ...r, part } : r,
      );
      // Selecting a part in the last row reveals a fresh draft row.
      if (index === rows.length - 1) rows.push(emptyRow());
      return {
        biasRows: rows,
        workout: roll(s.typeKey, rows),
      };
    }),

  removeBias: (index) =>
    set((s) => {
      const filtered = s.biasRows.filter((_, i) => i !== index);
      // Always keep at least one (draft) row visible.
      const rows = filtered.length > 0 ? filtered : [emptyRow()];
      return {
        biasRows: rows,
        workout: roll(s.typeKey, rows),
      };
    }),

  clearBiases: () =>
    set((s) => {
      const rows = [emptyRow()];
      return {
        biasRows: rows,
        workout: roll(s.typeKey, rows),
      };
    }),

  regenerate: () =>
    set((s) => ({ workout: roll(s.typeKey, s.biasRows), phase: "generator" })),

  ensureWorkout: () => {
    if (!get().workout) get().regenerate();
  },

  accept: async () => {
    const { workout } = get();
    if (!workout) return;

    const ids = [...new Set(workout.composition.map((c) => c.exerciseId))];
    let prevRecords: Record<string, PreviousRecord> = {};
    try {
      const res = await fetch(
        `/api/exercises/last?ids=${encodeURIComponent(ids.join(","))}`,
      );
      if (res.ok) prevRecords = await res.json();
    } catch {
      // No history yet / offline — placeholders simply stay empty.
    }

    const logs: Record<string, LogEntry> = {};
    for (const slot of expandWorkout(workout)) {
      logs[logKey(slot.exerciseId, slot.setNumber)] = {
        weight: "",
        reps: "",
        durationSec: "",
      };
    }

    set({ phase: "logging", prevRecords, logs });
  },

  updateLog: (key, field, value) =>
    set((s) => ({
      logs: {
        ...s.logs,
        [key]: { ...s.logs[key], [field]: value },
      },
    })),

  reset: () => {
    // Back to the initial page: standard type, no biases, fresh workout.
    const biasRows = [emptyRow()];
    set({
      phase: "generator",
      typeKey: "standard",
      biasRows,
      workout: roll("standard", biasRows),
      prevRecords: {},
      logs: {},
      saving: false,
    });
  },
}));
