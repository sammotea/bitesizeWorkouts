"use client";

import { Fragment, useState } from "react";
import { useRouter } from "next/navigation";
import { useSession, logKey } from "@/lib/store";
import { getExercise } from "@/data/exercises";
import { CATEGORY_LABELS, TAIL_CATEGORIES, WORKOUT_TYPES } from "@/lib/constants";
import { metricFields, formatBookRef } from "@/lib/format";
import { expandWorkout, type WorkoutSlot } from "@/lib/generator";
import { getStoredSecret, clearStoredSecret } from "@/lib/session-auth";
import type { SetLog } from "@/lib/types";
import Button from "./Button";
import PasswordForm from "./PasswordForm";

export default function LoggingView() {
  const router = useRouter();
  const { workout, logs, prevRecords, updateLog, reset } = useSession();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [needsPassword, setNeedsPassword] = useState(false);
  const [comment, setComment] = useState("");
  const [maxHeartRate, setMaxHeartRate] = useState("");

  if (!workout) return null;
  const type = WORKOUT_TYPES[workout.type];

  // Circuit repeats per set; static/mobilisation run once at the end.
  const rows = expandWorkout(workout);

  // Finish: save with the stored password, or reveal the password field.
  function finish() {
    const secret = getStoredSecret();
    if (!secret) {
      setNeedsPassword(true);
      return;
    }
    void doSave(secret);
  }

  async function doSave(secret: string) {
    if (!workout) return;
    setSaving(true);
    setError(null);

    // Only persist sets that actually have data — empty sets are skipped.
    const setLogs: SetLog[] = expandWorkout(workout)
      .map((slot) => {
        const entry = logs[logKey(slot.exerciseId, slot.setNumber)];
        return {
          exerciseId: slot.exerciseId,
          setNumber: slot.setNumber,
          weight: parseNum(entry?.weight),
          reps: parseNum(entry?.reps),
          durationSec: parseNum(entry?.durationSec),
          completed: true,
        };
      })
      .filter(
        (s) =>
          s.weight !== null || s.reps !== null || s.durationSec !== null,
      );

    try {
      const res = await fetch("/api/workouts", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-app-secret": secret,
        },
        body: JSON.stringify({
          type: workout.type,
          biases: workout.biases,
          composition: workout.composition,
          sets: setLogs,
          comment: comment.trim() || null,
          maxHeartRate: parseNum(maxHeartRate),
        }),
      });
      if (res.status === 401) {
        clearStoredSecret();
        setError("Wrong password — try again.");
        setNeedsPassword(true);
        setSaving(false);
        return;
      }
      if (!res.ok) throw new Error(`Save failed (${res.status})`);
      const { id } = await res.json();
      reset();
      router.push(`/history/${id}`);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not save workout.");
      setSaving(false);
    }
  }

  // Group into circuit sets + the trailing stretch/mobilisation block, so we
  // can put a break between each set, between the sets and the stretch, etc.
  const groups: WorkoutSlot[][] = [];
  let lastKey = "";
  for (const row of rows) {
    const key = TAIL_CATEGORIES.includes(row.category)
      ? "tail"
      : `set-${row.setNumber}`;
    if (key !== lastKey) {
      groups.push([]);
      lastKey = key;
    }
    groups[groups.length - 1].push(row);
  }

  const renderRow = (row: WorkoutSlot) => {
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
        className="group rounded-lg border border-line bg-white p-4 transition-colors focus-within:border-mint focus-within:bg-mint"
      >
        <div className="mb-3 flex items-baseline justify-between gap-2">
          <div className="min-w-0">
            <div className="font-display text-lg font-black uppercase leading-tight">
              {ex.name}
            </div>
            <div className="text-sm text-charcoal-soft">
              {row.role === "rehab" ? "Rehab · " : ""}
              {CATEGORY_LABELS[ex.category]}
              {ref ? ` · ${ref}` : ""}
            </div>
          </div>
          <div className="shrink-0 rounded-[4px] bg-line px-2.5 py-1 text-sm font-display font-medium uppercase tracking-widest text-charcoal-soft transition-colors group-focus-within:bg-white">
            Set {row.setNumber}
          </div>
        </div>

        <div className="flex gap-3">
          {fields.map((f) => {
            const placeholder =
              prev && prev[f.key] != null ? String(prev[f.key]) : "";
            return (
              <label key={f.key} className="flex-1">
                <span className="mb-1 block text-sm font-display font-medium uppercase tracking-widest text-charcoal-soft">
                  {f.label}
                  {f.unit ? ` (${f.unit})` : ""}
                </span>
                <input
                  type="number"
                  inputMode={f.integer ? "numeric" : "decimal"}
                  min={0}
                  step={f.step}
                  value={entry[f.key]}
                  placeholder={placeholder}
                  onChange={(e) => {
                    // No negatives; whole numbers only where required.
                    let v = e.target.value.replace(/-/g, "");
                    if (f.integer) v = v.replace(/[.,]/g, "");
                    updateLog(key, f.key, v);
                  }}
                  className="w-full rounded-[4px] border border-line bg-cream px-3 py-2.5 font-display text-2xl font-black tabular-nums outline-none transition placeholder:font-body placeholder:text-sm placeholder:font-normal placeholder:text-charcoal-soft/50 focus:border-charcoal group-focus-within:bg-white"
                />
              </label>
            );
          })}
        </div>
      </li>
    );
  };

  return (
    <div className="flex flex-col gap-5">
      <div className="flex items-center justify-between">
        <div className="text-sm font-display font-medium uppercase tracking-widest text-charcoal-soft">
          {type.label} · {workout.sets} {workout.sets === 1 ? "set" : "sets"}
        </div>
        <button
          onClick={reset}
          className="text-sm font-display font-medium uppercase tracking-widest text-charcoal-soft hover:text-charcoal"
        >
          Cancel
        </button>
      </div>

      {groups.map((group, gi) => (
        <Fragment key={gi}>
          {gi > 0 && <div className="border-t border-line" />}
          <ol className="flex flex-col gap-3">{group.map(renderRow)}</ol>
        </Fragment>
      ))}

      <div className="border-t border-line" />

      {/* Per-workout: comment + max heart rate. */}
      <div className="flex flex-col gap-3">
        <label className="flex flex-col gap-1">
          <span className="text-sm font-display font-medium uppercase tracking-widest text-charcoal-soft">
            Comment
          </span>
          <textarea
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            rows={3}
            className="w-full resize-none rounded-[4px] border border-line bg-white px-4 py-3 text-sm outline-none transition focus:border-charcoal"
          />
        </label>
        <label className="flex flex-col gap-1">
          <span className="text-sm font-display font-medium uppercase tracking-widest text-charcoal-soft">
            Max heart rate (bpm)
          </span>
          <input
            type="number"
            inputMode="numeric"
            min={0}
            value={maxHeartRate}
            onChange={(e) =>
              setMaxHeartRate(e.target.value.replace(/[^\d]/g, ""))
            }
            className="w-full rounded-[4px] border border-line bg-white px-4 py-3 font-display text-2xl font-black tabular-nums outline-none transition focus:border-charcoal"
          />
        </label>
      </div>

      <div className="border-t border-line" />

      {error && (
        <p className="rounded-[4px] bg-red-100 px-4 py-3 text-sm text-red-800">
          {error}
        </p>
      )}

      {needsPassword ? (
        <PasswordForm
          busy={saving}
          onSubmit={(secret) => {
            setNeedsPassword(false);
            void doSave(secret);
          }}
        />
      ) : (
        <Button
          onClick={finish}
          disabled={saving}
          className="w-full py-4 text-sm"
        >
          {saving ? "Saving…" : "Finish Workout"}
        </Button>
      )}
    </div>
  );
}

function parseNum(v: string | undefined): number | null {
  if (v == null || v.trim() === "") return null;
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
}
