import { EXERCISES } from "@/data/exercises";
import {
  CATEGORY_LABELS,
  CATEGORY_ORDER,
  BODY_PART_LABELS,
} from "@/lib/constants";
import { formatBookRef } from "@/lib/format";
import ExerciseRow from "@/components/ExerciseRow";
import type { Category } from "@/lib/types";

export default function ExercisesPage() {
  return (
    <div className="flex flex-col gap-8">
      <h1 className="font-display text-6xl font-black uppercase">Library</h1>

      {CATEGORY_ORDER.map((cat) => {
        const items = EXERCISES.filter((e) => e.category === cat).sort((a, b) =>
          a.name.localeCompare(b.name),
        );
        if (items.length === 0) return null;
        return (
          <section key={cat}>
            <h2 className="mb-3 text-sm font-display font-medium uppercase tracking-widest text-charcoal-soft">
              {CATEGORY_LABELS[cat as Category]}
            </h2>
            <ul className="flex flex-col gap-2">
              {items.map((ex) => {
                const ref = formatBookRef(ex.bookRef);
                const parts = ex.bodyParts
                  .map((p) => BODY_PART_LABELS[p])
                  .join(", ");
                return (
                  <li key={ex.id}>
                    <ExerciseRow
                      name={ex.name}
                      meta={`${parts}${ref ? ` · ${ref}` : ""}`}
                      href={`/exercises/${ex.id}`}
                    />
                  </li>
                );
              })}
            </ul>
          </section>
        );
      })}
    </div>
  );
}
