import { NextResponse } from "next/server";
import { getPreviousRecords } from "@/lib/db/queries";

export const runtime = "nodejs";

export async function GET(req: Request) {
  const url = new URL(req.url);
  const idsParam = url.searchParams.get("ids") ?? "";
  const ids = idsParam
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);

  try {
    const records = await getPreviousRecords(ids);
    return NextResponse.json(records);
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Failed to load records" },
      { status: 500 },
    );
  }
}
