"use client";

import { useState } from "react";
import { useSession } from "@/lib/store";
import { getExercise } from "@/data/exercises";
import { CATEGORY_LABELS } from "@/lib/constants";
import { formatBookRef } from "@/lib/format";
import { clsx } from "@/lib/clsx";
import Button from "./Button";
import OptionsPanel from "./OptionsPanel";
import ExerciseRow from "./ExerciseRow";

export default function GeneratorView() {
  const { workout, regenerate, accept } = useSession();
  const [optionsOpen, setOptionsOpen] = useState(false);

  return (
    <div>
      {/* Regenerate (primary) + Options (secondary), at the top. */}
      <div className="flex gap-2.5">
        <Button onClick={() => regenerate()} className="flex-1">
          Regenerate
        </Button>
        <Button
          variant="secondary"
          onClick={() => setOptionsOpen((o) => !o)}
          aria-expanded={optionsOpen}
          className="flex-1"
        >
          Options
        </Button>
      </div>

      {/* Options: animated push-down dropdown (expands page layout). */}
      <div
        className={clsx(
          "grid transition-[grid-template-rows,opacity] duration-300 ease-out",
          optionsOpen ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0",
        )}
      >
        <div className="overflow-hidden">
          <div className="pt-3">
            <OptionsPanel />
          </div>
        </div>
      </div>

      <ul className="mt-5 flex flex-col gap-2.5">
        {workout?.composition.map((item) => {
          const ex = getExercise(item.exerciseId);
          if (!ex) return null;
          const ref = formatBookRef(ex.bookRef);
          return (
            <li key={`${item.exerciseId}-${item.slot}`}>
              <ExerciseRow
                name={ex.name}
                meta={`${CATEGORY_LABELS[item.category]}${ref ? ` · ${ref}` : ""}`}
                onClick={accept}
              />
            </li>
          );
        })}
      </ul>
    </div>
  );
}
