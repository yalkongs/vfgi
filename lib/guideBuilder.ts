import { generateObject } from "ai";
import { z } from "zod";
import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import { pickModel } from "./modelRouter";

export const StimulusKindSchema = z.enum([
  "concept",
  "copy",
  "ux_screen",
  "ad_creative",
  "policy",
  "brand",
  "channel",
  "feature",
  "price",
  "competitor",
]);
export type StimulusKind = z.infer<typeof StimulusKindSchema>;

export const SectionSchema = z.object({
  key: z.string(),
  title: z.string(),
  prompts: z.array(z.string()),
});
export type Section = z.infer<typeof SectionSchema>;

export const GuideSchema = z.object({
  sections: z.array(SectionSchema),
});
export type Guide = z.infer<typeof GuideSchema>;

export type GuideBuilderInput = {
  kind: StimulusKind;
  objective: string;
  researchQuestions?: string[];
  stimulus: { title: string; body?: string; meta?: Record<string, unknown> };
  panelDescription?: string;
  rounds?: "quick" | "standard" | "deep";
};

const ROUND_TARGETS: Record<NonNullable<GuideBuilderInput["rounds"]>, number> = {
  quick: 3,
  standard: 6,
  deep: 8,
};

async function loadTemplate(kind: StimulusKind): Promise<string> {
  const file = resolve(
    process.cwd(),
    "prompts",
    "templates",
    "stimulus",
    `${kind}.md`
  );
  try {
    return await readFile(file, "utf8");
  } catch {
    return `# ${kind}\n진단 축: 인지·이해·매력·신뢰·의향`;
  }
}

const SYSTEM = `당신은 정성조사 가이드 설계자입니다. 입력된 자극물 종류·목적·연구질문에 맞춰 한국어 FGI 가이드를 JSON 으로 출력합니다. 마케팅 미사여구·이모지 금지. 질문은 구체적·답변 가능한 형태여야 합니다.`;

export async function buildGuide(input: GuideBuilderInput): Promise<Guide> {
  const template = await loadTemplate(input.kind);
  const target = ROUND_TARGETS[input.rounds ?? "standard"];

  const userPrompt = `# 자극물 종류: ${input.kind}
# 베이스 템플릿
${template}

# 조사 목적
${input.objective}

# 연구질문
${(input.researchQuestions ?? []).map((q, i) => `${i + 1}. ${q}`).join("\n") || "(없음)"}

# 자극물
- 제목: ${input.stimulus.title}
- 설명: ${input.stimulus.body ?? "(생략)"}
- 메타: ${JSON.stringify(input.stimulus.meta ?? {})}

# 패널 설명
${input.panelDescription ?? "(임의)"}

지시 (반드시 준수):
- 위 베이스 템플릿의 섹션 구조를 시작점으로, 자극물·목적·연구질문에 맞춰 정확히 ${target}개 섹션을 만든다.
- 각 섹션은 key(영문 snake_case), title(한국어), prompts(정확히 2~5개의 한국어 질문 문장)을 포함한다.
- 각 prompt 는 인터뷰 진행자가 그대로 읽을 수 있는 한 문장으로 작성한다.
- 연구질문이 있으면 evaluate 또는 closing 섹션에 분기 질문으로 자연스럽게 녹인다.
- 출력에는 sections 배열과 그 하위 객체만 포함한다.`;

  const { object } = await generateObject({
    model: pickModel("guidebuilder"),
    schema: GuideSchema,
    system: SYSTEM,
    prompt: userPrompt,
    temperature: 0.4,
  });

  return object;
}
