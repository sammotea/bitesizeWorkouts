import { NextResponse } from "next/server";
import { checkSecret } from "@/lib/auth";
import {
  getOrCreateRehabDay,
  getRehabDay,
  setRehabTick,
  swapRehabExercise,
} from "@/lib/db/queries";

export const runtime = "nodejs";

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

/**
 * Get the day's rehab program, creating it on first request.
 * With `?peek=1` it's read-only (returns null when no day exists) — used by
 * the landing card so browsing never creates rows.
 * (Create-on-GET is an unguarded write — accepted for a single-user app;
 * worst case is empty rows for arbitrary dates.)
 */
export async function GET(
  req: Request,
  { params }: { params: Promise<{ date: string }> },
) {
  const { date } = await params;
  if (!DATE_RE.test(date)) {
    return NextResponse.json({ error: "Invalid date" }, { status: 400 });
  }
  try {
    const peek = new URL(req.url).searchParams.has("peek");
    if (peek) return NextResponse.json(await getRehabDay(date));
    return NextResponse.json(await getOrCreateRehabDay(date));
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Failed to load rehab day" },
      { status: 500 },
    );
  }
}

/**
 * Mutate the day. Two shapes:
 *   - tick: { exerciseId, setIndex, done }
 *   - swap: { action: "swap", fromId, toId }
 */
export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ date: string }> },
) {
  const unauthorized = checkSecret(req);
  if (unauthorized) return unauthorized;

  const { date } = await params;
  if (!DATE_RE.test(date)) {
    return NextResponse.json({ error: "Invalid date" }, { status: 400 });
  }

  try {
    const body = await req.json();

    if (body?.action === "swap") {
      if (typeof body.fromId !== "string" || typeof body.toId !== "string") {
        return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
      }
      const day = await swapRehabExercise(date, body.fromId, body.toId);
      if (!day) {
        return NextResponse.json({ error: "Not found" }, { status: 404 });
      }
      return NextResponse.json(day);
    }

    if (
      typeof body?.exerciseId !== "string" ||
      typeof body?.setIndex !== "number" ||
      typeof body?.done !== "boolean"
    ) {
      return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
    }
    const day = await setRehabTick(
      date,
      body.exerciseId,
      body.setIndex,
      body.done,
    );
    if (!day) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }
    return NextResponse.json(day);
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Failed to update" },
      { status: 500 },
    );
  }
}
