import { generateObject } from "ai";
import { z } from "zod";
import { pickModel } from "../modelRouter";
import type { FGIEvent } from "../eventStream";

export const RealFgiInputSchema = z.object({
  source: z.string().optional(),
  conductedAt: z.string().optional(),
  panelDescription: z.string().optional(),
  rawText: z.string(),
  acceptance: z.number().optional(),
  drivers: z.array(z.string()).optional(),
  barriers: z.array(z.string()).optional(),
});
export type RealFgiInput = z.infer<typeof RealFgiInputSchema>;

const CalibrationOutputSchema = z.object({
  acceptanceDelta: z.number(),
  agreementPct: z.number(),
  sharedDrivers: z.array(z.string()),
  sharedBarriers: z.array(z.string()),
  gaps: z.array(z.string()),
  verdict: z.string(),
  analysis: z.string(),
});
export type CalibrationOutput = z.infer<typeof CalibrationOutputSchema>;

const SYSTEM = `당신은 정성조사 비교 분석가입니다. 실제 외부 FGI 결과 1건과 vFGI 시뮬 결과 1건을 비교해 두 결과 사이의 일치 정도와 갭을 산출합니다.

원칙:
- 한국어로 작성. 한국 금융 도메인 표현 자연스럽게.
- 추측 금지. 양쪽 모두에 명시된 근거만 비교.
- 마케팅 미사여구 금지.

출력 필드:
- acceptanceDelta: 실제 FGI 와 vFGI 의 수용도 차이(percentage points). vFGI 가 더 높으면 +, 낮으면 -. 한쪽 데이터가 없으면 0.
- agreementPct: 0~100. 두 결과의 핵심 결론 일치 비율 추정. 70% 이상이면 vFGI 신뢰성 양호.
- sharedDrivers: 양쪽 모두에서 핵심 매력으로 언급된 항목.
- sharedBarriers: 양쪽 모두에서 핵심 장벽으로 언급된 항목.
- gaps: 한쪽에만 나오고 다른 쪽엔 없는 결정적 차이. 양쪽 갭 모두 표기 ("실제 FGI에만 있음: ...", "vFGI에만 있음: ...").
- verdict: 한 줄 판단 — "vFGI가 실제 FGI를 X%로 모사. 의사결정 근거로 활용 [가능|조건부 가능|보완 필요]."
- analysis: 3~5줄 종합 — 어디서 일치하고 어디서 갈렸는지, vFGI를 신뢰할 수 있는 영역과 보정이 필요한 영역.`;

export async function calibrateRun(
  realFgi: RealFgiInput,
  vfgiEvents: FGIEvent[],
  studyObjective: string
): Promise<CalibrationOutput> {
  const speaks = vfgiEvents
    .filter((e) => e.type === "speak")
    .map((e) => (e.type === "speak" ? `- ${e.text}` : ""))
    .join("\n");
  const insights = vfgiEvents
    .filter((e) => e.type === "insight")
    .map((e) => (e.type === "insight" ? `- [${e.segment}] ${e.theme}` : ""))
    .join("\n");
  const verdict = vfgiEvents.find((e) => e.type === "verdict");
  const verdictText =
    verdict && verdict.type === "verdict"
      ? `수용도: ${verdict.acceptance}/10 · 추천: ${verdict.recommend}\n핵심 매력: ${verdict.drivers.join(", ")}\n핵심 장벽: ${verdict.barriers.join(", ")}`
      : "(verdict 없음)";

  const realBlock = `## 실제 FGI 결과
출처: ${realFgi.source ?? "(미상)"}
실시: ${realFgi.conductedAt ?? "(미상)"}
패널: ${realFgi.panelDescription ?? "(미상)"}
수용도: ${realFgi.acceptance ?? "(미입력)"}
핵심 매력: ${(realFgi.drivers ?? []).join(", ") || "(미입력)"}
핵심 장벽: ${(realFgi.barriers ?? []).join(", ") || "(미입력)"}

원문/요약:
${realFgi.rawText}`;

  const simBlock = `## vFGI 시뮬 결과
조사 목적: ${studyObjective}

verdict:
${verdictText}

세그먼트 인사이트:
${insights || "(없음)"}

발언 (전체):
${speaks}`;

  const { object } = await generateObject({
    model: pickModel("analyst"),
    schema: CalibrationOutputSchema,
    system: SYSTEM,
    prompt: `${realBlock}\n\n${simBlock}\n\n위 두 결과를 비교해 JSON 으로 산출하세요.`,
    temperature: 0.2,
  });

  return object;
}
