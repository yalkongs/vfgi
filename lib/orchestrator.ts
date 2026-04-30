import { streamText } from "ai";
import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import { pickModel, type ModelOverrides } from "./modelRouter";
import type { EventEmitter, FGIEvent } from "./eventStream";
import type { Persona, Stimulus } from "../db/schema";
import type { Section } from "./guideBuilder";

export type RunContext = {
  panel: Persona[];
  stimulus: Stimulus;
  guide: { sections: Section[] };
  objective: string;
  researchQuestions: string[];
  models?: ModelOverrides;
  seed?: number;
};

async function loadSystem(): Promise<string> {
  const file = resolve(process.cwd(), "prompts", "system", "moderator.md");
  return readFile(file, "utf8");
}

function panelBlock(panel: Persona[]): string {
  return panel
    .map((p) => {
      const f = (p.fields ?? {}) as Record<string, unknown>;
      const summary =
        (f["persona"] as string) ??
        (f["summary"] as string) ??
        `${p.sex} ${p.age}세 ${p.occupation}`;
      return `[${p.id}] ${p.name} / ${p.sex} ${p.age}세 / ${p.province} ${p.district} / ${p.occupation}
- 가족: ${p.familyType ?? "-"} | 주거: ${p.housingType ?? "-"} | 학력: ${p.educationLevel ?? "-"}
- 요약: ${summary}`;
    })
    .join("\n\n");
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
${panelBlock(ctx.panel)}

지금부터 vFGI를 시작하세요. 패널은 본인 페르소나에 일관되게 답해야 합니다. 첫 출력은 {"type":"section","key":"<첫섹션 key>",...} 으로 시작합니다.`;
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
