"use client";

import { useSession } from "@/lib/store";
import { BODY_PARTS, BODY_PART_LABELS, WORKOUT_TYPES } from "@/lib/constants";
import { clsx } from "@/lib/clsx";
import Button from "./Button";
import type { BodyPart, WorkoutType } from "@/lib/types";

const TYPE_ORDER: WorkoutType["key"][] = [
  "standard",
  "fatigued",
  "energised",
  "rehab",
];

export default function ModifierPanel() {
  const {
    typeKey,
    biasRows,
    setType,
    setBiasKind,
    setBiasPart,
    removeBias,
    generate,
  } = useSession();

  return (
    <div className="flex flex-col gap-8">
      <div>
        <h1 className="font-display text-5xl font-extrabold uppercase leading-[0.95]">
          New
          <br />
          Workout
        </h1>
      </div>

      {/* Workout type — Standard is the default; others are simple toggles. */}
      <section>
        <h2 className="mb-3 text-xs font-semibold uppercase tracking-widest text-charcoal-soft">
          Type
        </h2>
        <div className="flex flex-wrap gap-2">
          {TYPE_ORDER.map((key) => {
            const active = typeKey === key;
            return (
              <button
                key={key}
                onClick={() => setType(key)}
                className={clsx(
                  "rounded-full border px-4 py-2.5 font-display text-sm font-bold transition",
                  active
                    ? "border-charcoal bg-charcoal text-cream"
                    : "border-line bg-white/40 text-charcoal-soft hover:border-charcoal/40 hover:text-charcoal",
                )}
              >
                {WORKOUT_TYPES[key].label}
              </button>
            );
          })}
        </div>
      </section>

      {/* Biases — one line each: prefer/avoid toggle + body-part select. */}
      <section>
        <h2 className="mb-3 text-xs font-semibold uppercase tracking-widest text-charcoal-soft">
          Biases
        </h2>
        <div className="flex flex-col gap-2.5">
          {biasRows.map((row, i) => {
            const isDraft = row.part === null;
            return (
              <div key={i} className="flex items-center gap-2">
                <button
                  onClick={() =>
                    setBiasKind(i, row.kind === "focus" ? "avoid" : "focus")
                  }
                  className={clsx(
                    "w-24 shrink-0 rounded-full border px-4 py-3 text-sm font-bold transition",
                    row.kind === "focus"
                      ? "border-mint-deep bg-mint text-charcoal"
                      : "border-charcoal bg-charcoal text-cream",
                  )}
                >
                  {row.kind === "focus" ? "Prefer" : "Avoid"}
                </button>

                <div className="relative flex-1">
                  <select
                    value={row.part ?? ""}
                    onChange={(e) =>
                      setBiasPart(i, e.target.value as BodyPart)
                    }
                    className={clsx(
                      "w-full appearance-none rounded-full border border-line bg-white/40 px-4 py-3 pr-9 text-sm outline-none transition focus:border-charcoal",
                      isDraft ? "text-charcoal-soft" : "text-charcoal",
                    )}
                  >
                    <option value="" disabled>
                      Select body part…
                    </option>
                    {BODY_PARTS.map((p) => (
                      <option key={p} value={p}>
                        {BODY_PART_LABELS[p]}
                      </option>
                    ))}
                  </select>
                  <span className="pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 text-charcoal-soft">
                    ▾
                  </span>
                </div>

                {!isDraft && (
                  <button
                    onClick={() => removeBias(i)}
                    aria-label="Remove bias"
                    className="shrink-0 rounded-full border border-line bg-white/40 px-3 py-3 text-charcoal-soft transition hover:border-charcoal/40 hover:text-charcoal"
                  >
                    ✕
                  </button>
                )}
              </div>
            );
          })}
        </div>
      </section>

      <Button onClick={generate} className="mt-2 w-full py-4 text-base">
        Generate
      </Button>
    </div>
  );
}
