"use client";

import { useEffect, useState } from "react";
import { getExercise } from "@/data/exercises";
import { CATEGORY_LABELS } from "@/lib/constants";
import { formatBookRef } from "@/lib/format";
import { localDate } from "@/lib/datetime";
import { getStoredSecret, clearStoredSecret } from "@/lib/session-auth";
import { clsx } from "@/lib/clsx";
import PasswordForm from "./PasswordForm";
import type { RehabDay } from "@/lib/types";

interface Tick {
  exerciseId: string;
  setIndex: number;
  done: boolean;
}

export default function RehabView() {
  const [day, setDay] = useState<RehabDay | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [needsPassword, setNeedsPassword] = useState(false);
  const [pending, setPending] = useState<Tick | null>(null);
  // Locale formatting differs between server and browser — client-only to
  // avoid a hydration mismatch.
  const [dateLabel, setDateLabel] = useState("");

  const date = localDate();

  useEffect(() => {
    setDateLabel(
      new Date().toLocaleDateString(undefined, {
        weekday: "short",
        day: "numeric",
        month: "short",
      }),
    );
  }, []);

  useEffect(() => {
    fetch(`/api/rehab/${date}`)
      .then((res) => {
        if (!res.ok) throw new Error(`Failed to load (${res.status})`);
        return res.json();
      })
      .then(setDay)
      .catch((e) =>
        setError(e instanceof Error ? e.message : "Could not load today."),
      );
  }, [date]);

  function toggle(exerciseId: string, setIndex: number) {
    if (!day) return;
    const tick: Tick = {
      exerciseId,
      setIndex,
      done: !day.progress[exerciseId]?.[setIndex],
    };
    const secret = getStoredSecret();
    if (!secret) {
      setPending(tick);
      setNeedsPassword(true);
      return;
    }
    void applyTick(secret, tick);
  }

  async function applyTick(secret: string, tick: Tick) {
    if (!day) return;
    setError(null);

    // Optimistic update; revert on failure.
    const before = day;
    setDay({
      ...day,
      progress: {
        ...day.progress,
        [tick.exerciseId]: day.progress[tick.exerciseId].map((t, i) =>
          i === tick.setIndex ? tick.done : t,
        ),
      },
    });

    try {
      const res = await fetch(`/api/rehab/${date}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          "x-app-secret": secret,
        },
        body: JSON.stringify(tick),
      });
      if (res.status === 401) {
        setDay(before);
        clearStoredSecret();
        setPending(tick);
        setNeedsPassword(true);
        setError("Wrong password — try again.");
        return;
      }
      if (!res.ok) throw new Error(`Save failed (${res.status})`);
      setDay(await res.json()); // authoritative state
    } catch (e) {
      setDay(before);
      setError(e instanceof Error ? e.message : "Could not save tick.");
    }
  }

  const ticks = day ? Object.values(day.progress).flat() : [];
  const done = ticks.filter(Boolean).length;

  return (
    <div className="flex flex-col gap-5">
      <div className="flex items-center justify-between text-sm font-display font-medium uppercase tracking-widest text-charcoal-soft">
        <span>Today{dateLabel ? ` · ${dateLabel}` : ""}</span>
        {day && (
          <span>
            {done}/{ticks.length}
          </span>
        )}
      </div>

      {error && (
        <p className="rounded-[4px] bg-red-100 px-4 py-3 text-sm text-red-800">
          {error}
        </p>
      )}

      {needsPassword && (
        <PasswordForm
          label="Unlock"
          onSubmit={(secret) => {
            setNeedsPassword(false);
            setError(null);
            if (pending) {
              const tick = pending;
              setPending(null);
              void applyTick(secret, tick);
            }
          }}
        />
      )}

      <ol className="flex flex-col gap-3">
        {day?.exerciseIds.map((id) => {
          const ex = getExercise(id);
          if (!ex) return null;
          const ref = formatBookRef(ex.bookRef);
          const sets = day.progress[id] ?? [];
          const allDone = sets.length > 0 && sets.every(Boolean);

          return (
            <li
              key={id}
              className={clsx(
                "rounded-lg border bg-white p-4 transition-colors",
                allDone ? "border-mint" : "border-line",
              )}
            >
              <div className="mb-3 min-w-0">
                <div className="font-display text-lg font-black uppercase leading-tight">
                  {ex.name}
                </div>
                <div className="text-sm text-charcoal-soft">
                  {CATEGORY_LABELS[ex.category]}
                  {ref ? ` · ${ref}` : ""}
                </div>
              </div>

              <div className="flex gap-3">
                {sets.map((isDone, i) => (
                  <button
                    key={i}
                    onClick={() => toggle(id, i)}
                    aria-pressed={isDone}
                    className={clsx(
                      "h-14 flex-1 rounded-[4px] border font-display text-lg font-black tabular-nums transition-colors",
                      isDone
                        ? "border-mint bg-mint text-charcoal"
                        : "border-line bg-cream text-charcoal-soft hover:border-charcoal/40",
                    )}
                  >
                    {i + 1}
                  </button>
                ))}
              </div>
            </li>
          );
        })}
      </ol>
    </div>
  );
}
