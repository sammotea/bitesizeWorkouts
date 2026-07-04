"use client";

import { useSession } from "@/lib/store";
import { BODY_PARTS, BODY_PART_LABELS, WORKOUT_TYPES } from "@/lib/constants";
import { clsx } from "@/lib/clsx";
import type { BodyPart, WorkoutType } from "@/lib/types";

// Standard is the implied default, so it isn't shown as a toggle.
const TYPE_TOGGLES: WorkoutType["key"][] = [
  "fatigued",
  "energised",
  "stretches",
];

export default function OptionsPanel() {
  const { typeKey, biasRows, toggleType, setBiasKind, setBiasPart, removeBias } =
    useSession();

  return (
    <div className="flex flex-col gap-4 rounded-[4px] border border-line bg-line p-4">
      {/* Row 1 — workout type toggles (Standard is the default). */}
      <div className="grid grid-cols-3 gap-2">
        {TYPE_TOGGLES.map((key) => {
          const active = typeKey === key;
          return (
            <button
              key={key}
              onClick={() => toggleType(key)}
              className={clsx(
                "rounded-[4px] border px-2 py-2.5 text-center font-display text-sm font-medium transition",
                active
                  ? "border-charcoal bg-charcoal text-cream"
                  : "border-line bg-white text-charcoal-soft hover:border-charcoal/40 hover:text-charcoal",
              )}
            >
              {WORKOUT_TYPES[key].label}
            </button>
          );
        })}
      </div>

      {/* Row 2+ — bias rows: +/- toggle then body-part select. */}
      <div className="flex flex-col gap-2">
        {biasRows.map((row, i) => {
          const isDraft = row.part === null;
          return (
            <div key={i} className="flex items-center gap-2">
              <button
                onClick={() =>
                  setBiasKind(i, row.kind === "focus" ? "avoid" : "focus")
                }
                aria-label={row.kind === "focus" ? "Prefer" : "Avoid"}
                className="w-11 shrink-0 rounded-[4px] border border-charcoal bg-charcoal py-2.5 text-center font-display text-lg font-medium leading-none text-cream transition"
              >
                {row.kind === "focus" ? "+" : "−"}
              </button>

              <select
                value={row.part ?? ""}
                onChange={(e) => setBiasPart(i, e.target.value as BodyPart)}
                className={clsx(
                  "flex-1 appearance-none rounded-[4px] border border-line bg-white px-3 py-2.5 text-sm outline-none transition focus:border-charcoal",
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

              {!isDraft && (
                <button
                  onClick={() => removeBias(i)}
                  aria-label="Remove bias"
                  className="shrink-0 rounded-[4px] border border-line bg-white px-3 py-2.5 text-sm text-charcoal-soft transition hover:border-charcoal/40 hover:text-charcoal"
                >
                  ✕
                </button>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
