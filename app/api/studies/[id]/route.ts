import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db/client";
import { study, stimulus, panelSpec, guide, run } from "@/db/schema";
import { eq, desc } from "drizzle-orm";

export const runtime = "nodejs";

export async function GET(_req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  const [s] = await db.select().from(study).where(eq(study.id, id));
  if (!s) return NextResponse.json({ error: "not found" }, { status: 404 });
  const [stim] = await db.select().from(stimulus).where(eq(stimulus.studyId, id)).orderBy(desc(stimulus.version)).limit(1);
  const [ps] = await db.select().from(panelSpec).where(eq(panelSpec.studyId, id)).orderBy(desc(panelSpec.createdAt)).limit(1);
  const [g] = await db.select().from(guide).where(eq(guide.studyId, id)).orderBy(desc(guide.version)).limit(1);
  const runs = await db.select().from(run).where(eq(run.studyId, id)).orderBy(desc(run.createdAt)).limit(50);
  return NextResponse.json({ study: s, stimulus: stim, panelSpec: ps, guide: g, runs });
}
