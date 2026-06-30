"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useSession, logKey } from "@/lib/store";
import { getExercise } from "@/data/exercises";
import { CATEGORY_LABELS, WORKOUT_TYPES } from "@/lib/constants";
import { metricFields, formatBookRef } from "@/lib/format";
import type { SetLog } from "@/lib/types";
import Button from "./Button";

export default function LoggingView() {
  const router = useRouter();
  const { workout, logs, prevRecords, updateLog, reset } = useSession();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!workout) return null;
  const type = WORKOUT_TYPES[workout.type];

  // Interleaved per-set order: set 1 [all exercises], set 2 [all exercises]...
  const rows: { exerciseId: string; setNumber: number; idx: number }[] = [];
  let idx = 0;
  for (let setNo = 1; setNo <= workout.sets; setNo++) {
    for (const item of workout.composition) {
      rows.push({ exerciseId: item.exerciseId, setNumber: setNo, idx: idx++ });
    }
  }

  async function finish() {
    if (!workout) return;
    setSaving(true);
    setError(null);

    const setLogs: SetLog[] = [];
    for (let setNo = 1; setNo <= workout.sets; setNo++) {
      for (const item of workout.composition) {
        const entry = logs[logKey(item.exerciseId, setNo)];
        const weight = parseNum(entry?.weight);
        const reps = parseNum(entry?.reps);
        const durationSec = parseNum(entry?.durationSec);
        // Empty set => not done.
        const completed =
          weight !== null || reps !== null || durationSec !== null;
        setLogs.push({
          exerciseId: item.exerciseId,
          setNumber: setNo,
          weight,
          reps,
          durationSec,
          completed,
        });
      }
    }

    try {
      const res = await fetch("/api/workouts", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-app-secret": process.env.NEXT_PUBLIC_APP_SECRET ?? "",
        },
        body: JSON.stringify({
          type: workout.type,
          biases: workout.biases,
          composition: workout.composition,
          sets: setLogs,
        }),
      });
      if (!res.ok) throw new Error(`Save failed (${res.status})`);
      const { id } = await res.json();
      reset();
      router.push(`/history/${id}`);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not save workout.");
      setSaving(false);
    }
  }

  return (
    <div className="flex flex-col gap-5">
      <div className="flex items-start justify-between">
        <div>
          <div className="text-xs font-semibold uppercase tracking-widest text-charcoal-soft">
            {type.label} · {workout.sets} {workout.sets === 1 ? "set" : "sets"}
          </div>
          <h1 className="mt-1 font-display text-4xl font-extrabold uppercase">
            In Progress
          </h1>
        </div>
        <button
          onClick={reset}
          className="text-xs font-semibold uppercase tracking-widest text-charcoal-soft hover:text-charcoal"
        >
          Cancel
        </button>
      </div>

      <ol className="flex flex-col gap-3">
        {rows.map((row) => {
          const ex = getExercise(row.exerciseId);
          if (!ex) return null;
          const fields = metricFields(ex.category);
          const prev = prevRecords[row.exerciseId];
          const key = logKey(row.exerciseId, row.setNumber);
          const entry = logs[key] ?? { weight: "", reps: "", durationSec: "" };
          const ref = formatBookRef(ex.bookRef);

          return (
            <li
              key={key}
              className="rounded-3xl border border-line bg-cream-deep p-4 transition-colors focus-within:border-mint-deep focus-within:bg-mint"
            >
              <div className="mb-3 flex items-baseline justify-between gap-2">
                <div className="min-w-0">
                  <div className="font-display text-xl font-bold leading-tight">
                    {ex.name}
                  </div>
                  <div className="text-xs text-charcoal-soft">
                    {CATEGORY_LABELS[ex.category]}
                    {ref ? ` · ${ref}` : ""}
                  </div>
                </div>
                <div className="shrink-0 rounded-full bg-white/70 px-2.5 py-1 text-[0.7rem] font-bold uppercase tracking-widest text-charcoal-soft">
                  Set {row.setNumber}
                </div>
              </div>

              <div className="flex gap-3">
                {fields.map((f) => {
                  const placeholder =
                    prev && prev[f.key] != null ? String(prev[f.key]) : "—";
                  return (
                    <label key={f.key} className="flex-1">
                      <span className="mb-1 block text-[0.7rem] font-semibold uppercase tracking-widest text-charcoal-soft">
                        {f.label}
                        {f.unit ? ` (${f.unit})` : ""}
                      </span>
                      <input
                        type="number"
                        inputMode="decimal"
                        value={entry[f.key]}
                        placeholder={placeholder}
                        onChange={(e) =>
                          updateLog(key, f.key, e.target.value)
                        }
                        className="w-full rounded-xl border border-line bg-white/80 px-3 py-2.5 font-display text-2xl font-bold tabular-nums outline-none transition placeholder:font-body placeholder:text-lg placeholder:font-normal placeholder:text-charcoal-soft/50 focus:border-charcoal"
                      />
                    </label>
                  );
                })}
              </div>
            </li>
          );
        })}
      </ol>

      {error && (
        <p className="rounded-xl bg-red-100 px-4 py-3 text-sm text-red-800">
          {error}
        </p>
      )}

      <Button onClick={finish} disabled={saving} className="w-full py-4 text-base">
        {saving ? "Saving…" : "Finished Workout"}
      </Button>
    </div>
  );
}

function parseNum(v: string | undefined): number | null {
  if (v == null || v.trim() === "") return null;
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
}
