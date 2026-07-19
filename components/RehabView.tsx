"use client";

import { useEffect, useState } from "react";
import { getExercise } from "@/data/exercises";
import { dailyRehabCandidates } from "@/lib/generator";
import { CATEGORY_LABELS, REHAB_HOLD, REHAB_TRACKER } from "@/lib/constants";
import { formatBookRef, formatDuration } from "@/lib/format";
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

type Pending =
  | { kind: "tick"; tick: Tick }
  | { kind: "swap"; fromId: string; toId: string };

export default function RehabView() {
  const [day, setDay] = useState<RehabDay | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [needsPassword, setNeedsPassword] = useState(false);
  const [pending, setPending] = useState<Pending | null>(null);
  // Id of the drill whose swap picker is open (only one at a time).
  const [swapping, setSwapping] = useState<string | null>(null);
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
      setPending({ kind: "tick", tick });
      setNeedsPassword(true);
      return;
    }
    void applyTick(secret, tick);
  }

  function requestSwap(fromId: string, toId: string) {
    if (!day) return;
    setSwapping(null);
    const secret = getStoredSecret();
    if (!secret) {
      setPending({ kind: "swap", fromId, toId });
      setNeedsPassword(true);
      return;
    }
    void applySwap(secret, fromId, toId);
  }

  async function applySwap(secret: string, fromId: string, toId: string) {
    if (!day) return;
    setError(null);

    // Optimistic: replace the id in place, fresh ticks for the newcomer.
    const before = day;
    const exerciseIds = day.exerciseIds.map((id) =>
      id === fromId ? toId : id,
    );
    const progress: Record<string, boolean[]> = {};
    for (const [key, ticks] of Object.entries(day.progress)) {
      if (key !== fromId) progress[key] = ticks;
    }
    progress[toId] = Array(REHAB_TRACKER.sets).fill(false);
    setDay({ ...day, exerciseIds, progress });

    try {
      const res = await fetch(`/api/rehab/${date}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          "x-app-secret": secret,
        },
        body: JSON.stringify({ action: "swap", fromId, toId }),
      });
      if (res.status === 401) {
        setDay(before);
        clearStoredSecret();
        setPending({ kind: "swap", fromId, toId });
        setNeedsPassword(true);
        setError("Wrong password — try again.");
        return;
      }
      if (!res.ok) throw new Error(`Swap failed (${res.status})`);
      setDay(await res.json()); // authoritative state
    } catch (e) {
      setDay(before);
      setError(e instanceof Error ? e.message : "Could not swap.");
    }
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
        setPending({ kind: "tick", tick });
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

  const holdSets = day?.progress[REHAB_HOLD.key] ?? [];
  const holdDone = holdSets.length > 0 && holdSets.every(Boolean);

  // Swap targets: every dailyRehab drill not already scheduled today.
  const swapCandidates = day ? dailyRehabCandidates(day.exerciseIds) : [];

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
            const p = pending;
            setPending(null);
            if (!p) return;
            if (p.kind === "tick") void applyTick(secret, p.tick);
            else void applySwap(secret, p.fromId, p.toId);
          }}
        />
      )}

      <ol className="flex flex-col gap-3">
        {day && (
          <li
            key="hold"
            className={clsx(
              "rounded-lg border bg-white p-4 transition-colors",
              holdDone ? "border-mint" : "border-line",
            )}
          >
            <div className="mb-3 min-w-0">
              <div className="font-display text-lg font-black uppercase leading-tight">
                {REHAB_HOLD.name}
              </div>
              <div className="text-sm text-charcoal-soft">
                {formatDuration(REHAB_HOLD.targetSeconds)} hold
              </div>
            </div>

            <div className="flex gap-3">
              {holdSets.map((isDone, i) => (
                <button
                  key={i}
                  onClick={() => toggle(REHAB_HOLD.key, i)}
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
        )}
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
              <div className="mb-3 flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="font-display text-lg font-black uppercase leading-tight">
                    {ex.name}
                  </div>
                  <div className="text-sm text-charcoal-soft">
                    {CATEGORY_LABELS[ex.category]}
                    {ref ? ` · ${ref}` : ""}
                  </div>
                </div>
                <button
                  onClick={() => setSwapping(swapping === id ? null : id)}
                  aria-expanded={swapping === id}
                  className="shrink-0 rounded-[4px] border border-line px-2.5 py-1 font-display text-xs font-medium uppercase tracking-wide text-charcoal-soft transition-colors hover:border-charcoal/40"
                >
                  {swapping === id ? "Close" : "Swap"}
                </button>
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

              {swapping === id && (
                <div className="mt-3 flex flex-col gap-2 border-t border-line pt-3">
                  <div className="text-sm font-display font-medium uppercase tracking-widest text-charcoal-soft">
                    Swap for…
                  </div>
                  {swapCandidates.length === 0 ? (
                    <p className="text-sm text-charcoal-soft">
                      No other drills available.
                    </p>
                  ) : (
                    <ul className="flex flex-col gap-1.5">
                      {swapCandidates.map((c) => (
                        <li key={c.id}>
                          <button
                            onClick={() => requestSwap(id, c.id)}
                            className="w-full rounded-[4px] border border-line bg-cream px-3 py-2.5 text-left transition-colors hover:border-charcoal/40"
                          >
                            <span className="block font-display text-sm font-black uppercase leading-tight">
                              {c.name}
                            </span>
                            <span className="block text-xs text-charcoal-soft">
                              {CATEGORY_LABELS[c.category]}
                            </span>
                          </button>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              )}
            </li>
          );
        })}
      </ol>
    </div>
  );
}
