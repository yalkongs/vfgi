import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db/client";
import {
  study,
  stimulus,
  panelSpec,
  guide,
  type NewStudy,
} from "@/db/schema";
import { desc, eq } from "drizzle-orm";

export const runtime = "nodejs";

export async function GET() {
  const rows = await db
    .select()
    .from(study)
    .orderBy(desc(study.createdAt))
    .limit(100);
  return NextResponse.json({ studies: rows });
}

export async function POST(req: NextRequest) {
  const body = (await req.json()) as {
    title: string;
    objective: string;
    researchQuestions?: string[];
    tags?: string[];
    stimulus: {
      kind: string;
      title: string;
      body: string;
      attachments?: unknown[];
      competitors?: string[];
    };
    panel: {
      filters?: Record<string, unknown>;
      quotas?: unknown[];
      diversity?: string;
      size?: number;
      seed?: number;
    };
    guide?: { sections: unknown[]; source?: string };
  };

  const newStudy: NewStudy = {
    title: body.title,
    objective: body.objective,
    researchQuestions: body.researchQuestions ?? [],
    tags: body.tags ?? [],
    status: "draft",
  };

  const [created] = await db.insert(study).values(newStudy).returning();

  await db.insert(stimulus).values({
    studyId: created.id,
    kind: body.stimulus.kind as never,
    title: body.stimulus.title,
    body: body.stimulus.body,
    attachments: (body.stimulus.attachments ?? []) as never,
    competitors: body.stimulus.competitors ?? [],
  });

  await db.insert(panelSpec).values({
    studyId: created.id,
    filters: body.panel.filters ?? {},
    quotas: (body.panel.quotas ?? []) as never,
    diversity: body.panel.diversity ?? "medium",
    size: body.panel.size ?? 8,
    seed: body.panel.seed ?? 42,
  });

  if (body.guide) {
    await db.insert(guide).values({
      studyId: created.id,
      sections: body.guide.sections as never,
      source: (body.guide.source ?? "auto") as never,
    });
  }

  return NextResponse.json({ study: created });
}

export async function DELETE(req: NextRequest) {
  const id = req.nextUrl.searchParams.get("id");
  if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });
  await db.delete(study).where(eq(study.id, id));
  return NextResponse.json({ ok: true });
}
