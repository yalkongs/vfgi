"use client";

import { useMemo, useRef, useState } from "react";
import {
  EventList,
  parseSSEChunk,
  type DisplayEvent,
} from "./EventStream";
import type { Persona } from "@/db/schema";

export default function RunRunner({
  studyId,
  panel,
}: {
  studyId: string;
  panel: Persona[];
}) {
  const [running, setRunning] = useState(false);
  const [events, setEvents] = useState<DisplayEvent[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [runId, setRunId] = useState<string | null>(null);
  const [precisionMode, setPrecisionMode] = useState(false);
  const [naturalDistribution, setNaturalDistribution] = useState(false);
  const abortRef = useRef<AbortController | null>(null);

  const personaById = useMemo(
    () => Object.fromEntries(panel.map((p) => [p.id, p])) as Record<string, Persona>,
    [panel]
  );

  async function start() {
    setEvents([]);
    setError(null);
    setRunning(true);
    const controller = new AbortController();
    abortRef.current = controller;

    try {
      const res = await fetch(`/api/studies/${studyId}/runs`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ precisionMode, naturalDistribution }),
        signal: controller.signal,
      });
      if (!res.ok || !res.body) {
        const t = await res.text().catch(() => "");
        throw new Error(`API ${res.status}: ${t || res.statusText}`);
      }
      const newRunId = res.headers.get("x-run-id");
      if (newRunId) setRunId(newRunId);

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";
      while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const { events: newEvents, rest } = parseSSEChunk(buffer);
        buffer = rest;
        if (newEvents.length > 0) {
          setEvents((prev) => [...prev, ...newEvents]);
        }
      }
    } catch (e) {
      if ((e as Error).name !== "AbortError") setError((e as Error).message);
    } finally {
      setRunning(false);
      abortRef.current = null;
    }
  }

  function stop() {
    abortRef.current?.abort();
  }

  return (
    <section className="space-y-4">
      <div className="flex items-center gap-4 flex-wrap">
        <label className="flex items-center gap-1.5 text-xs text-zinc-600 dark:text-zinc-400 cursor-pointer">
          <input
            type="checkbox"
            checked={precisionMode}
            onChange={(e) => setPrecisionMode(e.target.checked)}
            disabled={running}
          />
          정밀 모드 (E9 자기검증, 비용 ↑)
        </label>
        <label className="flex items-center gap-1.5 text-xs text-zinc-600 dark:text-zinc-400 cursor-pointer">
          <input
            type="checkbox"
            checked={naturalDistribution}
            onChange={(e) => setNaturalDistribution(e.target.checked)}
            disabled={running}
          />
          자연 분포 (E4, 권역 쿼터 무시)
        </label>
      </div>
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={start}
          disabled={running || panel.length === 0}
          className="px-5 py-2.5 rounded-full bg-emerald-600 text-white disabled:opacity-50 font-medium"
        >
          {running ? "vFGI 진행 중…" : events.length > 0 ? "다시 실행" : "▶ vFGI 시작"}
        </button>
        {running && (
          <button
            type="button"
            onClick={stop}
            className="px-4 py-2 rounded-full border border-zinc-300 dark:border-zinc-700"
          >
            중단
          </button>
        )}
        {runId && (
          <span className="text-xs text-zinc-500">
            run: <span className="font-mono">{runId.slice(0, 8)}</span>
          </span>
        )}
        {error && <span className="text-sm text-red-600">⚠ {error}</span>}
      </div>

      <div>
        {events.length === 0 && !running && (
          <p className="text-sm text-zinc-500">
            참여자 {panel.length}명 준비 완료. vFGI 시작을 누르면 진행자와 참여자 발언이 실시간으로 표시됩니다.
          </p>
        )}
        <EventList events={events} personaById={personaById} />
      </div>
    </section>
  );
}
