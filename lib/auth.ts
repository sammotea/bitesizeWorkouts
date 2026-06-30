import { NextResponse } from "next/server";

/**
 * Single-user write guard. The client sends `x-app-secret`; it must match the
 * server's APP_SECRET. If APP_SECRET is unset (e.g. local dev), the guard is
 * skipped so the app works out of the box.
 */
export function checkSecret(req: Request): NextResponse | null {
  const expected = process.env.APP_SECRET;
  if (!expected) return null; // not configured — allow
  const provided = req.headers.get("x-app-secret");
  if (provided !== expected) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  return null;
}
