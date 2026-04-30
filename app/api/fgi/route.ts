import { streamText, type LanguageModel } from "ai";
import { anthropic } from "@ai-sdk/anthropic";
import { PERSONAS, type Persona } from "@/data/personas";
import { MODERATOR_SYSTEM, buildContextPrompt } from "@/lib/prompts";

export const maxDuration = 300;

type RunRequest = {
  panelIds?: string[];
  model?: string;
};

function errEvent(text: string) {
  return JSON.stringify({ type: "error", text }) + "\n";
}

export async function POST(req: Request) {
  const body = (await req.json().catch(() => ({}))) as RunRequest;

  const ids =
    body.panelIds && body.panelIds.length > 0
      ? body.panelIds
      : PERSONAS.map((p) => p.id);
  const panel: Persona[] = PERSONAS.filter((p) => ids.includes(p.id));

  if (panel.length === 0) {
    return new Response(errEvent("패널이 비어 있습니다."), {
      status: 200,
      headers: { "content-type": "text/plain; charset=utf-8" },
    });
  }

  const useDirectAnthropic = !!process.env.ANTHROPIC_API_KEY;
  const model: LanguageModel = useDirectAnthropic
    ? anthropic(body.model?.replace(/^anthropic\//, "") ?? "claude-sonnet-4-5")
    : (body.model ?? "anthropic/claude-sonnet-4.6");

  const result = streamText({
    model,
    system: MODERATOR_SYSTEM,
    prompt: buildContextPrompt(panel),
    temperature: 0.85,
    onError: ({ error }) => {
      console.error("[fgi] streamText error", error);
    },
  });

  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      const encoder = new TextEncoder();
      try {
        for await (const chunk of result.textStream) {
          controller.enqueue(encoder.encode(chunk));
        }
        controller.close();
      } catch (e) {
        const msg =
          (e as { message?: string; statusCode?: number })?.message ??
          String(e);
        const status = (e as { statusCode?: number })?.statusCode;
        const userMsg =
          status === 401 || status === 403
            ? `LLM 인증 실패(${status}). AI Gateway 카드 등록 또는 다른 키로 전환하세요. 원문: ${msg}`
            : `LLM 호출 실패: ${msg}`;
        controller.enqueue(encoder.encode(errEvent(userMsg)));
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      "content-type": "text/plain; charset=utf-8",
      "x-fgi-panel": panel.map((p) => p.id).join(","),
      "cache-control": "no-cache, no-transform",
    },
  });
}
