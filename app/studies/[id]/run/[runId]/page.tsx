import Link from "next/link";
import { notFound } from "next/navigation";
import { db } from "@/db/client";
import { run, event as eventTable, persona, insight as insightTable } from "@/db/schema";
import { asc, eq, inArray } from "drizzle-orm";
import { EventList, type DisplayEvent } from "@/components/EventStream";
import AnalyzeButton from "@/components/AnalyzeButton";

export const dynamic = "force-dynamic";

export default async function RunReplay({
  params,
}: {
  params: Promise<{ id: string; runId: string }>;
}) {
  const { id: studyId, runId } = await params;
  const [r] = await db.select().from(run).where(eq(run.id, runId));
  if (!r) notFound();

  const rows = await db
    .select()
    .from(eventTable)
    .where(eq(eventTable.runId, runId))
    .orderBy(asc(eventTable.seq));

  const events = rows.map((row) => row.payload as unknown as DisplayEvent);

  const panel =
    r.panelIds.length > 0
      ? await db.select().from(persona).where(inArray(persona.id, r.panelIds))
      : [];
  const personaById = Object.fromEntries(panel.map((p) => [p.id, p])) as Record<string, typeof panel[number]>;

  const insights = await db
    .select()
    .from(insightTable)
    .where(eq(insightTable.runId, runId));

  return (
    <main className="mx-auto max-w-5xl px-6 py-10 space-y-6">
      <header className="space-y-1">
        <div className="flex items-center justify-between">
          <Link
            href={`/studies/${studyId}`}
            className="text-xs text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100"
          >
            ← vFGI 상세
          </Link>
          <a
            href={`/api/reports/${r.id}/pdf`}
            target="_blank"
            rel="noopener"
            className="text-xs px-3 py-1 rounded-full border border-emerald-500 text-emerald-700 dark:text-emerald-400"
          >
            PDF 보고서 다운로드
          </a>
        </div>
        <h1 className="text-xl font-semibold tracking-tight">발언록 재생</h1>
        <p className="text-xs text-zinc-500 font-mono">{r.id}</p>
        <p className="text-xs text-zinc-500">
          상태 {r.status} · seed {r.seed} · 시작{" "}
          {r.startedAt ? new Date(r.startedAt).toLocaleString("ko-KR") : "-"} ·
          종료 {r.endedAt ? new Date(r.endedAt).toLocaleString("ko-KR") : "-"}
        </p>
      </header>

      {r.error && (
        <div className="rounded-lg border border-red-400 bg-red-50 dark:bg-red-950/30 px-4 py-2 text-sm text-red-700 dark:text-red-300">
          {r.error}
        </div>
      )}

      <section className="rounded-2xl border border-amber-300 bg-amber-50 dark:bg-amber-950/20 p-4 space-y-2">
        <div className="flex items-center justify-between">
          <h2 className="font-semibold text-sm">AI 심층 분석</h2>
          <AnalyzeButton studyId={studyId} runId={runId} />
        </div>
        {insights.length === 0 ? (
          <p className="text-xs text-zinc-600 dark:text-zinc-400">
            발언록 전체를 분석해 세그먼트별 인사이트·메트릭·KILL/KEEP/CHANGE 의사결정을 추출합니다. (모델 호출 30~90초)
          </p>
        ) : (
          <div className="space-y-2">
            <p className="text-xs text-zinc-500">{insights.length}개 인사이트 추출됨</p>
            <ul className="space-y-1 text-sm">
              {insights.map((i) => (
                <li key={i.id} className="rounded-lg bg-white dark:bg-zinc-900 px-3 py-2">
                  <span className="font-semibold mr-2">[{i.segment}]</span>
                  {i.theme}
                  {i.quote && (
                    <div className="text-xs italic text-zinc-600 dark:text-zinc-400 mt-1">
                      "{i.quote}"
                    </div>
                  )}
                </li>
              ))}
            </ul>
          </div>
        )}
      </section>

      <section>
        <EventList events={events} personaById={personaById} />
      </section>
    </main>
  );
}
