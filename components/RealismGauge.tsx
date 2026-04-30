import { realismGrade, type RealismScores } from "@/lib/agents/realismJudge";

export default function RealismGauge({ scores }: { scores: RealismScores }) {
  const grade = realismGrade(scores);
  const tone =
    grade.grade === "A"
      ? "border-emerald-400 bg-emerald-50 dark:bg-emerald-950/30"
      : grade.grade === "B"
      ? "border-blue-400 bg-blue-50 dark:bg-blue-950/30"
      : grade.grade === "C"
      ? "border-amber-400 bg-amber-50 dark:bg-amber-950/30"
      : "border-rose-400 bg-rose-50 dark:bg-rose-950/30";

  return (
    <section className={`rounded-2xl border-2 ${tone} p-5 space-y-3`}>
      <header className="flex items-center justify-between flex-wrap gap-2">
        <div>
          <h2 className="font-semibold">응답 현실성 (Realism Scores)</h2>
          <p className="text-xs text-zinc-600 dark:text-zinc-400 mt-1">
            DCS·LDI·RDS·SAS 4지표 자동 측정. 데이터셋 특성·페르소나 카드와의 일관성 평가.
          </p>
        </div>
        <div className="text-right">
          <div className="text-3xl font-bold leading-none">{grade.grade}</div>
          <div className="text-xs text-zinc-500">overall {grade.overall.toFixed(1)}/100</div>
        </div>
      </header>

      <div className="grid sm:grid-cols-4 gap-2">
        <Bar label="DCS" sub="인구학 일관성" value={scores.dcs} max={1} good={0.85} />
        <Bar label="LDI" sub="언어 다양성" value={scores.ldi} max={1} good={0.45} />
        <Bar label="RDS" sub="응답 다양성" value={scores.rds} max={1} good={0.35} />
        <Bar label="SAS" sub="상황 정박성" value={scores.sas} max={3} good={1.5} />
      </div>

      {grade.notes.length > 0 && (
        <div className="text-xs space-y-1">
          {grade.notes.map((n, i) => (
            <div key={i} className="text-amber-700 dark:text-amber-300">⚠ {n}</div>
          ))}
        </div>
      )}

      <details className="text-xs">
        <summary className="cursor-pointer text-zinc-500">측정 디테일</summary>
        <div className="mt-2 space-y-0.5 text-zinc-600 dark:text-zinc-400">
          <div>발언 수: {scores.details.speakCount}</div>
          <div>평균 발언 길이: {scores.details.avgSpeakLength}자 (σ={scores.details.speakLengthStd})</div>
          <div>패널 간 어휘 유사도(Jaccard 평균): {scores.details.pairwiseSimilarity}</div>
          <div>페르소나 인용 풀 크기: {scores.details.referencePool}</div>
          <div>측정 시각: {new Date(scores.computedAt).toLocaleString("ko-KR")}</div>
        </div>
      </details>
    </section>
  );
}

function Bar({
  label,
  sub,
  value,
  max,
  good,
}: {
  label: string;
  sub: string;
  value: number;
  max: number;
  good: number;
}) {
  const pct = Math.min(100, (value / max) * 100);
  const color = value >= good ? "bg-emerald-500" : value >= good * 0.6 ? "bg-amber-500" : "bg-rose-500";
  return (
    <div className="space-y-1">
      <div className="flex items-baseline justify-between">
        <span className="font-mono font-semibold text-sm">{label}</span>
        <span className="text-[10px] text-zinc-500">{sub}</span>
      </div>
      <div className="text-lg font-mono">{value.toFixed(2)}</div>
      <div className="h-1.5 bg-zinc-200 dark:bg-zinc-800 rounded-full overflow-hidden">
        <div className={`h-full ${color}`} style={{ width: `${pct}%` }} />
      </div>
      <div className="text-[10px] text-zinc-500">목표 ≥ {good}</div>
    </div>
  );
}
