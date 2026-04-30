import { streamText } from "ai";
import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import { pickModel, type ModelOverrides } from "./modelRouter";
import type { EventEmitter, FGIEvent } from "./eventStream";
import type { Persona, Stimulus } from "../db/schema";
import type { Section } from "./guideBuilder";
import { buildPersonaCard } from "./persona/buildPersonaCard";

export type RunContext = {
  panel: Persona[];
  stimulus: Stimulus;
  guide: { sections: Section[] };
  objective: string;
  researchQuestions: string[];
  models?: ModelOverrides;
  seed?: number;
  precisionMode?: boolean; // E9 — 자기검증 옵션
};

async function loadSystem(): Promise<string> {
  const file = resolve(process.cwd(), "prompts", "system", "moderator.md");
  return readFile(file, "utf8");
}

function panelBlock(panel: Persona[], stimulusKind: string): string {
  return panel
    .map((p) => `### [${p.id}] ${p.name}\n${buildPersonaCard(p, stimulusKind)}`)
    .join("\n\n--------------------------------------------------\n\n");
}

function sectionsBlock(sections: Section[]): string {
  return sections
    .map(
      (s, i) =>
        `${i + 1}. [${s.key}] ${s.title}\n   질문: ${s.prompts.join(" / ")}`
    )
    .join("\n");
}

function buildPrompt(ctx: RunContext): string {
  return `# 자극물 (${ctx.stimulus.kind})
- 제목: ${ctx.stimulus.title}
- 설명: ${ctx.stimulus.body}
- 메타: ${JSON.stringify({
    competitors: ctx.stimulus.competitors,
    attachments: ctx.stimulus.attachments,
  })}

# 조사 목적
${ctx.objective}

# 연구질문
${ctx.researchQuestions.map((q, i) => `${i + 1}. ${q}`).join("\n") || "(없음)"}

# 진행 가이드 (이 순서대로 모두 진행)
${sectionsBlock(ctx.guide.sections)}

# 패널 (총 ${ctx.panel.length}명)

각 패널은 아래 페르소나 카드의 모든 레이어(직업·가족·취미·여행·음식·문화 + 시군구 컨텍스트 + 어조 가이드 + 금융 행동 합성 + 교호작용 보정) 를 발화에 일관되게 반영해야 합니다.

${panelBlock(ctx.panel, ctx.stimulus.kind)}

# 진행 원칙 (강제)

- 첫 섹션(warmup) 에서 각 패널은 자기소개 1회 — "이름·지역·직업·요즘 한 장면(페르소나 카드의 디테일 인용)".
- 모든 발화는 본인 페르소나의 가족·일·금융 컨텍스트 디테일을 자연스럽게 1~2회 인용.
- 각 섹션마다 패널 간 cross-talk 최소 1회 (반박 또는 보완).
- 어조는 페르소나 카드의 [어조 가이드] 를 따르되 과장하지 않음.
${ctx.precisionMode ? "- [정밀 모드] 발화 후 페르소나 카드와 모순되는 점이 있는지 자기검증하고, 모순 발견 시 발화 수정." : ""}

지금부터 vFGI를 시작하세요. 첫 출력은 {"type":"section","key":"<첫섹션 key>",...} 으로 시작합니다.`;
}

function tryParseLine(line: string): FGIEvent | null {
  const trimmed = line.trim();
  if (!trimmed) return null;
  if (/^```/.test(trimmed)) return null;
  if (/^(?:json|jsonl)\s*$/i.test(trimmed)) return null;
  try {
    const obj = JSON.parse(trimmed);
    if (typeof obj?.type === "string") return obj as FGIEvent;
  } catch {
    const m = trimmed.match(/\{[\s\S]*\}$/);
    if (m) {
      try {
        const obj = JSON.parse(m[0]);
        if (typeof obj?.type === "string") return obj as FGIEvent;
      } catch {}
    }
  }
  return null;
}

export async function runVFGI(
  ctx: RunContext,
  emitter: EventEmitter
): Promise<{ tokens: number; durationMs: number; speaks: number }> {
  const start = Date.now();
  const system = await loadSystem();
  const prompt = buildPrompt(ctx);

  const result = streamText({
    model: pickModel("moderator", ctx.models),
    system,
    prompt,
    temperature: 0.85,
    onError: ({ error }) => {
      console.error("[orchestrator] streamText error", error);
    },
  });

  let buffer = "";
  let speaks = 0;
  let endEmitted = false;

  for await (const chunk of result.textStream) {
    buffer += chunk;
    let nlIdx: number;
    while ((nlIdx = buffer.indexOf("\n")) >= 0) {
      const line = buffer.slice(0, nlIdx);
      buffer = buffer.slice(nlIdx + 1);
      const ev = tryParseLine(line);
      if (!ev) continue;
      if (ev.type === "speak") speaks++;
      if (ev.type === "end") endEmitted = true;
      emitter.emit(ev);
    }
  }
  const tail = tryParseLine(buffer);
  if (tail) {
    if (tail.type === "speak") speaks++;
    if (tail.type === "end") endEmitted = true;
    emitter.emit(tail);
  }

  const durationMs = Date.now() - start;
  let tokens = 0;
  try {
    const usage = await result.usage;
    tokens = (usage?.inputTokens ?? 0) + (usage?.outputTokens ?? 0);
  } catch {}

  if (!endEmitted) {
    emitter.emit({ type: "end", stats: { speaks, durationMs, tokens } });
  }

  return { tokens, durationMs, speaks };
}
