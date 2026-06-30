import Link from "next/link";
import { notFound } from "next/navigation";
import { getExercise } from "@/data/exercises";
import { getExerciseHistory } from "@/lib/db/queries";
import { CATEGORY_LABELS, BODY_PART_LABELS } from "@/lib/constants";
import { metricFields, formatBookRef } from "@/lib/format";
import { formatDate } from "@/lib/datetime";

export const dynamic = "force-dynamic";

export default async function ExerciseHistoryPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const ex = getExercise(id);
  if (!ex) notFound();

  const fields = metricFields(ex.category);
  let history: Awaited<ReturnType<typeof getExerciseHistory>> = [];
  let error: string | null = null;
  try {
    history = await getExerciseHistory(id);
  } catch (e) {
    error = e instanceof Error ? e.message : "Could not load history.";
  }
  const done = history.filter((h) => h.completed);
  const ref = formatBookRef(ex.bookRef);

  return (
    <div className="flex flex-col gap-6">
      <div>
        <Link
          href="/exercises"
          className="text-sm font-display font-medium uppercase tracking-widest text-charcoal-soft hover:text-charcoal"
        >
          ← Library
        </Link>
        <h1 className="mt-2 font-display text-6xl font-black uppercase leading-[0.95]">
          {ex.name}
        </h1>
        <p className="mt-1 text-sm text-charcoal-soft">
          {CATEGORY_LABELS[ex.category]} ·{" "}
          {ex.bodyParts.map((p) => BODY_PART_LABELS[p]).join(", ")}
          {ref ? ` · ${ref}` : ""}
        </p>
      </div>

      {error && (
        <p className="rounded-xl bg-red-100 px-4 py-3 text-sm text-red-800">
          {error}
        </p>
      )}

      {!error && done.length === 0 && (
        <p className="text-sm text-charcoal-soft">
          No completed sets logged yet.
        </p>
      )}

      <ul className="flex flex-col gap-2">
        {done.map((h) => (
          <li
            key={h.setId}
            className="flex items-center justify-between rounded-[6px] border border-line bg-line px-4 py-3 text-sm"
          >
            <span className="text-charcoal-soft">
              {formatDate(h.performedAt)} · set {h.setNumber}
            </span>
            <span className="font-display font-black tabular-nums">
              {fields
                .map((f) => {
                  const v = h[f.key];
                  return v != null ? `${v}${f.unit ?? ""}` : "—";
                })
                .join("  ·  ")}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
