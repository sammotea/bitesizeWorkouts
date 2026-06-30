"use client";

import { useSession } from "@/lib/store";
import { getExercise } from "@/data/exercises";
import { CATEGORY_LABELS, WORKOUT_TYPES } from "@/lib/constants";
import { formatBookRef } from "@/lib/format";
import Button from "./Button";

export default function CandidateView() {
  const { workout, generate, accept, reset } = useSession();
  if (!workout) return null;

  const type = WORKOUT_TYPES[workout.type];

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-start justify-between">
        <div>
          <div className="text-xs font-semibold uppercase tracking-widest text-charcoal-soft">
            {type.label} · {workout.sets} {workout.sets === 1 ? "set" : "sets"}
          </div>
          <h1 className="mt-1 font-display text-4xl font-extrabold uppercase">
            Candidate
          </h1>
        </div>
        <button
          onClick={reset}
          className="text-xs font-semibold uppercase tracking-widest text-charcoal-soft hover:text-charcoal"
        >
          Back
        </button>
      </div>

      <p className="text-sm text-charcoal-soft">
        Tap any exercise to lock in this workout, or reroll for a fresh draw.
      </p>

      <ul className="flex flex-col gap-2.5">
        {workout.composition.map((item) => {
          const ex = getExercise(item.exerciseId);
          if (!ex) return null;
          const ref = formatBookRef(ex.bookRef);
          return (
            <li key={`${item.exerciseId}-${item.slot}`}>
              <button
                onClick={accept}
                className="group flex w-full items-center gap-3 rounded-2xl border border-line bg-white/40 px-4 py-4 text-left transition hover:border-charcoal/50 hover:bg-mint-soft"
              >
                <span className="h-2.5 w-2.5 shrink-0 rounded-full bg-mint-deep" />
                <span className="min-w-0 flex-1">
                  <span className="block font-display text-lg font-bold leading-tight">
                    {ex.name}
                  </span>
                  <span className="block text-xs text-charcoal-soft">
                    {CATEGORY_LABELS[item.category]}
                    {ref ? ` · ${ref}` : ""}
                  </span>
                </span>
              </button>
            </li>
          );
        })}
        {workout.composition.length === 0 && (
          <li className="rounded-2xl border border-dashed border-line px-4 py-8 text-center text-sm text-charcoal-soft">
            No exercises match these biases. Loosen the constraints and try
            again.
          </li>
        )}
      </ul>

      <div className="flex gap-2.5">
        <Button variant="soft" onClick={generate} className="flex-1">
          Reroll
        </Button>
        <Button
          onClick={accept}
          className="flex-1"
          disabled={workout.composition.length === 0}
        >
          Accept
        </Button>
      </div>
    </div>
  );
}
