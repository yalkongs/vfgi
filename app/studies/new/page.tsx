"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

const STIMULUS_KINDS = [
  { v: "concept", label: "신상품 컨셉" },
  { v: "copy", label: "광고 카피" },
  { v: "ux_screen", label: "모바일 UX 화면" },
  { v: "ad_creative", label: "광고 크리에이티브" },
  { v: "policy", label: "정책·약관 변경" },
  { v: "brand", label: "브랜드·CI" },
  { v: "channel", label: "채널 변경" },
  { v: "feature", label: "앱 기능" },
  { v: "price", label: "금리·가격" },
] as const;

const REGION_GROUPS = ["대구·경북", "수도권", "호남권", "충청권", "부울경", "강원제주"];

type StimulusKind = (typeof STIMULUS_KINDS)[number]["v"];

type Section = { key: string; title: string; prompts: string[] };

export default function NewStudyPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Step 1
  const [title, setTitle] = useState("");
  const [objective, setObjective] = useState("");
  const [rqText, setRqText] = useState("");
  const [tagsText, setTagsText] = useState("iM뱅크");

  // Step 2
  const [kind, setKind] = useState<StimulusKind>("concept");
  const [stimTitle, setStimTitle] = useState("");
  const [stimBody, setStimBody] = useState("");
  const [competitorsText, setCompetitorsText] = useState("");

  // Step 3
  const [size, setSize] = useState(8);
  const [provinces, setProvinces] = useState<string[]>(["대구", "경북", "서울", "경기"]);
  const [ageMin, setAgeMin] = useState(30);
  const [ageMax, setAgeMax] = useState(59);
  const [occupationKw, setOccupationKw] = useState("");
  const [quotaRegion, setQuotaRegion] = useState<{ "대구·경북": number; 수도권: number }>({
    "대구·경북": 4,
    수도권: 4,
  });
  const [seed, setSeed] = useState(42);

  // Step 4
  const [rounds, setRounds] = useState<"quick" | "standard" | "deep">("standard");
  const [guideSections, setGuideSections] = useState<Section[] | null>(null);
  const [generatingGuide, setGeneratingGuide] = useState(false);

  // Step 5
  const [diversity, setDiversity] = useState<"medium" | "high" | "scripted">("high");

  const rqList = rqText.split("\n").map((s) => s.trim()).filter(Boolean);
  const tags = tagsText.split(",").map((s) => s.trim()).filter(Boolean);
  const competitors = competitorsText.split(",").map((s) => s.trim()).filter(Boolean);

  async function generateGuide() {
    setGeneratingGuide(true);
    setError(null);
    try {
      const res = await fetch("/api/guide/auto", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          kind,
          objective,
          researchQuestions: rqList,
          stimulus: { title: stimTitle, body: stimBody },
          rounds,
        }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? `${res.status}`);
      setGuideSections(json.guide.sections);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setGeneratingGuide(false);
    }
  }

  async function submit() {
    if (!guideSections) {
      const ok = window.confirm(
        "질문 가이드를 아직 생성하지 않았습니다.\n\n가이드 없이 만들면 vFGI 인터뷰를 시작할 수 없습니다.\n\n그래도 진행하시겠습니까?\n(상세 화면에서 추후 자동 생성도 가능합니다)"
      );
      if (!ok) {
        setStep(4);
        return;
      }
    }
    setSubmitting(true);
    setError(null);
    try {
      const quotas = [
        {
          key: "province",
          values: quotaRegion,
        },
      ];
      const filters = {
        province: provinces,
        ageMin,
        ageMax,
        occupationKeywords: occupationKw ? occupationKw.split(",").map((s) => s.trim()).filter(Boolean) : undefined,
      };

      const res = await fetch("/api/studies", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          title,
          objective,
          researchQuestions: rqList,
          tags,
          stimulus: {
            kind,
            title: stimTitle,
            body: stimBody,
            competitors,
          },
          panel: {
            filters,
            quotas,
            diversity,
            size,
            seed,
          },
          guide: guideSections ? { sections: guideSections, source: "auto" } : undefined,
        }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? `${res.status}`);
      router.push(`/studies/${json.study.id}`);
    } catch (e) {
      setError((e as Error).message);
      setSubmitting(false);
    }
  }

  function toggleProvince(p: string) {
    setProvinces((prev) =>
      prev.includes(p) ? prev.filter((x) => x !== p) : [...prev, p]
    );
  }

  return (
    <main className="mx-auto max-w-3xl px-6 py-10 space-y-8">
      <header className="space-y-1">
        <p className="text-xs uppercase tracking-widest text-emerald-600">
          새 vFGI 만들기 · {step}/5단계
        </p>
        <h1 className="text-2xl font-semibold tracking-tight">
          {step === 1 && "1단계 — 무엇을 검증할까요?"}
          {step === 2 && "2단계 — 무엇을 보여줄까요?"}
          {step === 3 && "3단계 — 누구에게 물어볼까요?"}
          {step === 4 && "4단계 — 어떤 질문을 할까요?"}
          {step === 5 && "5단계 — 확인하고 시작"}
        </h1>
        <p className="text-xs text-zinc-500">
          참여자는{" "}
          <a
            href="https://huggingface.co/datasets/nvidia/Nemotron-Personas-Korea"
            target="_blank"
            rel="noopener noreferrer"
            className="underline hover:text-emerald-600"
          >
            NVIDIA Nemotron-Personas-Korea
          </a>{" "}
          기반 합성 페르소나
        </p>
      </header>

      <Stepper step={step} />

      {error && (
        <div className="rounded-lg border border-red-400 bg-red-50 dark:bg-red-950/30 px-4 py-2 text-sm text-red-700 dark:text-red-300">
          {error}
        </div>
      )}

      {step === 1 && (
        <section className="space-y-4">
          <Field label="vFGI 이름" hint="나중에 알아보기 쉬운 이름이면 OK. 예: 'iM 톡톡 적금 컨셉 검증'">
            <input
              className="w-full rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 px-3 py-2"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="iM 톡톡 적금 컨셉 검증"
            />
          </Field>
          <Field label="이 vFGI 로 무엇을 알고 싶은가요?" hint="한 문장으로 핵심 목적을 적어 주세요">
            <textarea
              className="w-full rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 px-3 py-2 min-h-[80px]"
              value={objective}
              onChange={(e) => setObjective(e.target.value)}
              placeholder="iM 톡톡 적금의 출석 우대 컨셉이 30대 워킹맘에게 통할지 검증"
            />
          </Field>
          <Field label="구체적으로 답을 얻고 싶은 질문 (한 줄에 하나, 선택)" hint="예) 출석 우대가 부담인가? / 5% 우리 vs 4.5% 카뱅 어디를 선택할까?">
            <textarea
              className="w-full rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 px-3 py-2 min-h-[80px]"
              value={rqText}
              onChange={(e) => setRqText(e.target.value)}
            />
          </Field>
          <Field label="태그 (쉼표 구분, 나중에 검색용)">
            <input
              className="w-full rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 px-3 py-2"
              value={tagsText}
              onChange={(e) => setTagsText(e.target.value)}
            />
          </Field>
        </section>
      )}

      {step === 2 && (
        <section className="space-y-4">
          <p className="text-sm text-zinc-600 dark:text-zinc-400">
            <strong>자극물</strong>이란 참여자에게 보여주고 반응을 듣는 것입니다 — 신상품 컨셉, 광고 카피, 앱 화면 등.
          </p>
          <Field label="어떤 종류의 자극물인가요?">
            <div className="grid gap-2 sm:grid-cols-3">
              {STIMULUS_KINDS.map((k) => (
                <button
                  key={k.v}
                  type="button"
                  onClick={() => setKind(k.v)}
                  className={`rounded-lg border px-3 py-2 text-sm text-left ${
                    kind === k.v
                      ? "border-emerald-500 bg-emerald-50 dark:bg-emerald-950/30"
                      : "border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900"
                  }`}
                >
                  {k.label}
                </button>
              ))}
            </div>
          </Field>
          <Field label="이름">
            <input
              className="w-full rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 px-3 py-2"
              value={stimTitle}
              onChange={(e) => setStimTitle(e.target.value)}
              placeholder="iM 톡톡 적금"
            />
          </Field>
          <Field label="자세한 설명" hint="참여자에게 보여줄 핵심 정보를 적습니다. 태그라인·특징·금리·조건 등을 자유롭게 작성하세요.">
            <textarea
              className="w-full rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 px-3 py-2 min-h-[160px]"
              value={stimBody}
              onChange={(e) => setStimBody(e.target.value)}
              placeholder="매일 출석체크 시 우대금리 추가. 기본 3.5% + 최대 1.5% 우대 = 최고 5.0%."
            />
          </Field>
          <Field label="비교 대상 상품 (선택, 쉼표로 구분)" hint="예: 카카오뱅크 자유적금, 토스 굴리기">
            <input
              className="w-full rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 px-3 py-2"
              value={competitorsText}
              onChange={(e) => setCompetitorsText(e.target.value)}
              placeholder="카카오뱅크 자유적금, 토스 굴리기"
            />
          </Field>
        </section>
      )}

      {step === 3 && (
        <section className="space-y-4">
          <p className="text-sm text-zinc-600 dark:text-zinc-400">
            가상 고객 1,000명 풀에서 조건에 맞는 사람들을 자동 모집합니다. 인원은 자유롭게 정할 수 있습니다 (참고: 6~12명이면 토론이 풍부하고, 30명 이상이면 정량 분석 색채가 강해집니다).
          </p>
          <Field label="몇 명을 인터뷰할까요?" hint="2~200명까지 임의 설정 가능. 인원이 많을수록 실행 시간·비용이 증가합니다.">
            <input
              type="number"
              min={2}
              max={200}
              className="w-32 rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 px-3 py-2"
              value={size}
              onChange={(e) => setSize(Number(e.target.value))}
            />
          </Field>
          <Field label="어느 지역에 사는 사람을 포함할까요?">
            <div className="flex flex-wrap gap-2">
              {["서울","경기","인천","대구","경북","부산","울산","경남","광주","전북","전남","대전","충북","충남","세종","강원","제주"].map((p) => (
                <button
                  type="button"
                  key={p}
                  onClick={() => toggleProvince(p)}
                  className={`px-3 py-1.5 rounded-full border text-sm ${
                    provinces.includes(p)
                      ? "border-emerald-500 bg-emerald-50 dark:bg-emerald-950/30"
                      : "border-zinc-300 dark:border-zinc-700"
                  }`}
                >
                  {p}
                </button>
              ))}
            </div>
          </Field>
          <div className="grid grid-cols-2 gap-4">
            <Field label="최소 연령">
              <input
                type="number"
                min={19}
                max={99}
                className="w-32 rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 px-3 py-2"
                value={ageMin}
                onChange={(e) => setAgeMin(Number(e.target.value))}
              />
            </Field>
            <Field label="최대 연령">
              <input
                type="number"
                min={19}
                max={99}
                className="w-32 rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 px-3 py-2"
                value={ageMax}
                onChange={(e) => setAgeMax(Number(e.target.value))}
              />
            </Field>
          </div>
          <Field label="특정 직업만 (선택, 쉼표로 구분)" hint="예: 워킹맘, 자영업, 교사">
            <input
              className="w-full rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 px-3 py-2"
              value={occupationKw}
              onChange={(e) => setOccupationKw(e.target.value)}
            />
          </Field>
          <Field label="권역별 인원 비율 (대구·경북 vs 수도권)" hint="합계가 위에서 정한 인원 수와 같도록 맞춰 주세요">
            <div className="grid grid-cols-2 gap-2">
              {REGION_GROUPS.slice(0, 2).map((g) => (
                <div key={g} className="flex items-center gap-2">
                  <span className="text-sm w-24">{g}</span>
                  <input
                    type="number"
                    min={0}
                    max={size}
                    className="w-20 rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 px-2 py-1"
                    value={(quotaRegion as Record<string, number>)[g] ?? 0}
                    onChange={(e) =>
                      setQuotaRegion({ ...quotaRegion, [g]: Number(e.target.value) } as typeof quotaRegion)
                    }
                  />
                  <span className="text-xs text-zinc-500">명</span>
                </div>
              ))}
            </div>
          </Field>
          <Field label="시드 번호 (같은 번호면 같은 참여자가 모집됩니다 — 재실행 비교용)">
            <input
              type="number"
              className="w-32 rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 px-3 py-2"
              value={seed}
              onChange={(e) => setSeed(Number(e.target.value))}
            />
          </Field>
        </section>
      )}

      {step === 4 && (
        <section className="space-y-4">
          <p className="text-sm text-zinc-600 dark:text-zinc-400">
            인터뷰 진행자가 던질 질문 가이드입니다. AI가 자동으로 만들어드리며, 마음에 안 들면 다시 생성하면 됩니다.
          </p>
          <Field label="얼마나 깊게 물어볼까요?">
            <div className="flex gap-2">
              {(["quick", "standard", "deep"] as const).map((r) => (
                <button
                  key={r}
                  type="button"
                  onClick={() => setRounds(r)}
                  className={`px-3 py-1.5 rounded-full border text-sm ${
                    rounds === r
                      ? "border-emerald-500 bg-emerald-50 dark:bg-emerald-950/30"
                      : "border-zinc-300 dark:border-zinc-700"
                  }`}
                >
                  {r === "quick" ? "간단히 (3섹션)" : r === "standard" ? "표준 (6섹션)" : "깊이 (8섹션)"}
                </button>
              ))}
            </div>
          </Field>
          <button
            type="button"
            onClick={generateGuide}
            disabled={generatingGuide || !objective || !stimTitle}
            className="px-4 py-2 rounded-full border border-emerald-500 text-emerald-700 dark:text-emerald-400 disabled:opacity-50 text-sm"
          >
            {generatingGuide ? "AI가 가이드 만드는 중…" : guideSections ? "다시 만들기" : "AI로 가이드 자동 생성"}
          </button>
          {guideSections && (
            <div className="space-y-3 mt-4">
              {guideSections.map((s, i) => (
                <div
                  key={s.key + i}
                  className="rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 px-4 py-3 text-sm"
                >
                  <div className="font-semibold mb-1">
                    {i + 1}. {s.title}{" "}
                    <span className="text-xs text-zinc-500">[{s.key}]</span>
                  </div>
                  <ul className="list-disc list-inside space-y-1 text-zinc-700 dark:text-zinc-300">
                    {s.prompts.map((p, j) => (
                      <li key={j}>{p}</li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          )}
        </section>
      )}

      {step === 5 && (
        <section className="space-y-4">
          <Field label="참여자 다양성">
            <div className="flex gap-2">
              {(["medium", "high", "scripted"] as const).map((d) => (
                <button
                  key={d}
                  type="button"
                  onClick={() => setDiversity(d)}
                  className={`px-3 py-1.5 rounded-full border text-sm ${
                    diversity === d
                      ? "border-emerald-500 bg-emerald-50 dark:bg-emerald-950/30"
                      : "border-zinc-300 dark:border-zinc-700"
                  }`}
                >
                  {d}
                </button>
              ))}
            </div>
          </Field>
          <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-4 text-sm space-y-2">
            <div className="font-semibold mb-2">아래 내용으로 vFGI를 만들겠습니다</div>
            <div>· vFGI 이름: {title || "(미입력)"}</div>
            <div>· 검증할 자극물: [{kind}] {stimTitle || "(미입력)"}</div>
            <div>· 참여자: {size}명 · 연령 {ageMin}–{ageMax}세 · 지역 {provinces.join(", ")}</div>
            <div>· 질문 가이드: {guideSections ? `AI가 만든 ${guideSections.length}개 섹션` : "(아직 생성 안함 — 4단계에서 만들어 주세요)"}</div>
            <div>· 시드: {seed} {guideSections ? "" : <span className="text-amber-600">⚠ 가이드 없이 진행하면 인터뷰 품질이 낮아집니다</span>}</div>
          </div>
        </section>
      )}

      <div className="flex items-center justify-between pt-4">
        <button
          type="button"
          onClick={() => setStep((s) => Math.max(1, s - 1))}
          disabled={step === 1 || submitting}
          className="px-4 py-2 rounded-full border border-zinc-300 dark:border-zinc-700 text-sm disabled:opacity-30"
        >
          ← 이전
        </button>
        {step < 5 ? (
          <button
            type="button"
            onClick={() => setStep((s) => Math.min(5, s + 1))}
            className="px-4 py-2 rounded-full bg-zinc-900 text-white dark:bg-white dark:text-zinc-900 text-sm font-medium"
          >
            다음 →
          </button>
        ) : (
          <button
            type="button"
            onClick={submit}
            disabled={submitting || !title || !objective || !stimTitle}
            className="px-5 py-2 rounded-full bg-emerald-600 text-white text-sm font-medium disabled:opacity-50"
          >
            {submitting ? "만드는 중…" : "vFGI 만들기 →"}
          </button>
        )}
      </div>
    </main>
  );
}

function Stepper({ step }: { step: number }) {
  const labels = ["목적", "자극물", "참여자", "질문 가이드", "확인"];
  return (
    <ol className="flex gap-2 text-xs">
      {labels.map((l, i) => {
        const n = i + 1;
        const active = n === step;
        const done = n < step;
        return (
          <li
            key={l}
            className={`flex-1 px-3 py-1.5 rounded-full text-center ${
              active
                ? "bg-emerald-600 text-white"
                : done
                ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/30"
                : "bg-zinc-100 text-zinc-500 dark:bg-zinc-800"
            }`}
          >
            {n}. {l}
          </li>
        );
      })}
    </ol>
  );
}

function Field({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1">
      <label className="block text-sm font-medium">{label}</label>
      {hint && <p className="text-xs text-zinc-500">{hint}</p>}
      {children}
    </div>
  );
}
