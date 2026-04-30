"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  EventList,
  parseSSEChunk,
  type DisplayEvent,
} from "./EventStream";
import type { Persona } from "@/db/schema";

const REGION_PRESETS: Record<string, string[]> = {
  서울권: ["서울", "경기", "인천"],
  "대구·경북": ["대구", "경북"],
  부울경: ["부산", "울산", "경남"],
  호남권: ["광주", "전북", "전남"],
  충청권: ["대전", "충북", "충남", "세종"],
  강원제주: ["강원", "제주"],
};

type RegionEvents = {
  label: string;
  events: DisplayEvent[];
  runId?: string;
  done: boolean;
  error?: string;
};

export default function RegionCompareRunner({
  studyId,
  defaultLabelA = "수도권",
  defaultLabelB = "대구·경북",
  panelById,
}: {
  studyId: string;
  defaultLabelA?: string;
  defaultLabelB?: string;
  panelById: Record<string, Persona>;
}) {
  const router = useRouter();
  const [labelA, setLabelA] = useState(defaultLabelA);
  const [labelB, setLabelB] = useState(defaultLabelB);
  const [running, setRunning] = useState(false);
  const [a, setA] = useState<RegionEvents>({ label: defaultLabelA, events: [], done: false });
  const [b, setB] = useState<RegionEvents>({ label: defaultLabelB, events: [], done: false });
  const abortRef = useRef<AbortController | null>(null);

  async function streamRun(
    side: "A" | "B",
    setter: (s: RegionEvents | ((prev: RegionEvents) => RegionEvents)) => void,
    body: Record<string, unknown>,
    label: string,
    signal: AbortSignal
  ): Promise<void> {
    setter({ label, events: [], done: false });
    const res = await fetch(`/api/studies/${studyId}/runs`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(body),
      signal,
    });
    if (!res.ok || !res.body) {
      const t = await res.text().catch(() => "");
      throw new Error(`API ${res.status}: ${t || res.statusText}`);
    }
    const runId = res.headers.get("x-run-id") ?? undefined;
    setter((prev: RegionEvents) => ({ ...prev, runId }));
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
        setter((prev: RegionEvents) => ({
          ...prev,
          events: [...prev.events, ...newEvents],
        }));
      }
    }
    setter((prev: RegionEvents) => ({ ...prev, done: true }));
  }

  async function start() {
    setRunning(true);
    setA({ label: labelA, events: [], done: false });
    setB({ label: labelB, events: [], done: false });
    const compareGroup =
      typeof crypto !== "undefined" && "randomUUID" in crypto
        ? crypto.randomUUID()
        : // pseudo-uuid v4-like (fallback for unsupported runtimes)
          ("xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
            const r = (Math.random() * 16) | 0;
            const v = c === "x" ? r : (r & 0x3) | 0x8;
            return v.toString(16);
          }) as string);
    const controller = new AbortController();
    abortRef.current = controller;

    const provincesA = REGION_PRESETS[labelA] ?? [labelA];
    const provincesB = REGION_PRESETS[labelB] ?? [labelB];

    try {
      await streamRun(
        "A",
        setA,
        {
          filtersOverride: { province: provincesA },
          compareGroup,
          compareLabel: labelA,
        },
        labelA,
        controller.signal
      );
      await streamRun(
        "B",
        setB,
        {
          filtersOverride: { province: provincesB },
          compareGroup,
          compareLabel: labelB,
        },
        labelB,
        controller.signal
      );
    } catch (e) {
      if ((e as Error).name !== "AbortError") {
        const msg = (e as Error).message;
        setA((prev) => (prev.done ? prev : { ...prev, error: msg, done: true }));
        setB((prev) => (prev.done ? prev : { ...prev, error: msg, done: true }));
      }
    } finally {
      setRunning(false);
      abortRef.current = null;
    }
  }

  // 두 권역 모두 끝나면 자동 비교 페이지로
  useEffect(() => {
    if (!running && a.done && b.done && a.runId && b.runId && !a.error && !b.error) {
      const t = setTimeout(() => {
        router.push(`/studies/${studyId}/compare?a=${a.runId}&b=${b.runId}`);
      }, 800);
      return () => clearTimeout(t);
    }
  }, [running, a.done, b.done, a.runId, b.runId, a.error, b.error, studyId, router]);

  function stop() {
    abortRef.current?.abort();
  }

  const presetKeys = Object.keys(REGION_PRESETS);

  return (
    <section className="rounded-2xl border-2 border-blue-500/50 bg-blue-50/30 dark:bg-blue-950/10 p-5 space-y-4">
      <header className="flex items-center justify-between gap-3 flex-wrap">
        <div>
          <h2 className="font-semibold">▶ 권역 비교 실행 (Region Compare)</h2>
          <p className="text-xs text-zinc-600 dark:text-zinc-400 mt-1">
            동일 자극물·동일 가이드를 두 권역의 패널에게 동시 진행 후 자동으로 A/B 비교 화면으로 이동합니다.
          </p>
        </div>
      </header>

      <div className="grid grid-cols-2 gap-3">
        <RegionPicker label="권역 A" value={labelA} onChange={setLabelA} options={presetKeys} disabled={running} />
        <RegionPicker label="권역 B" value={labelB} onChange={setLabelB} options={presetKeys} disabled={running} />
      </div>

      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={start}
          disabled={running}
          className="px-5 py-2.5 rounded-full bg-blue-600 text-white disabled:opacity-50 font-medium"
        >
          {running ? "두 권역 진행 중…" : "▶ 권역 비교 시작"}
        </button>
        {running && (
          <button
            type="button"
            onClick={stop}
            className="px-4 py-2 rounded-full border border-zinc-300 dark:border-zinc-700 text-sm"
          >
            중단
          </button>
        )}
      </div>

      {(a.events.length > 0 || b.events.length > 0) && (
        <div className="grid lg:grid-cols-2 gap-4">
          <RegionPanel side="A" data={a} panelById={panelById} />
          <RegionPanel side="B" data={b} panelById={panelById} />
        </div>
      )}
    </section>
  );
}

function RegionPicker({
  label,
  value,
  onChange,
  options,
  disabled,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: string[];
  disabled?: boolean;
}) {
  return (
    <div className="space-y-1">
      <label className="text-xs font-medium">{label}</label>
      <select
        className="w-full rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 px-3 py-2 text-sm"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
      >
        {options.map((o) => (
          <option key={o} value={o}>
            {o}
          </option>
        ))}
      </select>
    </div>
  );
}

function RegionPanel({
  side,
  data,
  panelById,
}: {
  side: "A" | "B";
  data: RegionEvents;
  panelById: Record<string, Persona>;
}) {
  return (
    <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-4 space-y-2">
      <div className="flex items-center justify-between text-sm font-semibold">
        <span>
          [{side}] {data.label}
        </span>
        <span className="text-xs text-zinc-500">
          {data.done ? "완료" : "진행 중…"} · 발언 {data.events.filter((e) => e.type === "speak").length}회
        </span>
      </div>
      {data.error && (
        <div className="text-xs text-red-600">⚠ {data.error}</div>
      )}
      <div className="max-h-[480px] overflow-y-auto pr-1">
        <EventList events={data.events} personaById={panelById} />
      </div>
    </div>
  );
}
