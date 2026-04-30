import { generateObject } from "ai";
import { z } from "zod";
import { pickModel } from "../modelRouter";
import type { FGIEvent } from "../eventStream";
import type { Persona } from "../../db/schema";

const InsightSchema = z.object({
  segment: z.string(),
  theme: z.string(),
  quote: z.string().optional(),
  strength: z.number(),
  personaIds: z.array(z.string()),
});

const AnalysisSchema = z.object({
  insights: z.array(InsightSchema),
  metrics: z.array(
    z.object({
      key: z.string(),
      value: z.number(),
      perSegment: z.record(z.string(), z.number()).optional(),
    })
  ),
  verdict: z.object({
    acceptance: z.number(),
    recommend: z.string(),
    drivers: z.array(z.string()),
    barriers: z.array(z.string()),
  }),
  killKeepChange: z.object({
    kill: z.array(z.string()),
    keep: z.array(z.string()),
    change: z.array(z.string()),
  }),
  topQuotes: z.array(z.string()),
});

export type AnalystResult = z.infer<typeof AnalysisSchema>;

const SYSTEM = `당신은 정성조사 분석가입니다. 가상 포커스 그룹 인터뷰의 발언 전체를 보고, 다음을 산출합니다:
- 세그먼트별 인사이트 (지역·연령·직업 클러스터별 발견점)
- 정량 메트릭 (수용도·신뢰·차별성·이해도·구매의향 등 0~10)
- 최종 verdict (수용도·추천 가/부/조건부·핵심 매력·핵심 장벽)
- KILL/KEEP/CHANGE 의사결정 분류
- 핵심 인용구 (실제 발언 중 가장 의미 있는 6~10개)

원칙:
- 한국어로 작성
- 패널 발언 외 추측 금지
- 마케팅 미사여구 금지`;

export async function analyzeRun(
  events: FGIEvent[],
  panel: Persona[],
  objective: string
): Promise<AnalystResult> {
  const speaks = events.filter((e) => e.type === "speak");
  const transcript = speaks
    .map((e) => {
      if (e.type !== "speak") return "";
      const p = panel.find((x) => x.id === e.personaId);
      const seg = p ? `${p.province}/${p.age}대/${p.occupation}` : e.personaId;
      return `[${seg}] ${e.text}`;
    })
    .join("\n");

  const segmentList = panel
    .map(
      (p) =>
        `- ${p.id}: ${p.sex}/${p.age}세/${p.province} ${p.district}/${p.occupation}`
    )
    .join("\n");

  const prompt = `# 조사 목적
${objective}

# 패널
${segmentList}

# 발언록
${transcript}

위 발언록을 분석해 JSON 으로 산출하세요.`;

  const { object } = await generateObject({
    model: pickModel("analyst"),
    schema: AnalysisSchema,
    system: SYSTEM,
    prompt,
    temperature: 0.3,
  });

  return object;
}
