import { NextRequest } from "next/server";
import { db } from "@/db/client";
import {
  study,
  stimulus,
  guide as guideTable,
  panelSpec,
  run,
  event as eventTable,
  persona,
} from "@/db/schema";
import { eq, desc, inArray } from "drizzle-orm";
import { samplePanel, type PanelFilters } from "@/lib/personaSampler";
import { runVFGI, type RunContext } from "@/lib/orchestrator";
import { makeStream, type FGIEvent } from "@/lib/eventStream";
import { modelTagsForRun } from "@/lib/modelRouter";
import { computeRealismScores } from "@/lib/agents/realismJudge";
import crypto from "node:crypto";

export const runtime = "nodejs";
export const maxDuration = 300;

type RunBody = {
  filtersOverride?: PanelFilters;
  compareGroup?: string;
  compareLabel?: string;
  precisionMode?: boolean;
  naturalDistribution?: boolean;
};

export async function POST(
  req: NextRequest,
  ctx: { params: Promise<{ id: string }> }
) {
  const { id: studyId } = await ctx.params;
  const body = (await req.json().catch(() => ({}))) as RunBody;

  const [s] = await db.select().from(study).where(eq(study.id, studyId));
  if (!s) return new Response("study not found", { status: 404 });

  const [stim] = await db
    .select()
    .from(stimulus)
    .where(eq(stimulus.studyId, studyId))
    .orderBy(desc(stimulus.version))
    .limit(1);
  const [g] = await db
    .select()
    .from(guideTable)
    .where(eq(guideTable.studyId, studyId))
    .orderBy(desc(guideTable.version))
    .limit(1);
  const [ps] = await db
    .select()
    .from(panelSpec)
    .where(eq(panelSpec.studyId, studyId))
    .orderBy(desc(panelSpec.createdAt))
    .limit(1);

  if (!stim || !g || !ps) {
    return new Response("study missing stimulus/guide/panelSpec", {
      status: 400,
    });
  }

  const filters = body.filtersOverride ?? (ps.filters as PanelFilters);
  const panel = await samplePanel({
    filters,
    quotas: body.filtersOverride ? [] : ((ps.quotas ?? []) as never),
    size: ps.size,
    seed: ps.seed + (body.compareLabel ? body.compareLabel.length : 0),
    naturalDistribution: body.naturalDistribution,
  });

  const seed = ps.seed;
  const promptHash = crypto
    .createHash("sha256")
    .update(JSON.stringify({ studyId, stim: stim.id, guide: g.id, seed }))
    .digest("hex");

  const [r] = await db
    .insert(run)
    .values({
      studyId,
      stimulusId: stim.id,
      guideId: g.id,
      panelIds: panel.map((p) => p.id),
      models: modelTagsForRun(),
      seed,
      promptHash,
      status: "running",
      startedAt: new Date(),
      compareGroup: body.compareGroup ?? null,
      compareLabel: body.compareLabel ?? null,
    })
    .returning();

  const runContext: RunContext = {
    panel,
    stimulus: stim,
    guide: { sections: g.sections as never },
    objective: s.objective,
    researchQuestions: (s.researchQuestions ?? []) as string[],
    seed,
    precisionMode: body.precisionMode,
  };

  const { stream, start } = makeStream();

  start(async (emitter) => {
    try {
      const persistEvent = async (ev: { seq: number; type: string }) => {
        await db.insert(eventTable).values({
          runId: r.id,
          seq: ev.seq,
          type: ev.type,
          payload: ev as never,
        });
      };
      const origEmit = emitter.emit.bind(emitter);
      emitter.emit = (ev) => {
        const seqEv = origEmit(ev);
        void persistEvent(seqEv);
        return seqEv;
      };

      const stats = await runVFGI(runContext, emitter);

      // E10 — 종료 후 realism 점수 자동 계산
      const allEvents = await db
        .select({ payload: eventTable.payload })
        .from(eventTable)
        .where(eq(eventTable.runId, r.id));
      const eventList = allEvents.map(
        (e) => e.payload as unknown as FGIEvent
      );
      const realismScores = computeRealismScores(eventList, panel);

      await db
        .update(run)
        .set({
          status: "succeeded",
          endedAt: new Date(),
          tokensIn: 0,
          tokensOut: stats.tokens,
          metrics: { speaks: stats.speaks, durationMs: stats.durationMs } as never,
          realismScores: realismScores as never,
          precisionMode: body.precisionMode ? "on" : "off",
        })
        .where(eq(run.id, r.id));
    } catch (e) {
      await db
        .update(run)
        .set({
          status: "failed",
          endedAt: new Date(),
          error: (e as Error).message ?? String(e),
        })
        .where(eq(run.id, r.id));
      emitter.emit({
        type: "error",
        text: (e as Error).message ?? String(e),
      });
    }
  });

  return new Response(stream, {
    headers: {
      "content-type": "text/event-stream; charset=utf-8",
      "cache-control": "no-cache, no-transform",
      "x-run-id": r.id,
      "x-panel-size": String(panel.length),
    },
  });
}

export async function GET(
  req: NextRequest,
  ctx: { params: Promise<{ id: string }> }
) {
  const { id: studyId } = await ctx.params;
  const runs = await db
    .select()
    .from(run)
    .where(eq(run.studyId, studyId))
    .orderBy(desc(run.createdAt))
    .limit(50);
  return new Response(JSON.stringify({ runs }), {
    headers: { "content-type": "application/json" },
  });
}

export async function PATCH() {
  return new Response("not implemented", { status: 501 });
}

export async function DELETE() {
  return new Response("not implemented", { status: 501 });
}

export async function _useUnused() {
  await db.select().from(persona).limit(1);
  inArray;
}
