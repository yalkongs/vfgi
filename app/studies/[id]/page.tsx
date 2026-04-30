import Link from "next/link";
import { notFound } from "next/navigation";
import { db } from "@/db/client";
import { study, stimulus, panelSpec, guide, run, persona } from "@/db/schema";
import { eq, desc, inArray } from "drizzle-orm";
import { samplePanel } from "@/lib/personaSampler";
import RunRunner from "@/components/RunRunner";
import RegionCompareRunner from "@/components/RegionCompareRunner";
import TrustDisclosure from "@/components/TrustDisclosure";
import PersonaAudit from "@/components/PersonaAudit";
import CalibrationPanel from "@/components/CalibrationPanel";
import StudyDeleteButton from "@/components/StudyDeleteButton";
import GuideAutoGenerate from "@/components/GuideAutoGenerate";
import { buildAuditReport } from "@/lib/personaAudit";
import { calibration } from "@/db/schema";

export const dynamic = "force-dynamic";

export default async function StudyDetail({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [s] = await db.select().from(study).where(eq(study.id, id));
  if (!s) notFound();

  const [stim] = await db
    .select()
    .from(stimulus)
    .where(eq(stimulus.studyId, id))
    .orderBy(desc(stimulus.version))
    .limit(1);
  const [g] = await db
    .select()
    .from(guide)
    .where(eq(guide.studyId, id))
    .orderBy(desc(guide.version))
    .limit(1);
  const [ps] = await db
    .select()
    .from(panelSpec)
    .where(eq(panelSpec.studyId, id))
    .orderBy(desc(panelSpec.createdAt))
    .limit(1);

  const runs = await db
    .select()
    .from(run)
    .where(eq(run.studyId, id))
    .orderBy(desc(run.createdAt))
    .limit(20);

  const calRows = await db
    .select()
    .from(calibration)
    .where(eq(calibration.studyId, id))
    .orderBy(desc(calibration.createdAt))
    .limit(10);

  const previewPanel = ps
    ? await samplePanel({
        filters: ps.filters as never,
        quotas: (ps.quotas ?? []) as never,
        size: ps.size,
        seed: ps.seed,
      })
    : [];

  const missingGuide = !g;

  return (
    <main className="mx-auto max-w-5xl px-6 py-10 space-y-8">
      <header className="space-y-2">
        <div className="flex items-center justify-between">
          <Link href="/studies" className="text-xs text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100">
            ← vFGI 목록
          </Link>
          <div className="flex items-center gap-2">
            {runs.length > 0 && (
              <a
                href={`/api/reports/study/${s.id}/pdf`}
                target="_blank"
                rel="noopener"
                className="text-xs px-3 py-1 rounded-full bg-emerald-600 text-white font-medium hover:bg-emerald-700"
              >
                📄 통합 임원 보고서 PDF
              </a>
            )}
            <StudyDeleteButton studyId={s.id} studyTitle={s.title} />
          </div>
        </div>
        <h1 className="text-2xl font-semibold tracking-tight">{s.title}</h1>
        <p className="text-sm text-zinc-600 dark:text-zinc-400">{s.objective}</p>
        {s.researchQuestions && s.researchQuestions.length > 0 && (
          <ul className="text-xs text-zinc-500 list-disc list-inside">
            {s.researchQuestions.map((q, i) => (
              <li key={i}>{q}</li>
            ))}
          </ul>
        )}
        {s.tags && s.tags.length > 0 && (
          <div className="flex gap-1.5 flex-wrap">
            {s.tags.map((t) => (
              <span
                key={t}
                className="px-2 py-0.5 rounded-full bg-zinc-100 dark:bg-zinc-800 text-xs"
              >
                {t}
              </span>
            ))}
          </div>
        )}
      </header>

      {stim && (
        <section className="rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-5 space-y-2">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold">검증할 대상 — {stim.title}</h2>
            <span className="text-xs px-2 py-0.5 rounded-full bg-zinc-100 dark:bg-zinc-800">
              {stim.kind}
            </span>
          </div>
          <p className="text-sm whitespace-pre-wrap text-zinc-700 dark:text-zinc-300">
            {stim.body}
          </p>
          {stim.competitors && stim.competitors.length > 0 && (
            <div className="text-xs text-zinc-500">
              경쟁/비교 대상: {stim.competitors.join(", ")}
            </div>
          )}
        </section>
      )}

      <section className="rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-5 space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="font-semibold">참여자 ({previewPanel.length}명)</h2>
          <span className="text-xs text-zinc-500">시드 {ps?.seed} · 다양성 {ps?.diversity}</span>
        </div>
        <div className="grid gap-2 sm:grid-cols-2">
          {previewPanel.map((p) => (
            <div
              key={p.id}
              className="rounded-lg border border-zinc-200 dark:border-zinc-800 px-3 py-2 text-xs"
            >
              <div className="font-medium text-sm">{p.name}</div>
              <div className="text-zinc-500">
                {p.sex} {p.age}세 · {p.province} {p.district} · {p.occupation}
              </div>
            </div>
          ))}
        </div>
      </section>

      {missingGuide && stim && (
        <GuideAutoGenerate
          studyId={s.id}
          stimulusKind={stim.kind}
          stimulusTitle={stim.title}
          stimulusBody={stim.body}
          objective={s.objective}
          researchQuestions={(s.researchQuestions ?? []) as string[]}
        />
      )}

      {g && (
        <section className="rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-5 space-y-3">
          <h2 className="font-semibold">진행자 질문 가이드 ({g.sections.length}섹션 · {g.source === "auto" ? "AI 자동 생성" : g.source})</h2>
          <ol className="space-y-2 text-sm">
            {g.sections.map((sec, i) => (
              <li key={sec.key + i}>
                <span className="font-medium">
                  {i + 1}. {sec.title}
                </span>
                <ul className="ml-5 list-disc list-inside text-zinc-600 dark:text-zinc-400 text-xs">
                  {sec.prompts.map((q, j) => (
                    <li key={j}>{q}</li>
                  ))}
                </ul>
              </li>
            ))}
          </ol>
        </section>
      )}

      {previewPanel.length > 0 && (
        <PersonaAudit audit={buildAuditReport(previewPanel)} />
      )}

      <TrustDisclosure variant="banner" />

      <section className="rounded-2xl border-2 border-emerald-500/50 bg-emerald-50/30 dark:bg-emerald-950/10 p-5">
        <h2 className="font-semibold mb-3">▶ vFGI 단일 실행</h2>
        <p className="text-xs text-zinc-500 mb-3">
          참여자는{" "}
          <a
            href="https://huggingface.co/datasets/nvidia/Nemotron-Personas-Korea"
            target="_blank"
            rel="noopener noreferrer"
            className="underline hover:text-emerald-600"
          >
            NVIDIA Nemotron-Personas-Korea
          </a>{" "}
          기반 합성 페르소나입니다.
        </p>
        <RunRunner studyId={s.id} panel={previewPanel} />
      </section>

      <RegionCompareRunner
        studyId={s.id}
        panelById={Object.fromEntries(previewPanel.map((p) => [p.id, p]))}
      />

      <CalibrationPanel
        studyId={s.id}
        recentRun={runs[0] ? { id: runs[0].id, createdAt: runs[0].createdAt } : null}
        initialCalibrations={calRows.map((c) => ({
          id: c.id,
          title: c.title,
          createdAt: c.createdAt,
          realFgiSummary: (c.realFgiSummary ?? {}) as Record<string, unknown>,
          deltas: (c.deltas ?? {}) as never,
          runId: c.runId,
        }))}
      />

      {runs.length > 0 && (
        <section className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold">지난 실행 기록 ({runs.length}회)</h2>
            {runs.length >= 2 && (
              <Link
                href={`/studies/${s.id}/compare?a=${runs[0].id}&b=${runs[1].id}`}
                className="text-xs px-3 py-1 rounded-full border border-emerald-500 text-emerald-700 dark:text-emerald-400"
              >
                최근 2건 A/B 비교 →
              </Link>
            )}
          </div>
          <div className="grid gap-2">
            {runs.map((r) => (
              <div
                key={r.id}
                className="rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 px-4 py-2 text-sm"
              >
                <div className="flex items-center justify-between gap-2 flex-wrap">
                  <Link
                    href={`/studies/${s.id}/run/${r.id}`}
                    className="font-mono text-xs text-zinc-500 hover:text-emerald-600"
                  >
                    {r.id.slice(0, 8)}
                  </Link>
                  <span className="text-xs">
                    {r.status} · seed={r.seed} ·{" "}
                    {new Date(r.createdAt).toLocaleString("ko-KR")}
                  </span>
                  <div className="flex gap-2">
                    <Link
                      href={`/studies/${s.id}/run/${r.id}`}
                      className="text-xs px-2 py-0.5 rounded-full border border-zinc-300 dark:border-zinc-700 hover:border-emerald-500"
                    >
                      발언록
                    </Link>
                    <a
                      href={`/api/reports/${r.id}/pdf`}
                      target="_blank"
                      rel="noopener"
                      className="text-xs px-2 py-0.5 rounded-full border border-emerald-500 text-emerald-700 dark:text-emerald-400"
                    >
                      PDF
                    </a>
                  </div>
                </div>
                {r.metrics && Object.keys(r.metrics).length > 0 && (
                  <div className="text-xs text-zinc-500 mt-1">
                    {JSON.stringify(r.metrics)}
                  </div>
                )}
              </div>
            ))}
          </div>
        </section>
      )}
    </main>
  );
}

// silence unused warning
void inArray;
void persona;
