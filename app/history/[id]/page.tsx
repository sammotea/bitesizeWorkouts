import Link from "next/link";
import { notFound } from "next/navigation";
import { getWorkout } from "@/lib/db/queries";
import { getExercise } from "@/data/exercises";
import { CATEGORY_LABELS, WORKOUT_TYPES } from "@/lib/constants";
import { metricFields, formatBookRef } from "@/lib/format";
import { formatDateTime } from "@/lib/datetime";
import type { SetLogRow } from "@/lib/db/schema";

export const dynamic = "force-dynamic";

export default async function WorkoutDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const result = await getWorkout(id);
  if (!result) notFound();

  const { workout, sets } = result;
  const type = WORKOUT_TYPES[workout.type];

  return (
    <div className="flex flex-col gap-6">
      <div>
        <Link
          href="/history"
          className="text-sm font-display font-medium uppercase tracking-widest text-charcoal-soft hover:text-charcoal"
        >
          ← History
        </Link>
        <h1 className="mt-2 font-display text-6xl font-black uppercase">
          {type?.label ?? workout.type}
        </h1>
        <p className="mt-1 text-sm text-charcoal-soft">
          {formatDateTime(workout.performedAt)}
        </p>
      </div>

      <ul className="flex flex-col gap-3">
        {workout.composition.map((item, i) => {
          const ex = getExercise(item.exerciseId);
          if (!ex) return null;
          const fields = metricFields(ex.category);
          const exSets = sets
            .filter((s) => s.exerciseId === item.exerciseId)
            .sort((a, b) => a.setNumber - b.setNumber);
          const ref = formatBookRef(ex.bookRef);

          return (
            <li
              key={`${item.exerciseId}-${i}`}
              className="rounded-[6px] border border-line bg-line p-4"
            >
              <div className="flex items-baseline justify-between gap-2">
                <Link
                  href={`/exercises/${ex.id}`}
                  className="font-display text-lg font-black uppercase hover:underline"
                >
                  {ex.name}
                </Link>
                <span className="text-sm text-charcoal-soft">
                  {CATEGORY_LABELS[ex.category]}
                </span>
              </div>
              {ref && (
                <div className="text-sm text-charcoal-soft">{ref}</div>
              )}

              <div className="mt-3 flex flex-col gap-1.5">
                {exSets.map((s) => (
                  <SetRow key={s.id} set={s} fields={fields} />
                ))}
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

function SetRow({
  set,
  fields,
}: {
  set: SetLogRow;
  fields: ReturnType<typeof metricFields>;
}) {
  const parts = fields.map((f) => {
    const v = set[f.key];
    return v != null ? `${v}${f.unit ? f.unit : ""}` : "—";
  });
  return (
    <div className="flex items-center justify-between text-sm">
      <span className="text-charcoal-soft">Set {set.setNumber}</span>
      <span
        className={
          set.completed
            ? "font-display font-black tabular-nums"
            : "text-charcoal-soft/60"
        }
      >
        {set.completed ? parts.join("  ·  ") : "not done"}
      </span>
    </div>
  );
}
