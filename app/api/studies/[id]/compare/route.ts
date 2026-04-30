import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db/client";
import { run, event as eventTable } from "@/db/schema";
import { asc, eq } from "drizzle-orm";
import { summarizeRun, compareRuns } from "@/lib/diff";

export const runtime = "nodejs";

export async function GET(
  req: NextRequest,
  ctx: { params: Promise<{ id: string }> }
) {
  await ctx.params;
  const a = req.nextUrl.searchParams.get("a");
  const b = req.nextUrl.searchParams.get("b");
  if (!a || !b) return NextResponse.json({ error: "a and b required" }, { status: 400 });

  const [ra] = await db.select().from(run).where(eq(run.id, a));
  const [rb] = await db.select().from(run).where(eq(run.id, b));
  if (!ra || !rb)
    return NextResponse.json({ error: "run not found" }, { status: 404 });

  const ea = await db
    .select()
    .from(eventTable)
    .where(eq(eventTable.runId, a))
    .orderBy(asc(eventTable.seq));
  const eb = await db
    .select()
    .from(eventTable)
    .where(eq(eventTable.runId, b))
    .orderBy(asc(eventTable.seq));

  const sa = summarizeRun(ra, ea);
  const sb = summarizeRun(rb, eb);
  const diff = compareRuns(sa, sb);

  return NextResponse.json({ diff });
}
