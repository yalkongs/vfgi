import Link from "next/link";
import { db } from "@/db/client";
import { study, calibration, run } from "@/db/schema";
import { desc, eq, sql, isNotNull } from "drizzle-orm";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  // 모든 Calibration
  const calibrations = await db
    .select()
    .from(calibration)
    .orderBy(desc(calibration.createdAt))
    .limit(50);

  // 모든 Run with realism scores
  const runsWithRealism = await db
    .select()
    .from(run)
    .where(isNotNull(run.realismScores))
    .orderBy(desc(run.createdAt))
    .limit(100);

  // Study 별 통계
  const studyStats = await db
    .select({
      id: study.id,
      title: study.title,
      runCount: sql<number>`(SELECT count(*)::int FROM ${run} WHERE ${run.studyId} = ${study.id})`,
      calibCount: sql<number>`(SELECT count(*)::int FROM ${calibration} WHERE ${calibration.studyId} = ${study.id})`,
    })
    .from(study)
    .orderBy(desc(study.createdAt))
    .limit(20);

  // 평균 일치율
  const avgAgreement =
    calibrations.length > 0
      ? calibrations.reduce((s, c) => {
          const d = (c.deltas ?? {}) as { agreementPct?: number };
          return s + (d.agreementPct ?? 0);
        }, 0) / calibrations.length
      : 0;

  // 평균 realism overall
  const realismRuns = runsWithRealism
    .map((r) => r.realismScores as { dcs?: number; ldi?: number; rds?: number; sas?: number } | null)
    .filter(Boolean) as Array<{ dcs: number; ldi: number; rds: number; sas: number }>;
  const avgDcs = realismRuns.reduce((s, r) => s + (r.dcs ?? 0), 0) / Math.max(1, realismRuns.length);
  const avgLdi = realismRuns.reduce((s, r) => s + (r.ldi ?? 0), 0) / Math.max(1, realismRuns.length);
  const avgRds = realismRuns.reduce((s, r) => s + (r.rds ?? 0), 0) / Math.max(1, realismRuns.length);
  const avgSas = realismRuns.reduce((s, r) => s + (r.sas ?? 0), 0) / Math.max(1, realismRuns.length);

  return (
    <main className="mx-auto max-w-6xl px-6 py-10 space-y-8">
      <header>
        <h1 className="text-2xl font-semibold tracking-tight">Realism · Calibration 대시보드</h1>
        <p className="text-sm text-zinc-500">
          전체 Study 의 Realism 4지표 평균과 Calibration 풀 누적 현황. 부부장의 "이게 정확해?" 무력화 자료의 핵심 지표.
        </p>
      </header>

      {/* Summary cards */}
      <section className="grid sm:grid-cols-4 gap-3">
        <Card label="누적 Calibration" value={calibrations.length.toString()} sub="실제 FGI 비교 N건" />
        <Card
          label="평균 일치율"
          value={`${avgAgreement.toFixed(0)}%`}
          sub="목표 ≥ 70%"
          tone={avgAgreement >= 70 ? "good" : avgAgreement >= 50 ? "warn" : "bad"}
        />
        <Card
          label="평균 SAS (정박성)"
          value={avgSas.toFixed(2)}
          sub="목표 ≥ 1.5"
          tone={avgSas >= 1.5 ? "good" : avgSas >= 1.0 ? "warn" : "bad"}
        />
        <Card
          label="평균 RDS (다양성)"
          value={avgRds.toFixed(2)}
          sub="목표 ≥ 0.35"
          tone={avgRds >= 0.35 ? "good" : avgRds >= 0.25 ? "warn" : "bad"}
        />
      </section>

      {/* Realism averages */}
      <section className="rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-5 space-y-3">
        <h2 className="font-semibold">전체 Run Realism 4지표 평균 ({realismRuns.length}건)</h2>
        <div className="grid sm:grid-cols-4 gap-2">
          <Bar label="DCS" value={avgDcs} max={1} good={0.85} />
          <Bar label="LDI" value={avgLdi} max={1} good={0.45} />
          <Bar label="RDS" value={avgRds} max={1} good={0.35} />
          <Bar label="SAS" value={avgSas} max={3} good={1.5} />
        </div>
      </section>

      {/* Study list */}
      <section className="space-y-3">
        <h2 className="font-semibold">Study 별 Realism · Calibration</h2>
        <div className="grid gap-2">
          {studyStats.map((s) => (
            <Link
              key={s.id}
              href={`/studies/${s.id}`}
              className="flex items-center justify-between gap-3 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 px-4 py-2 hover:border-emerald-500 text-sm"
            >
              <span className="font-medium truncate">{s.title}</span>
              <span className="text-xs text-zinc-500 whitespace-nowrap">
                Run {s.runCount} · Calibration {s.calibCount}
              </span>
            </Link>
          ))}
        </div>
      </section>

      {/* Calibration pool */}
      {calibrations.length > 0 && (
        <section className="space-y-3">
          <h2 className="font-semibold">Calibration 풀 ({calibrations.length}건)</h2>
          <div className="grid gap-2">
            {calibrations.slice(0, 20).map((c) => {
              const d = (c.deltas ?? {}) as { agreementPct?: number; verdict?: string };
              const agree = d.agreementPct ?? 0;
              const tone =
                agree >= 70 ? "text-emerald-700" : agree >= 50 ? "text-amber-700" : "text-rose-700";
              return (
                <Link
                  key={c.id}
                  href={`/studies/${c.studyId}`}
                  className="rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 px-4 py-2 hover:border-emerald-500 text-sm"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-medium">{c.title}</span>
                    <span className={`text-xs font-mono ${tone}`}>
                      일치율 {agree.toFixed(0)}%
                    </span>
                  </div>
                  {d.verdict && (
                    <p className="text-xs text-zinc-500 mt-1 line-clamp-1">{d.verdict}</p>
                  )}
                </Link>
              );
            })}
          </div>
        </section>
      )}
    </main>
  );
}

function Card({
  label,
  value,
  sub,
  tone,
}: {
  label: string;
  value: string;
  sub: string;
  tone?: "good" | "warn" | "bad";
}) {
  const bg =
    tone === "good"
      ? "bg-emerald-50 dark:bg-emerald-950/30 border-emerald-300"
      : tone === "warn"
      ? "bg-amber-50 dark:bg-amber-950/30 border-amber-300"
      : tone === "bad"
      ? "bg-rose-50 dark:bg-rose-950/30 border-rose-300"
      : "bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800";
  return (
    <div className={`rounded-xl border ${bg} p-4`}>
      <div className="text-xs uppercase tracking-wider text-zinc-500">{label}</div>
      <div className="text-2xl font-bold mt-1">{value}</div>
      <div className="text-xs text-zinc-500 mt-1">{sub}</div>
    </div>
  );
}

function Bar({
  label,
  value,
  max,
  good,
}: {
  label: string;
  value: number;
  max: number;
  good: number;
}) {
  const pct = Math.min(100, (value / max) * 100);
  const color = value >= good ? "bg-emerald-500" : value >= good * 0.6 ? "bg-amber-500" : "bg-rose-500";
  return (
    <div className="space-y-1">
      <div className="flex items-baseline justify-between">
        <span className="font-mono font-semibold">{label}</span>
        <span className="font-mono text-sm">{value.toFixed(2)}</span>
      </div>
      <div className="h-2 bg-zinc-200 dark:bg-zinc-800 rounded-full overflow-hidden">
        <div className={`h-full ${color}`} style={{ width: `${pct}%` }} />
      </div>
      <div className="text-[10px] text-zinc-500">목표 ≥ {good}</div>
    </div>
  );
}
