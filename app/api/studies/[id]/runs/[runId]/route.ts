import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db/client";
import { run, event as eventTable, persona } from "@/db/schema";
import { asc, eq, inArray } from "drizzle-orm";

export const runtime = "nodejs";

export async function GET(
  _req: NextRequest,
  ctx: { params: Promise<{ id: string; runId: string }> }
) {
  const { runId } = await ctx.params;
  const [r] = await db.select().from(run).where(eq(run.id, runId));
  if (!r) return NextResponse.json({ error: "run not found" }, { status: 404 });

  const events = await db
    .select()
    .from(eventTable)
    .where(eq(eventTable.runId, runId))
    .orderBy(asc(eventTable.seq));

  const panel =
    r.panelIds.length > 0
      ? await db.select().from(persona).where(inArray(persona.id, r.panelIds))
      : [];

  return NextResponse.json({ run: r, events, panel });
}
