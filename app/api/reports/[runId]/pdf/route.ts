import { NextRequest } from "next/server";
import { db } from "@/db/client";
import {
  run,
  study,
  stimulus,
  event as eventTable,
  persona,
  report,
} from "@/db/schema";
import { eq, asc, inArray } from "drizzle-orm";
import { renderToBuffer } from "@react-pdf/renderer";
import { buildReportDocument } from "@/lib/pdf/report";
import { summarizeRun } from "@/lib/diff";
import { put } from "@vercel/blob";

export const runtime = "nodejs";
export const maxDuration = 120;

export async function GET(
  req: NextRequest,
  ctx: { params: Promise<{ runId: string }> }
) {
  const { runId } = await ctx.params;
  const persist = req.nextUrl.searchParams.get("persist") === "1";

  const [r] = await db.select().from(run).where(eq(run.id, runId));
  if (!r) return new Response("run not found", { status: 404 });

  const [s] = await db.select().from(study).where(eq(study.id, r.studyId));
  const [stim] = r.stimulusId
    ? await db.select().from(stimulus).where(eq(stimulus.id, r.stimulusId))
    : [];
  const events = await db
    .select()
    .from(eventTable)
    .where(eq(eventTable.runId, runId))
    .orderBy(asc(eventTable.seq));
  const panel = r.panelIds.length
    ? await db.select().from(persona).where(inArray(persona.id, r.panelIds))
    : [];

  if (!s || !stim) return new Response("study/stimulus missing", { status: 404 });

  const summary = summarizeRun(r, events);

  const doc = buildReportDocument({
    study: s,
    stimulus: stim,
    run: r,
    panel,
    summary,
  });

  const buffer = await renderToBuffer(doc);
  const filename = `vfgi-${s.title.replace(/\s+/g, "-")}-${r.id.slice(0, 8)}.pdf`;

  if (persist && process.env.BLOB_READ_WRITE_TOKEN) {
    try {
      const blob = await put(`reports/${filename}`, buffer, {
        access: "public",
        contentType: "application/pdf",
        token: process.env.BLOB_READ_WRITE_TOKEN,
      });
      await db
        .insert(report)
        .values({
          runId: r.id,
          kind: "exec",
          pdfBlobUrl: blob.url,
          summary: { speaks: summary.speaks, durationMs: summary.durationMs } as never,
        });
    } catch (e) {
      console.error("[pdf] blob upload failed", e);
    }
  }

  return new Response(new Uint8Array(buffer), {
    headers: {
      "content-type": "application/pdf",
      "content-disposition": `inline; filename="${encodeURIComponent(filename)}"`,
      "cache-control": "private, max-age=0, must-revalidate",
    },
  });
}
