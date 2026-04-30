import Link from "next/link";

type Variant = "compact" | "full" | "banner";

export default function TrustDisclosure({
  variant = "compact",
  calibrationDelta,
}: {
  variant?: Variant;
  calibrationDelta?: number;
}) {
  if (variant === "banner") {
    return (
      <div className="rounded-lg border border-amber-300 bg-amber-50 dark:bg-amber-950/30 px-4 py-2 text-xs text-amber-900 dark:text-amber-200 flex items-center gap-2 flex-wrap">
        <span className="font-semibold">⚠ 합성 시뮬레이션</span>
        <span>
          본 결과는 합성 페르소나 기반 시뮬레이션이며 실재 인물의 응답이 아닙니다.
          {typeof calibrationDelta === "number" && (
            <>
              {" "}실제 FGI 와 ±{calibrationDelta.toFixed(1)}% 차이 가능.
            </>
          )}{" "}
          큰 출시 결정 직전엔 실제 정성·정량 조사로 보정 권장.
        </span>
      </div>
    );
  }

  if (variant === "full") {
    return (
      <section className="rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-5 space-y-2 text-xs text-zinc-600 dark:text-zinc-400">
        <h3 className="font-semibold text-sm text-zinc-900 dark:text-zinc-100">
          데이터 출처 · 신뢰도 명시
        </h3>
        <p>
          본 vFGI 결과는{" "}
          <Link
            href="https://huggingface.co/datasets/nvidia/Nemotron-Personas-Korea"
            target="_blank"
            className="underline hover:text-emerald-600"
          >
            NVIDIA Nemotron-Personas-Korea
          </Link>{" "}
          데이터셋(CC BY 4.0)을 기반으로 생성된 합성 페르소나의 응답입니다. 통계청 KOSIS,
          대법원, 국민건강보험공단, 한국농촌경제연구원의 분포를 반영했지만 실재 인물의 응답이
          아닙니다.
        </p>
        <p>
          본 결과는 의사결정의 단독 근거가 될 수 없으며, "직감 결정 vs 외부 리서치" 사이의
          <strong className="text-zinc-900 dark:text-zinc-100">의사결정 가속기</strong>로
          활용해 주세요. 큰 출시 결정 직전엔 실제 정성·정량 조사로 보정이 필요합니다.
        </p>
        {typeof calibrationDelta === "number" && (
          <p className="rounded-lg bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-300 px-3 py-2">
            <span className="font-semibold text-emerald-700 dark:text-emerald-400">
              Calibration:{" "}
            </span>
            지난 외부 FGI 와 본 시뮬 결과의 일치율은 약{" "}
            <span className="font-mono">{(100 - Math.abs(calibrationDelta)).toFixed(1)}%</span>{" "}
            (Δ ±{calibrationDelta.toFixed(1)}%).
          </p>
        )}
      </section>
    );
  }

  // compact (default)
  return (
    <div className="text-xs text-zinc-500 dark:text-zinc-400 space-y-1">
      <p>
        ⚠ 합성 페르소나 기반 시뮬레이션. 실재 인물의 응답이 아닙니다.
      </p>
      <p>
        데이터 출처:{" "}
        <Link
          href="https://huggingface.co/datasets/nvidia/Nemotron-Personas-Korea"
          target="_blank"
          className="underline hover:text-emerald-600"
        >
          NVIDIA Nemotron-Personas-Korea (CC BY 4.0)
        </Link>
      </p>
    </div>
  );
}
