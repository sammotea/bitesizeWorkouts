import Link from "next/link";
import { EXERCISES } from "@/data/exercises";
import {
  CATEGORY_LABELS,
  CATEGORY_ORDER,
  BODY_PART_LABELS,
} from "@/lib/constants";
import { formatBookRef } from "@/lib/format";
import type { Category } from "@/lib/types";

const PREF_DOT: Record<number, string> = {
  1: "bg-charcoal/20",
  2: "bg-charcoal/40",
  3: "bg-charcoal/60",
  4: "bg-mint-deep",
  5: "bg-mint-deep ring-2 ring-mint-deep/40",
};

export default function ExercisesPage() {
  return (
    <div className="flex flex-col gap-8">
      <div>
        <h1 className="font-display text-4xl font-extrabold uppercase">
          Library
        </h1>
        <p className="mt-1 text-sm text-charcoal-soft">
          {EXERCISES.length} exercises. Tap one for its history.
        </p>
      </div>

      {CATEGORY_ORDER.map((cat) => {
        const items = EXERCISES.filter((e) => e.category === cat);
        if (items.length === 0) return null;
        return (
          <section key={cat}>
            <h2 className="mb-3 text-xs font-semibold uppercase tracking-widest text-charcoal-soft">
              {CATEGORY_LABELS[cat as Category]}
            </h2>
            <ul className="flex flex-col gap-2">
              {items.map((ex) => {
                const ref = formatBookRef(ex.bookRef);
                return (
                  <li key={ex.id}>
                    <Link
                      href={`/exercises/${ex.id}`}
                      className="flex items-center gap-3 rounded-2xl border border-line bg-white/40 px-4 py-3 transition hover:border-charcoal/50 hover:bg-mint-soft"
                    >
                      <span
                        title={`Preference ${ex.preference}/5`}
                        className={`h-2.5 w-2.5 shrink-0 rounded-full ${PREF_DOT[ex.preference]}`}
                      />
                      <span className="min-w-0 flex-1">
                        <span className="block font-display font-bold leading-tight">
                          {ex.name}
                        </span>
                        <span className="block text-xs text-charcoal-soft">
                          {ex.bodyParts
                            .map((p) => BODY_PART_LABELS[p])
                            .join(", ")}
                          {ref ? ` · ${ref}` : ""}
                        </span>
                      </span>
                    </Link>
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
