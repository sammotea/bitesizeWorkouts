"use client";

import { create } from "zustand";
import { generateWorkout } from "./generator";
import type {
  Biases,
  BodyPart,
  GeneratedWorkout,
  PreviousRecord,
  WorkoutType,
} from "./types";

export type Phase = "config" | "candidate" | "logging";

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

interface SessionState {
  phase: Phase;
  typeKey: WorkoutType["key"];
  biasRows: BiasRow[];
  workout: GeneratedWorkout | null;
  prevRecords: Record<string, PreviousRecord>;
  logs: Record<string, LogEntry>;
  saving: boolean;

  setType: (key: WorkoutType["key"]) => void;
  setBiasKind: (index: number, kind: "focus" | "avoid") => void;
  setBiasPart: (index: number, part: BodyPart) => void;
  removeBias: (index: number) => void;
  clearBiases: () => void;
  generate: () => void;
  accept: () => Promise<void>;
  updateLog: (key: string, field: keyof LogEntry, value: string) => void;
  reset: () => void;
}

export const useSession = create<SessionState>((set, get) => ({
  phase: "config",
  typeKey: "standard",
  biasRows: [emptyRow()],
  workout: null,
  prevRecords: {},
  logs: {},
  saving: false,

  setType: (key) => set({ typeKey: key }),

  setBiasKind: (index, kind) =>
    set((s) => ({
      biasRows: s.biasRows.map((r, i) => (i === index ? { ...r, kind } : r)),
    })),

  setBiasPart: (index, part) =>
    set((s) => {
      const rows = s.biasRows.map((r, i) =>
        i === index ? { ...r, part } : r,
      );
      // Selecting a part in the last row reveals a fresh draft row.
      if (index === rows.length - 1) rows.push(emptyRow());
      return { biasRows: rows };
    }),

  removeBias: (index) =>
    set((s) => {
      const rows = s.biasRows.filter((_, i) => i !== index);
      // Always keep at least one (draft) row visible.
      return { biasRows: rows.length > 0 ? rows : [emptyRow()] };
    }),

  clearBiases: () => set({ biasRows: [emptyRow()] }),

  generate: () =>
    set((s) => ({
      workout: generateWorkout(s.typeKey, deriveBiases(s.biasRows)),
      phase: "candidate",
    })),

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
    for (let setNo = 1; setNo <= workout.sets; setNo++) {
      for (const item of workout.composition) {
        logs[logKey(item.exerciseId, setNo)] = {
          weight: "",
          reps: "",
          durationSec: "",
        };
      }
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

  reset: () =>
    set({
      phase: "config",
      workout: null,
      prevRecords: {},
      logs: {},
      saving: false,
    }),
}));
