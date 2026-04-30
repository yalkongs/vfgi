"use client";

import { useState } from "react";
import type { Run } from "@/db/schema";

type Calibration = {
  id: string;
  title: string;
  createdAt: string | Date;
  realFgiSummary: Record<string, unknown>;
  deltas: {
    acceptanceDelta?: number;
    agreementPct?: number;
    sharedDrivers?: string[];
    sharedBarriers?: string[];
    gaps?: string[];
    verdict?: string;
    analysis?: string;
  };
  runId?: string | null;
};

export default function CalibrationPanel({
  studyId,
  recentRun,
  initialCalibrations,
}: {
  studyId: string;
  recentRun?: Pick<Run, "id" | "createdAt"> | null;
  initialCalibrations: Calibration[];
}) {
  const [calibrations, setCalibrations] = useState<Calibration[]>(initialCalibrations);
  const [open, setOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [source, setSource] = useState("");
  const [conductedAt, setConductedAt] = useState("");
  const [panelDescription, setPanelDescription] = useState("");
  const [acceptance, setAcceptance] = useState("");
  const [drivers, setDrivers] = useState("");
  const [barriers, setBarriers] = useState("");
  const [rawText, setRawText] = useState("");

  async function submit() {
    if (!recentRun) {
      setError("비교할 vFGI Run 이 없습니다. 먼저 인터뷰를 실행하세요.");
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch(`/api/studies/${studyId}/calibrate`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          runId: recentRun.id,
          realFgi: {
            source: source || undefined,
            conductedAt: conductedAt || undefined,
            panelDescription: panelDescription || undefined,
            acceptance: acceptance ? Number(acceptance) : undefined,
            drivers: drivers ? drivers.split(",").map((s) => s.trim()).filter(Boolean) : undefined,
            barriers: barriers ? barriers.split(",").map((s) => s.trim()).filter(Boolean) : undefined,
            rawText,
          },
        }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? `${res.status}`);
      setCalibrations((prev) => [json.calibration, ...prev]);
      setOpen(false);
      setRawText("");
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setSubmitting(false);
    }
  }

  const latest = calibrations[0];

  return (
    <section className="rounded-2xl border border-purple-300 bg-purple-50/40 dark:bg-purple-950/20 p-5 space-y-3">
      <header className="flex items-center justify-between gap-3 flex-wrap">
        <div>
          <h2 className="font-semibold">Calibration — 실제 FGI 와 비교</h2>
          <p className="text-xs text-zinc-600 dark:text-zinc-400 mt-1">
            과거 외부 리서치 회사가 실시한 실제 FGI 보고서를 입력하면, 동일 자극물의 vFGI 시뮬 결과와 비교해 일치율·갭을 산출합니다. 부부장의 "이게 정확해?" 무력화 자료.
          </p>
        </div>
        {!open && (
          <button
            type="button"
            onClick={() => setOpen(true)}
            className="px-3 py-1.5 text-xs rounded-full border border-purple-500 text-purple-700 dark:text-purple-300"
          >
            + 실제 FGI 결과 입력
          </button>
        )}
      </header>

      {latest && !open && (
        <CalibrationCard cal={latest} />
      )}

      {calibrations.length > 1 && (
        <details className="text-xs">
          <summary className="cursor-pointer text-zinc-500">
            지난 Calibration {calibrations.length - 1}건 더 보기
          </summary>
          <div className="mt-2 space-y-2">
            {calibrations.slice(1).map((c) => (
              <CalibrationCard key={c.id} cal={c} compact />
            ))}
          </div>
        </details>
      )}

      {open && (
        <div className="space-y-3">
          {!recentRun && (
            <div className="text-xs text-amber-700 bg-amber-50 dark:bg-amber-950/30 border border-amber-300 px-3 py-2 rounded-lg">
              ⚠ 비교할 vFGI Run 이 없습니다. 먼저 위에서 인터뷰를 1회 실행한 후 다시 시도하세요.
            </div>
          )}
          <div className="grid sm:grid-cols-2 gap-3">
            <Field label="출처 (예: OOO리서치, 작년 11월)">
              <input
                className="w-full rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 px-3 py-2 text-sm"
                value={source}
                onChange={(e) => setSource(e.target.value)}
              />
            </Field>
            <Field label="실시 시점">
              <input
                className="w-full rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 px-3 py-2 text-sm"
                value={conductedAt}
                onChange={(e) => setConductedAt(e.target.value)}
                placeholder="2025-11"
              />
            </Field>
          </div>
          <Field label="실제 패널 설명 (지역·연령·인원)">
            <input
              className="w-full rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 px-3 py-2 text-sm"
              value={panelDescription}
              onChange={(e) => setPanelDescription(e.target.value)}
              placeholder="서울 30-40대 직장인 8명 + 대구 50대 자영업 8명"
            />
          </Field>
          <div className="grid sm:grid-cols-3 gap-3">
            <Field label="수용도 (0-10)">
              <input
                type="number"
                min={0}
                max={10}
                className="w-full rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 px-3 py-2 text-sm"
                value={acceptance}
                onChange={(e) => setAcceptance(e.target.value)}
              />
            </Field>
            <Field label="핵심 매력 (쉼표)">
              <input
                className="w-full rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 px-3 py-2 text-sm"
                value={drivers}
                onChange={(e) => setDrivers(e.target.value)}
                placeholder="금리 매력, 출석 우대 신선함"
              />
            </Field>
            <Field label="핵심 장벽 (쉼표)">
              <input
                className="w-full rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 px-3 py-2 text-sm"
                value={barriers}
                onChange={(e) => setBarriers(e.target.value)}
                placeholder="중도해지 패널티, 매일 출석 부담"
              />
            </Field>
          </div>
          <Field
            label="원문/요약 (필수, 발언록 또는 핵심 결과 요약)"
            hint="대외비라면 핵심만 익명화해 입력하셔도 됩니다."
          >
            <textarea
              className="w-full rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 px-3 py-2 text-sm min-h-[160px]"
              value={rawText}
              onChange={(e) => setRawText(e.target.value)}
              placeholder="예: 8명 중 6명이 매월 자동이체 부담을 언급. 대구 50대는 '단기 금리'를 더 선호..."
            />
          </Field>

          {error && (
            <div className="text-xs text-red-600 bg-red-50 dark:bg-red-950/30 border border-red-300 px-3 py-2 rounded-lg">
              ⚠ {error}
            </div>
          )}

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={submit}
              disabled={submitting || !rawText || !recentRun}
              className="px-4 py-2 rounded-full bg-purple-600 text-white text-sm font-medium disabled:opacity-50"
            >
              {submitting ? "비교 분석 중…" : "Calibration 실행"}
            </button>
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="px-3 py-2 text-sm text-zinc-500"
            >
              취소
            </button>
          </div>
        </div>
      )}
    </section>
  );
}

function Field({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1">
      <label className="block text-xs font-medium">{label}</label>
      {hint && <p className="text-[11px] text-zinc-500">{hint}</p>}
      {children}
    </div>
  );
}

function CalibrationCard({ cal, compact }: { cal: Calibration; compact?: boolean }) {
  const d = cal.deltas;
  const agreement = d.agreementPct ?? 0;
  const tone =
    agreement >= 70
      ? "border-emerald-400 bg-emerald-50 dark:bg-emerald-950/30 text-emerald-800 dark:text-emerald-300"
      : agreement >= 50
      ? "border-amber-400 bg-amber-50 dark:bg-amber-950/30 text-amber-800 dark:text-amber-300"
      : "border-rose-400 bg-rose-50 dark:bg-rose-950/30 text-rose-800 dark:text-rose-300";

  return (
    <div className={`rounded-xl border ${tone} px-4 py-3 space-y-1.5`}>
      <div className="flex items-center justify-between">
        <span className="font-medium text-sm">{cal.title}</span>
        <span className="text-xs">
          일치율 <span className="font-mono font-semibold">{agreement.toFixed(0)}%</span> · 수용도 Δ{" "}
          <span className="font-mono font-semibold">
            {(d.acceptanceDelta ?? 0) >= 0 ? "+" : ""}
            {(d.acceptanceDelta ?? 0).toFixed(1)}
          </span>
        </span>
      </div>
      {!compact && d.verdict && (
        <p className="text-sm">{d.verdict}</p>
      )}
      {!compact && d.analysis && (
        <p className="text-xs leading-relaxed">{d.analysis}</p>
      )}
      {!compact && (d.gaps?.length ?? 0) > 0 && (
        <details className="text-xs">
          <summary className="cursor-pointer">갭 분석 ({d.gaps?.length ?? 0}건)</summary>
          <ul className="mt-1 space-y-0.5 list-disc list-inside">
            {(d.gaps ?? []).map((g, i) => (
              <li key={i}>{g}</li>
            ))}
          </ul>
        </details>
      )}
    </div>
  );
}
