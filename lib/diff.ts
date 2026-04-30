import type { Run, Event } from "../db/schema";
import type { FGIEvent } from "./eventStream";

export type RunSummary = {
  run: Run;
  speaks: number;
  durationMs: number;
  tokens: number;
  metrics: Record<string, number>;
  verdict: {
    acceptance?: number;
    recommend?: string;
    drivers?: string[];
    barriers?: string[];
  };
  insightTopics: string[];
  topQuotes: string[];
};

export function summarizeRun(run: Run, events: Event[]): RunSummary {
  const payloads = events.map((e) => e.payload as unknown as FGIEvent);

  let speaks = 0;
  let durationMs = 0;
  let tokens = 0;
  const metrics: Record<string, number> = {};
  let verdict: RunSummary["verdict"] = {};
  const insightTopics: string[] = [];
  const quotes: string[] = [];

  for (const ev of payloads) {
    if (ev.type === "speak") speaks++;
    else if (ev.type === "metric") metrics[ev.key] = ev.value;
    else if (ev.type === "verdict") {
      verdict = {
        acceptance: ev.acceptance,
        recommend: ev.recommend,
        drivers: ev.drivers,
        barriers: ev.barriers,
      };
    } else if (ev.type === "insight") {
      insightTopics.push(`[${ev.segment}] ${ev.theme}`);
      if (ev.quote) quotes.push(ev.quote);
    } else if (ev.type === "end") {
      durationMs = ev.stats.durationMs;
      tokens = ev.stats.tokens;
    }
  }

  if (run.metrics) {
    const m = run.metrics as Record<string, unknown>;
    if (typeof m.speaks === "number") speaks = m.speaks;
    if (typeof m.durationMs === "number") durationMs = m.durationMs;
  }
  if (run.tokensOut) tokens = (run.tokensIn ?? 0) + (run.tokensOut ?? 0);

  return {
    run,
    speaks,
    durationMs,
    tokens,
    metrics,
    verdict,
    insightTopics,
    topQuotes: quotes.slice(0, 8),
  };
}

export type CompareDiff = {
  a: RunSummary;
  b: RunSummary;
  metricDeltas: Array<{ key: string; aValue: number; bValue: number; delta: number }>;
  acceptanceDelta?: number;
  sharedDrivers: string[];
  uniqueDriversA: string[];
  uniqueDriversB: string[];
  sharedBarriers: string[];
  uniqueBarriersA: string[];
  uniqueBarriersB: string[];
  sharedTopics: string[];
  uniqueTopicsA: string[];
  uniqueTopicsB: string[];
};

function diffSets(aArr: string[] = [], bArr: string[] = []) {
  const a = new Set(aArr.map((s) => s.trim().toLowerCase()));
  const b = new Set(bArr.map((s) => s.trim().toLowerCase()));
  const shared: string[] = [];
  const onlyA: string[] = [];
  const onlyB: string[] = [];
  for (const x of aArr) {
    const k = x.trim().toLowerCase();
    if (b.has(k)) shared.push(x);
    else onlyA.push(x);
  }
  for (const x of bArr) {
    const k = x.trim().toLowerCase();
    if (!a.has(k)) onlyB.push(x);
  }
  return { shared, onlyA, onlyB };
}

export function compareRuns(a: RunSummary, b: RunSummary): CompareDiff {
  const allKeys = new Set([
    ...Object.keys(a.metrics),
    ...Object.keys(b.metrics),
  ]);
  const metricDeltas = Array.from(allKeys).map((k) => ({
    key: k,
    aValue: a.metrics[k] ?? 0,
    bValue: b.metrics[k] ?? 0,
    delta: (b.metrics[k] ?? 0) - (a.metrics[k] ?? 0),
  }));

  const drivers = diffSets(a.verdict.drivers, b.verdict.drivers);
  const barriers = diffSets(a.verdict.barriers, b.verdict.barriers);
  const topics = diffSets(a.insightTopics, b.insightTopics);

  const acceptanceDelta =
    typeof a.verdict.acceptance === "number" &&
    typeof b.verdict.acceptance === "number"
      ? b.verdict.acceptance - a.verdict.acceptance
      : undefined;

  return {
    a,
    b,
    metricDeltas,
    acceptanceDelta,
    sharedDrivers: drivers.shared,
    uniqueDriversA: drivers.onlyA,
    uniqueDriversB: drivers.onlyB,
    sharedBarriers: barriers.shared,
    uniqueBarriersA: barriers.onlyA,
    uniqueBarriersB: barriers.onlyB,
    sharedTopics: topics.shared,
    uniqueTopicsA: topics.onlyA,
    uniqueTopicsB: topics.onlyB,
  };
}
