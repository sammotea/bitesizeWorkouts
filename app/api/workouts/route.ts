import { NextResponse } from "next/server";
import { checkSecret } from "@/lib/auth";
import { listWorkouts, saveWorkout } from "@/lib/db/queries";

export const runtime = "nodejs";

export async function GET() {
  try {
    const rows = await listWorkouts();
    return NextResponse.json(rows);
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Failed to load workouts" },
      { status: 500 },
    );
  }
}

export async function POST(req: Request) {
  const unauthorized = checkSecret(req);
  if (unauthorized) return unauthorized;

  try {
    const body = await req.json();
    if (!body?.type || !Array.isArray(body?.composition)) {
      return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
    }
    const id = await saveWorkout({
      type: body.type,
      biases: body.biases ?? { avoid: [], focus: [] },
      composition: body.composition,
      sets: body.sets ?? [],
    });
    return NextResponse.json({ id });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Failed to save workout" },
      { status: 500 },
    );
  }
}
