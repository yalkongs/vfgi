import Link from "next/link";
import { notFound } from "next/navigation";
import { db } from "@/db/client";
import { run, event as eventTable, study } from "@/db/schema";
import { asc, eq } from "drizzle-orm";
import { summarizeRun, compareRuns } from "@/lib/diff";

export const dynamic = "force-dynamic";

export default async function ComparePage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ a?: string; b?: string }>;
}) {
  const { id: studyId } = await params;
  const sp = await searchParams;
  const aId = sp.a;
  const bId = sp.b;
  if (!aId || !bId) notFound();

  const [s] = await db.select().from(study).where(eq(study.id, studyId));
  const [ra] = await db.select().from(run).where(eq(run.id, aId));
  const [rb] = await db.select().from(run).where(eq(run.id, bId));
  if (!s || !ra || !rb) notFound();

  const ea = await db
    .select()
    .from(eventTable)
    .where(eq(eventTable.runId, aId))
    .orderBy(asc(eventTable.seq));
  const eb = await db
    .select()
    .from(eventTable)
    .where(eq(eventTable.runId, bId))
    .orderBy(asc(eventTable.seq));

  const sa = summarizeRun(ra, ea);
  const sb = summarizeRun(rb, eb);
  const diff = compareRuns(sa, sb);

  return (
    <main className="mx-auto max-w-6xl px-6 py-10 space-y-6">
      <header className="space-y-1">
        <Link href={`/studies/${studyId}`} className="text-xs text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100">
          ← {s.title}
        </Link>
        <h1 className="text-xl font-semibold tracking-tight">A/B 비교</h1>
        <p className="text-xs text-zinc-500">
          A=<span className="font-mono">{aId.slice(0, 8)}</span> · B=<span className="font-mono">{bId.slice(0, 8)}</span>
        </p>
      </header>

      <section className="grid grid-cols-2 gap-4">
        <RunCard title="A" run={sa} />
        <RunCard title="B" run={sb} />
      </section>

      <section className="rounded-2xl bg-zinc-900 text-white dark:bg-white dark:text-zinc-900 p-5 space-y-2">
        <div className="text-sm uppercase tracking-wider opacity-70">핵심 차이</div>
        <div className="text-2xl font-semibold">
          수용도 변화{" "}
          {typeof diff.acceptanceDelta === "number" ? (
            <span className={diff.acceptanceDelta >= 0 ? "text-emerald-400" : "text-rose-400"}>
              {diff.acceptanceDelta >= 0 ? "+" : ""}
              {diff.acceptanceDelta.toFixed(1)}
            </span>
          ) : (
            <span className="opacity-50">(데이터 없음)</span>
          )}
        </div>
      </section>

      {diff.metricDeltas.length > 0 && (
        <section className="rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-5">
          <h2 className="font-semibold mb-3">메트릭 비교</h2>
          <table className="w-full text-sm">
            <thead className="text-left text-zinc-500 text-xs">
              <tr>
                <th className="py-1">메트릭</th>
                <th className="py-1">A</th>
                <th className="py-1">B</th>
                <th className="py-1">Δ</th>
              </tr>
            </thead>
            <tbody>
              {diff.metricDeltas.map((m) => (
                <tr key={m.key} className="border-t border-zinc-100 dark:border-zinc-800">
                  <td className="py-1.5 font-medium">{m.key}</td>
                  <td className="py-1.5 font-mono">{m.aValue.toFixed(2)}</td>
                  <td className="py-1.5 font-mono">{m.bValue.toFixed(2)}</td>
                  <td
                    className={`py-1.5 font-mono ${
                      m.delta > 0
                        ? "text-emerald-600"
                        : m.delta < 0
                        ? "text-rose-600"
                        : "text-zinc-400"
                    }`}
                  >
                    {m.delta >= 0 ? "+" : ""}
                    {m.delta.toFixed(2)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      )}

      <section className="grid sm:grid-cols-2 gap-4">
        <DiffList title="공통 매력 포인트" items={diff.sharedDrivers} tone="emerald" />
        <DiffList title="공통 장벽" items={diff.sharedBarriers} tone="rose" />
        <DiffList title="A 에만 있는 매력" items={diff.uniqueDriversA} tone="emerald" />
        <DiffList title="B 에만 있는 매력" items={diff.uniqueDriversB} tone="emerald" />
        <DiffList title="A 에만 있는 장벽" items={diff.uniqueBarriersA} tone="rose" />
        <DiffList title="B 에만 있는 장벽" items={diff.uniqueBarriersB} tone="rose" />
      </section>

      <section className="grid sm:grid-cols-3 gap-4">
        <DiffList title="공통 토픽" items={diff.sharedTopics} tone="zinc" />
        <DiffList title="A 만 다룬 토픽" items={diff.uniqueTopicsA} tone="zinc" />
        <DiffList title="B 만 다룬 토픽" items={diff.uniqueTopicsB} tone="zinc" />
      </section>
    </main>
  );
}

function RunCard({ title, run: r }: { title: string; run: ReturnType<typeof summarizeRun> }) {
  return (
    <div className="rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-5 space-y-2">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold">Run {title}</h3>
        <span className="text-xs text-zinc-500">seed {r.run.seed}</span>
      </div>
      <p className="text-xs text-zinc-500 font-mono">{r.run.id}</p>
      <p className="text-xs text-zinc-500">
        {r.run.startedAt ? new Date(r.run.startedAt).toLocaleString("ko-KR") : "-"}
      </p>
      <div className="text-sm space-y-1">
        <div>발언 {r.speaks}회 · {Math.round(r.durationMs / 1000)}초 · {r.tokens} tokens</div>
        {typeof r.verdict.acceptance === "number" && (
          <div>
            수용도 <span className="font-mono font-semibold">{r.verdict.acceptance}</span> /
            10 · 추천 <span className="font-medium">{r.verdict.recommend ?? "-"}</span>
          </div>
        )}
      </div>
    </div>
  );
}

function DiffList({
  title,
  items,
  tone,
}: {
  title: string;
  items: string[];
  tone: "emerald" | "rose" | "zinc";
}) {
  const toneCls = {
    emerald: "border-emerald-300 bg-emerald-50 dark:bg-emerald-950/20",
    rose: "border-rose-300 bg-rose-50 dark:bg-rose-950/20",
    zinc: "border-zinc-200 bg-white dark:bg-zinc-900 dark:border-zinc-800",
  }[tone];
  return (
    <div className={`rounded-xl border ${toneCls} p-4`}>
      <h4 className="text-sm font-semibold mb-2">{title}</h4>
      {items.length === 0 ? (
        <p className="text-xs text-zinc-400">(없음)</p>
      ) : (
        <ul className="text-sm space-y-1 list-disc list-inside">
          {items.map((x, i) => (
            <li key={i}>{x}</li>
          ))}
        </ul>
      )}
    </div>
  );
}
