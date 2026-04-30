import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db/client";
import { guide, study } from "@/db/schema";
import { eq, desc } from "drizzle-orm";

export const runtime = "nodejs";

export async function POST(
  req: NextRequest,
  ctx: { params: Promise<{ id: string }> }
) {
  const { id: studyId } = await ctx.params;
  const body = (await req.json()) as {
    sections: Array<{ key: string; title: string; prompts: string[] }>;
    source?: string;
  };

  const [s] = await db.select().from(study).where(eq(study.id, studyId));
  if (!s) return NextResponse.json({ error: "study not found" }, { status: 404 });

  if (!Array.isArray(body.sections) || body.sections.length === 0) {
    return NextResponse.json({ error: "sections required" }, { status: 400 });
  }

  const [latest] = await db
    .select()
    .from(guide)
    .where(eq(guide.studyId, studyId))
    .orderBy(desc(guide.version))
    .limit(1);

  const [created] = await db
    .insert(guide)
    .values({
      studyId,
      sections: body.sections as never,
      source: (body.source ?? "auto") as never,
      version: (latest?.version ?? 0) + 1,
    })
    .returning();

  return NextResponse.json({ guide: created });
}
