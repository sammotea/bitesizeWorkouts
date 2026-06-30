import Link from "next/link";
import { listWorkouts } from "@/lib/db/queries";
import { getExercise } from "@/data/exercises";
import { WORKOUT_TYPES } from "@/lib/constants";
import { formatDate } from "@/lib/datetime";

export const dynamic = "force-dynamic";

export default async function HistoryPage() {
  let rows: Awaited<ReturnType<typeof listWorkouts>> = [];
  let error: string | null = null;
  try {
    rows = await listWorkouts();
  } catch (e) {
    error = e instanceof Error ? e.message : "Could not load history.";
  }

  return (
    <div className="flex flex-col gap-6">
      <h1 className="font-display text-6xl font-black uppercase">History</h1>

      {error && (
        <p className="rounded-xl bg-red-100 px-4 py-3 text-sm text-red-800">
          {error}
        </p>
      )}

      {!error && rows.length === 0 && (
        <p className="text-sm text-charcoal-soft">
          No workouts saved yet. Generate one to get started.
        </p>
      )}

      <ul className="flex flex-col gap-2.5">
        {rows.map((w) => {
          const names = w.composition
            .map((c) => getExercise(c.exerciseId)?.name)
            .filter(Boolean)
            .join(" · ");
          return (
            <li key={w.id}>
              <Link
                href={`/history/${w.id}`}
                className="block rounded-[6px] border border-line bg-line px-4 py-4 transition hover:border-charcoal/50 hover:bg-mint-soft"
              >
                <div className="flex items-baseline justify-between">
                  <span className="font-display text-lg font-black uppercase">
                    {WORKOUT_TYPES[w.type]?.label ?? w.type}
                  </span>
                  <span className="text-sm text-charcoal-soft">
                    {formatDate(w.performedAt)}
                  </span>
                </div>
                <div className="mt-1 line-clamp-1 text-sm text-charcoal-soft">
                  {names || "—"}
                </div>
              </Link>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
