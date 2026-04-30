import type { AuditReport } from "@/lib/personaAudit";

export default function PersonaAudit({ audit }: { audit: AuditReport }) {
  return (
    <section className="rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-5 space-y-4">
      <header className="flex items-center justify-between">
        <h2 className="font-semibold">패널 분포 검증 (Persona Audit)</h2>
        <span className="text-xs text-zinc-500">
          {audit.panelSize}명 패널 · 통계청 KOSIS 분포와 비교
        </span>
      </header>
      <p className="text-xs text-zinc-600 dark:text-zinc-400">
        본 패널이 어떤 인구통계 분포에서 추출되었는지 시각화합니다. 통계청 KOSIS 의
        실제 한국 인구 분포와 비교해 패널의 대표성을 직접 확인할 수 있습니다.
      </p>

      <Section title="시도(권역) 분포">
        <CompareBars rows={audit.provinceVsKostat} />
      </Section>

      <Section title="연령대 분포">
        <CompareBars rows={audit.ageVsKostat} />
      </Section>

      <div className="grid sm:grid-cols-2 gap-4">
        <Section title="성별">
          <SimpleBars buckets={audit.sex.buckets} />
        </Section>
        <Section title="가구 유형 (상위 6)">
          <SimpleBars buckets={audit.family.buckets} />
        </Section>
      </div>
    </section>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="space-y-2">
      <h3 className="text-sm font-semibold">{title}</h3>
      {children}
    </div>
  );
}

function SimpleBars({
  buckets,
}: {
  buckets: { label: string; count: number; pct: number }[];
}) {
  if (buckets.length === 0) return <p className="text-xs text-zinc-400">(데이터 없음)</p>;
  return (
    <div className="space-y-1.5">
      {buckets.map((b) => (
        <div key={b.label} className="text-xs">
          <div className="flex items-center justify-between">
            <span>{b.label}</span>
            <span className="font-mono text-zinc-500">
              {b.count} · {b.pct.toFixed(1)}%
            </span>
          </div>
          <div className="h-1.5 bg-zinc-100 dark:bg-zinc-800 rounded-full overflow-hidden">
            <div
              className="h-full bg-emerald-500"
              style={{ width: `${Math.min(100, b.pct)}%` }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}

function CompareBars({
  rows,
}: {
  rows: { label: string; panelPct: number; kostatPct: number; deltaPct: number }[];
}) {
  if (rows.length === 0) return <p className="text-xs text-zinc-400">(데이터 없음)</p>;
  return (
    <div className="space-y-2">
      <div className="grid grid-cols-12 text-[10px] text-zinc-500 uppercase tracking-wider">
        <span className="col-span-2">구분</span>
        <span className="col-span-4">패널</span>
        <span className="col-span-4">KOSIS</span>
        <span className="col-span-2 text-right">Δ</span>
      </div>
      {rows.map((r) => {
        const max = Math.max(r.panelPct, r.kostatPct, 1);
        return (
          <div key={r.label} className="grid grid-cols-12 items-center gap-2 text-xs">
            <span className="col-span-2 font-medium">{r.label}</span>
            <div className="col-span-4">
              <div className="h-2 bg-zinc-100 dark:bg-zinc-800 rounded-full overflow-hidden">
                <div
                  className="h-full bg-emerald-500"
                  style={{ width: `${(r.panelPct / max) * 100}%` }}
                />
              </div>
              <span className="text-[10px] text-zinc-500 font-mono">
                {r.panelPct.toFixed(1)}%
              </span>
            </div>
            <div className="col-span-4">
              <div className="h-2 bg-zinc-100 dark:bg-zinc-800 rounded-full overflow-hidden">
                <div
                  className="h-full bg-zinc-400"
                  style={{ width: `${(r.kostatPct / max) * 100}%` }}
                />
              </div>
              <span className="text-[10px] text-zinc-500 font-mono">
                {r.kostatPct.toFixed(1)}%
              </span>
            </div>
            <span
              className={`col-span-2 text-right font-mono text-[11px] ${
                Math.abs(r.deltaPct) < 5
                  ? "text-zinc-500"
                  : r.deltaPct > 0
                  ? "text-emerald-600"
                  : "text-rose-600"
              }`}
            >
              {r.deltaPct >= 0 ? "+" : ""}
              {r.deltaPct.toFixed(1)}
            </span>
          </div>
        );
      })}
    </div>
  );
}
