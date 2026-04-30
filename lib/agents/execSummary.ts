import { generateObject } from "ai";
import { z } from "zod";
import { pickModel } from "../modelRouter";
import type { Study, Run, Stimulus, Insight, Calibration } from "../../db/schema";
import type { RunSummary } from "../diff";

export const ExecSummarySchema = z.object({
  headline: z.string(), // 한 줄 결론
  recommendation: z.string(), // 가/부/조건부
  acceptanceWeighted: z.number(), // Run 가중평균 수용도
  keyFindings: z.array(z.string()), // 4~6개
  segmentDifferences: z.array(
    z.object({
      segment: z.string(),
      finding: z.string(),
    })
  ),
  drivers: z.array(z.string()),
  barriers: z.array(z.string()),
  killKeepChange: z.object({
    kill: z.array(z.string()),
    keep: z.array(z.string()),
    change: z.array(z.string()),
  }),
  nextActions: z.array(z.string()), // 임원 의사결정 액션 3~5개
  trustNote: z.string(), // Calibration·신뢰도 한 줄
});
export type ExecSummary = z.infer<typeof ExecSummarySchema>;

const SYSTEM = `당신은 iM뱅크 임원 보고를 작성하는 정성·정량 통합 분석가입니다.
한 Study(주제)에서 진행된 여러 vFGI Run · 권역 비교 · Calibration 결과를 모두 본 뒤,
임원 1페이지짜리 의사결정 자료의 텍스트 본문을 한국어로 작성합니다.

원칙:
- 데이터에 근거. 추측·미사여구 금지.
- 임원이 5분 안에 읽고 그린라이트/레드라이트 결정 가능한 수준의 압축.
- 권역·세그먼트별 갈림이 있으면 명시적으로.
- Calibration 결과가 있으면 신뢰도(일치율) 한 줄에 포함.
- nextActions 는 본인 부서가 다음 분기에 실제로 할 수 있는 구체 액션.

출력 필드 가이드:
- headline: 한 줄 결론. "iM 톡톡 적금 30대 워킹맘 수용도 양호, 단 출석 우대 부담 우려" 처럼.
- acceptanceWeighted: 모든 Run 의 수용도 평균(0-10). 데이터 없으면 추정 금지하고 -1.
- keyFindings: 4~6개. 각 1줄. Run·Calibration·권역비교에서 발견된 가장 중요한 사실.
- segmentDifferences: 권역·연령·직업군별로 갈린 결론. 갈린 게 없으면 빈 배열.
- drivers/barriers: 모든 Run에서 반복적으로 등장한 매력·장벽 통합.
- killKeepChange: 자극물의 어느 요소를 죽이고/유지하고/바꿀지 의사결정 분류.
- nextActions: 임원 결재 후 본부장·실무자가 다음 분기에 즉시 시작할 수 있는 액션.
- trustNote: "Calibration 일치율 N% — 의사결정 근거로 [활용 가능 / 보완 필요]" 또는 Calibration 없으면 "Calibration 미실시. 본 결과는 합성 시뮬이며 실제 정성 조사로 보정 권장."`;

export type ExecSummaryInput = {
  study: Study;
  stimulus?: Stimulus | null;
  runSummaries: RunSummary[];
  insights: Insight[];
  calibrations: Calibration[];
};

export async function generateExecSummary(input: ExecSummaryInput): Promise<ExecSummary> {
  const { study, stimulus, runSummaries, insights, calibrations } = input;

  const runBlock = runSummaries
    .map(
      (s, i) =>
        `### Run ${i + 1} ${s.run.compareLabel ? `(${s.run.compareLabel})` : ""}
- 발언: ${s.speaks}회
- 수용도: ${s.verdict.acceptance ?? "-"}/10
- 추천: ${s.verdict.recommend ?? "-"}
- 매력: ${(s.verdict.drivers ?? []).join(", ") || "-"}
- 장벽: ${(s.verdict.barriers ?? []).join(", ") || "-"}
- 메트릭: ${Object.entries(s.metrics).map(([k, v]) => `${k}=${v.toFixed(2)}`).join(" · ") || "-"}
- 인용구 hint: ${s.topQuotes.slice(0, 3).join(" / ") || "-"}`
    )
    .join("\n\n");

  const insightBlock = insights
    .slice(0, 30)
    .map((i) => `- [${i.segment}] ${i.theme}${i.quote ? ` // "${i.quote}"` : ""}`)
    .join("\n");

  const calibBlock = calibrations
    .map((c, i) => {
      const d = c.deltas as Record<string, unknown>;
      return `### Calibration ${i + 1} ${c.title}
- 일치율: ${typeof d.agreementPct === "number" ? d.agreementPct.toFixed(0) + "%" : "-"}
- 수용도Δ: ${typeof d.acceptanceDelta === "number" ? d.acceptanceDelta.toFixed(1) : "-"}
- verdict: ${typeof d.verdict === "string" ? d.verdict : "-"}
- 분석: ${typeof d.analysis === "string" ? d.analysis : "-"}`;
    })
    .join("\n\n");

  const prompt = `# Study
- 제목: ${study.title}
- 목적: ${study.objective}
- 연구질문: ${(study.researchQuestions ?? []).map((q, i) => `${i + 1}) ${q}`).join(" / ") || "-"}
- 태그: ${(study.tags ?? []).join(", ") || "-"}

# 자극물
${stimulus ? `- ${stimulus.kind} | ${stimulus.title}\n${stimulus.body}` : "-"}

# 진행된 vFGI Run (${runSummaries.length}건)
${runBlock || "-"}

# 누적 인사이트 (${insights.length}건 중 30개 샘플)
${insightBlock || "-"}

# Calibration (${calibrations.length}건)
${calibBlock || "-"}

위 데이터를 종합해 임원 1페이지 요약을 JSON 으로 출력하세요.`;

  const { object } = await generateObject({
    model: pickModel("reportwriter"),
    schema: ExecSummarySchema,
    system: SYSTEM,
    prompt,
    temperature: 0.3,
  });

  return object;
}
