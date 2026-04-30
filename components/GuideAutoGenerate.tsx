"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function GuideAutoGenerate({
  studyId,
  stimulusKind,
  stimulusTitle,
  stimulusBody,
  objective,
  researchQuestions,
}: {
  studyId: string;
  stimulusKind: string;
  stimulusTitle: string;
  stimulusBody: string;
  objective: string;
  researchQuestions: string[];
}) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function generate() {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/guide/auto", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          kind: stimulusKind,
          objective,
          researchQuestions,
          stimulus: { title: stimulusTitle, body: stimulusBody },
          rounds: "standard",
        }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? `${res.status}`);

      const save = await fetch(`/api/studies/${studyId}/guide`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ sections: json.guide.sections, source: "auto" }),
      });
      if (!save.ok) {
        const t = await save.text().catch(() => "");
        throw new Error(`가이드 저장 실패: ${save.status} ${t}`);
      }
      router.refresh();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="rounded-2xl border-2 border-amber-400 bg-amber-50 dark:bg-amber-950/20 p-5 space-y-3">
      <div>
        <h2 className="font-semibold text-amber-900 dark:text-amber-200">
          ⚠ 진행자 질문 가이드가 없습니다
        </h2>
        <p className="text-sm text-amber-800 dark:text-amber-300 mt-1">
          가이드 없이는 vFGI 인터뷰를 시작할 수 없습니다. AI가 자극물·목적·연구질문을 토대로 6섹션 가이드를 자동 생성해 드립니다 (보통 10초).
        </p>
      </div>
      <button
        type="button"
        onClick={generate}
        disabled={busy}
        className="px-4 py-2 rounded-full bg-amber-600 text-white text-sm font-medium disabled:opacity-50"
      >
        {busy ? "AI 가이드 생성 중…" : "▶ 가이드 자동 생성"}
      </button>
      {error && (
        <p className="text-xs text-red-600 bg-red-50 dark:bg-red-950/30 border border-red-300 px-3 py-2 rounded-lg">
          ⚠ {error}
        </p>
      )}
    </div>
  );
}
