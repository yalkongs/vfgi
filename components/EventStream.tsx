"use client";

import type { FGIEvent } from "@/lib/eventStream";
import type { Persona } from "@/db/schema";

export type DisplayEvent = FGIEvent & { seq?: number };

export function EventList({
  events,
  personaById,
}: {
  events: DisplayEvent[];
  personaById: Record<string, Persona>;
}) {
  return (
    <div className="space-y-2">
      {events.map((e, i) => (
        <EventRow key={(e.seq ?? i) + ":" + e.type} ev={e} personaById={personaById} />
      ))}
    </div>
  );
}

export function EventRow({
  ev,
  personaById,
}: {
  ev: DisplayEvent;
  personaById: Record<string, Persona>;
}) {
  if (ev.type === "section") {
    return (
      <div className="mt-6 mb-2 text-sm font-semibold uppercase tracking-wider text-emerald-700 dark:text-emerald-400">
        ── {ev.title} (round {ev.round}) ──
      </div>
    );
  }
  if (ev.type === "moderator") {
    return (
      <div className="rounded-lg border-l-4 border-emerald-500 bg-emerald-50 dark:bg-emerald-950/30 px-4 py-2 text-sm">
        <span className="font-semibold mr-2">진행자</span>
        {ev.text}
      </div>
    );
  }
  if (ev.type === "speak") {
    const p = personaById[ev.personaId];
    return (
      <div className="rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 px-4 py-2 text-sm">
        <div className="flex items-center gap-2 text-xs text-zinc-500">
          <span className="font-semibold text-zinc-900 dark:text-zinc-100">
            {p?.name ?? ev.personaId}
          </span>
          {p && (
            <span>
              · {p.sex} {p.age}세 · {p.province} {p.district} · {p.occupation}
            </span>
          )}
          {typeof ev.sentiment === "number" && (
            <span className="ml-auto text-[10px] text-zinc-400">
              sentiment {ev.sentiment.toFixed(2)}
            </span>
          )}
        </div>
        <p className="mt-1 leading-relaxed">{ev.text}</p>
      </div>
    );
  }
  if (ev.type === "crosstalk") {
    const a = personaById[ev.fromId];
    const b = personaById[ev.toId];
    const tone =
      ev.stance === "agree"
        ? "border-blue-300 bg-blue-50 dark:bg-blue-950/30"
        : "border-rose-300 bg-rose-50 dark:bg-rose-950/30";
    return (
      <div className={`rounded-lg border-l-4 ${tone} px-4 py-2 text-sm`}>
        <div className="text-xs text-zinc-500">
          {a?.name ?? ev.fromId} → {b?.name ?? ev.toId} ({ev.stance})
        </div>
        <p className="mt-1 leading-relaxed">{ev.text}</p>
      </div>
    );
  }
  if (ev.type === "insight") {
    return (
      <div className="rounded-lg bg-amber-50 dark:bg-amber-950/30 border border-amber-300/60 px-4 py-2 text-sm">
        <span className="font-semibold mr-2">[{ev.segment}] {ev.theme}</span>
        {ev.quote && <span className="italic text-zinc-700 dark:text-zinc-300">"{ev.quote}"</span>}
        <span className="ml-2 text-xs text-zinc-500">strength {ev.strength.toFixed(2)}</span>
      </div>
    );
  }
  if (ev.type === "metric") {
    return (
      <div className="rounded-lg bg-zinc-100 dark:bg-zinc-800 px-4 py-2 text-sm flex items-center gap-3">
        <span className="font-semibold uppercase tracking-wider text-xs text-zinc-500">
          metric
        </span>
        <span className="font-medium">{ev.key}</span>
        <span className="text-emerald-700 dark:text-emerald-400 font-semibold">
          {ev.value.toFixed(2)}
        </span>
        {ev.perSegment && (
          <span className="ml-auto text-xs text-zinc-500">
            {Object.entries(ev.perSegment).map(([k, v]) => `${k}=${v}`).join(" · ")}
          </span>
        )}
      </div>
    );
  }
  if (ev.type === "verdict") {
    return (
      <div className="rounded-xl bg-zinc-900 text-white dark:bg-white dark:text-zinc-900 px-5 py-4 text-sm space-y-1">
        <div className="font-semibold text-base">최종 평가</div>
        <div>수용도(0-10): <span className="font-mono">{ev.acceptance}</span></div>
        <div>추천: {ev.recommend}</div>
        <div>핵심 매력: {ev.drivers.join(", ")}</div>
        <div>핵심 장벽: {ev.barriers.join(", ")}</div>
      </div>
    );
  }
  if (ev.type === "end") {
    return (
      <div className="text-xs text-zinc-500 mt-3">
        — 인터뷰 종료 · 발언 {ev.stats.speaks}회 · {Math.round(ev.stats.durationMs / 1000)}s · {ev.stats.tokens} tokens —
      </div>
    );
  }
  if (ev.type === "error") {
    return (
      <div className="rounded-lg border border-red-400 bg-red-50 dark:bg-red-950/30 px-4 py-2 text-sm text-red-700 dark:text-red-300">
        <span className="font-semibold mr-2">에러</span>
        {ev.text}
      </div>
    );
  }
  return null;
}

export function parseSSEChunk(buffer: string): {
  events: DisplayEvent[];
  rest: string;
} {
  const events: DisplayEvent[] = [];
  const blocks = buffer.split("\n\n");
  const rest = blocks.pop() ?? "";
  for (const block of blocks) {
    let dataLine: string | null = null;
    for (const line of block.split("\n")) {
      if (line.startsWith("data: ")) {
        dataLine = line.slice(6);
      }
    }
    if (!dataLine) continue;
    try {
      const obj = JSON.parse(dataLine) as DisplayEvent;
      if (typeof obj?.type === "string") events.push(obj);
    } catch {
      // ignore
    }
  }
  return { events, rest };
}
