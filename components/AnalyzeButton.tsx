"use client";

import { useState } from "react";

export default function AnalyzeButton({
  studyId,
  runId,
}: {
  studyId: string;
  runId: string;
}) {
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function run() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(
        `/api/studies/${studyId}/runs/${runId}/analyze`,
        { method: "POST" }
      );
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? `${res.status}`);
      setDone(true);
      setTimeout(() => location.reload(), 800);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex items-center gap-2">
      <button
        type="button"
        onClick={run}
        disabled={loading || done}
        className="text-xs px-3 py-1 rounded-full border border-amber-500 text-amber-700 dark:text-amber-400 disabled:opacity-50"
      >
        {loading ? "분석 중…" : done ? "완료 — 새로고침" : "AI 심층 분석 실행"}
      </button>
      {error && <span className="text-xs text-red-600">⚠ {error}</span>}
    </div>
  );
}
