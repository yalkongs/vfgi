import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
  Font,
} from "@react-pdf/renderer";
import { resolve } from "node:path";
import type {
  Study,
  Stimulus,
  Run,
  Persona,
  Calibration,
} from "../../db/schema";
import type { RunSummary, CompareDiff } from "../diff";
import type { ExecSummary } from "../agents/execSummary";

const FONT_DIR = resolve(process.cwd(), "public", "fonts");
let fontsRegistered = false;

function ensureFonts() {
  if (fontsRegistered) return;
  Font.register({
    family: "Pretendard",
    fonts: [
      { src: resolve(FONT_DIR, "Pretendard-Regular.otf"), fontWeight: "normal" },
      { src: resolve(FONT_DIR, "Pretendard-Bold.otf"), fontWeight: "bold" },
    ],
  });
  fontsRegistered = true;
}

const s = StyleSheet.create({
  page: {
    fontFamily: "Pretendard",
    padding: 40,
    fontSize: 10,
    color: "#222",
    backgroundColor: "#ffffff",
  },
  watermark: {
    position: "absolute",
    top: 18,
    right: 40,
    fontSize: 8,
    color: "#888",
  },
  pageNum: {
    position: "absolute",
    bottom: 18,
    right: 40,
    fontSize: 8,
    color: "#888",
  },
  cover: { paddingTop: 90 },
  coverBadge: {
    fontSize: 9,
    color: "#10b981",
    letterSpacing: 1.5,
    textTransform: "uppercase",
    marginBottom: 12,
  },
  title: { fontSize: 28, fontWeight: "bold", marginBottom: 6 },
  subtitle: { fontSize: 13, color: "#444", marginBottom: 28 },
  meta: { fontSize: 10, color: "#555", lineHeight: 1.6 },
  h1: {
    fontSize: 18,
    fontWeight: "bold",
    marginTop: 8,
    marginBottom: 10,
    borderBottomWidth: 2,
    borderBottomColor: "#10b981",
    paddingBottom: 4,
  },
  h2: {
    fontSize: 14,
    fontWeight: "bold",
    marginTop: 12,
    marginBottom: 6,
  },
  h3: {
    fontSize: 11,
    fontWeight: "bold",
    marginTop: 8,
    marginBottom: 4,
  },
  p: { fontSize: 10, lineHeight: 1.55, marginBottom: 4 },
  pSmall: { fontSize: 9, color: "#666", lineHeight: 1.5 },
  bullet: { flexDirection: "row", marginBottom: 3 },
  bulletDot: { width: 12, fontWeight: "bold" },
  bulletText: { flex: 1, fontSize: 10, lineHeight: 1.45 },
  metricCard: {
    flex: 1,
    padding: 10,
    borderRadius: 4,
    marginHorizontal: 3,
  },
  metricLabel: { fontSize: 8, textTransform: "uppercase", letterSpacing: 1 },
  metricValue: { fontSize: 22, fontWeight: "bold", marginTop: 4 },
  quote: {
    padding: 8,
    backgroundColor: "#fef3c7",
    borderLeftWidth: 3,
    borderLeftColor: "#f59e0b",
    marginBottom: 6,
    fontStyle: "italic",
  },
  trustBox: {
    padding: 10,
    backgroundColor: "#f4f4f5",
    borderRadius: 4,
    marginTop: 12,
  },
  table: { marginTop: 6 },
  tr: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
    paddingVertical: 4,
  },
  th: { fontSize: 9, color: "#666", fontWeight: "bold" },
  td: { fontSize: 10 },
  panelGrid: { flexDirection: "row", flexWrap: "wrap" },
  panelChip: {
    width: "48%",
    padding: 7,
    backgroundColor: "#f4f4f5",
    borderRadius: 4,
    marginBottom: 5,
    marginRight: "2%",
  },
});

export type StudyReportInput = {
  study: Study;
  stimulus: Stimulus | null;
  runs: Run[];
  runSummaries: RunSummary[];
  panelMap: Record<string, Persona>;
  calibrations: Calibration[];
  compareGroups: Array<{
    groupId: string;
    a: RunSummary;
    b: RunSummary;
    diff: CompareDiff;
  }>;
  execSummary: ExecSummary | null;
};

export function buildStudyReportDocument(input: StudyReportInput) {
  ensureFonts();
  const { study, stimulus, runs, runSummaries, calibrations, compareGroups, execSummary, panelMap } = input;

  const totalSpeaks = runSummaries.reduce((s, r) => s + r.speaks, 0);
  const totalDuration = runSummaries.reduce((s, r) => s + r.durationMs, 0);
  const totalTokens = runSummaries.reduce((s, r) => s + r.tokens, 0);
  const allInsights = runSummaries.flatMap((r) => r.insightTopics);
  const allQuotes = runSummaries.flatMap((r) => r.topQuotes);

  return (
    <Document
      title={`vFGI 통합 보고서 — ${study.title}`}
      author="iM뱅크 vFGI"
      subject={study.objective}
    >
      {/* 1. COVER */}
      <Page size="A4" style={s.page}>
        <Text style={s.watermark}>SYNTHETIC FGI · 합성 페르소나 기반</Text>
        <View style={s.cover}>
          <Text style={s.coverBadge}>vFGI · Virtual Focus Group Interview</Text>
          <Text style={s.title}>{study.title}</Text>
          <Text style={s.subtitle}>임원 보고용 통합 분석 보고서</Text>
          <Text style={s.meta}>목적: {study.objective}</Text>
          <Text style={s.meta}>
            기간: {new Date(study.createdAt).toLocaleDateString("ko-KR")} ~ {new Date().toLocaleDateString("ko-KR")}
          </Text>
          <Text style={s.meta}>
            진행: vFGI {runs.length}건 · 발언 {totalSpeaks}회 · 누적 {Math.round(totalDuration / 1000)}초 · {totalTokens.toLocaleString()} tokens
          </Text>
          <Text style={s.meta}>Calibration: {calibrations.length}건 · 권역 비교: {compareGroups.length}건</Text>
          <Text style={[s.meta, { marginTop: 18 }]}>Study ID: {study.id}</Text>
          <Text style={s.meta}>생성: {new Date().toLocaleString("ko-KR")}</Text>
        </View>
      </Page>

      {/* 2. EXECUTIVE SUMMARY */}
      <Page size="A4" style={s.page}>
        <Text style={s.watermark}>SYNTHETIC FGI</Text>
        <Text style={s.pageNum}>2</Text>
        <Text style={s.h1}>1. Executive Summary</Text>

        {execSummary ? (
          <>
            <View style={[s.trustBox, { backgroundColor: "#ecfdf5" }]}>
              <Text style={[s.h2, { marginTop: 0, color: "#047857" }]}>
                {execSummary.headline}
              </Text>
            </View>

            <View style={{ flexDirection: "row", marginTop: 12, marginHorizontal: -3 }}>
              <View style={[s.metricCard, { backgroundColor: "#ecfdf5" }]}>
                <Text style={[s.metricLabel, { color: "#047857" }]}>가중 수용도</Text>
                <Text style={[s.metricValue, { color: "#047857" }]}>
                  {execSummary.acceptanceWeighted >= 0 ? execSummary.acceptanceWeighted.toFixed(1) : "-"}
                </Text>
                <Text style={s.pSmall}>0-10 척도, Run 평균</Text>
              </View>
              <View style={[s.metricCard, { backgroundColor: "#f4f4f5" }]}>
                <Text style={s.metricLabel}>최종 권고</Text>
                <Text style={[s.metricValue, { fontSize: 16, marginTop: 8 }]}>
                  {execSummary.recommendation}
                </Text>
              </View>
              <View style={[s.metricCard, { backgroundColor: "#fffbeb" }]}>
                <Text style={[s.metricLabel, { color: "#b45309" }]}>신뢰도</Text>
                <Text style={[s.pSmall, { color: "#b45309", marginTop: 6 }]}>
                  {execSummary.trustNote}
                </Text>
              </View>
            </View>

            <Text style={s.h2}>핵심 발견</Text>
            {execSummary.keyFindings.map((f, i) => (
              <View key={i} style={s.bullet}>
                <Text style={s.bulletDot}>{i + 1}.</Text>
                <Text style={s.bulletText}>{f}</Text>
              </View>
            ))}

            {execSummary.segmentDifferences.length > 0 && (
              <>
                <Text style={s.h2}>세그먼트별 차이</Text>
                {execSummary.segmentDifferences.map((sd, i) => (
                  <View key={i} style={s.bullet}>
                    <Text style={s.bulletDot}>·</Text>
                    <Text style={s.bulletText}>
                      <Text style={{ fontWeight: "bold" }}>[{sd.segment}]</Text> {sd.finding}
                    </Text>
                  </View>
                ))}
              </>
            )}

            <View style={{ flexDirection: "row", marginTop: 8 }}>
              <View style={{ flex: 1, paddingRight: 6 }}>
                <Text style={[s.h3, { color: "#047857" }]}>매력 (Drivers)</Text>
                {execSummary.drivers.map((d, i) => (
                  <View key={i} style={s.bullet}>
                    <Text style={[s.bulletDot, { color: "#047857" }]}>+</Text>
                    <Text style={s.bulletText}>{d}</Text>
                  </View>
                ))}
              </View>
              <View style={{ flex: 1, paddingLeft: 6 }}>
                <Text style={[s.h3, { color: "#be123c" }]}>장벽 (Barriers)</Text>
                {execSummary.barriers.map((b, i) => (
                  <View key={i} style={s.bullet}>
                    <Text style={[s.bulletDot, { color: "#be123c" }]}>-</Text>
                    <Text style={s.bulletText}>{b}</Text>
                  </View>
                ))}
              </View>
            </View>
          </>
        ) : (
          <Text style={s.p}>(Executive Summary 생성 중 또는 데이터 부족)</Text>
        )}
      </Page>

      {/* 3. KILL/KEEP/CHANGE + NEXT ACTIONS */}
      {execSummary && (
        <Page size="A4" style={s.page}>
          <Text style={s.watermark}>SYNTHETIC FGI</Text>
          <Text style={s.pageNum}>3</Text>
          <Text style={s.h1}>2. 의사결정 매트릭스</Text>

          <View style={{ flexDirection: "row", marginTop: 8 }}>
            <View style={{ flex: 1, marginRight: 4 }}>
              <Text style={[s.h3, { color: "#be123c" }]}>KILL</Text>
              {execSummary.killKeepChange.kill.map((x, i) => (
                <View key={i} style={[s.trustBox, { backgroundColor: "#fef2f2", marginTop: 4 }]}>
                  <Text style={[s.pSmall, { color: "#7f1d1d" }]}>{x}</Text>
                </View>
              ))}
              {execSummary.killKeepChange.kill.length === 0 && <Text style={s.pSmall}>(없음)</Text>}
            </View>
            <View style={{ flex: 1, marginHorizontal: 4 }}>
              <Text style={[s.h3, { color: "#047857" }]}>KEEP</Text>
              {execSummary.killKeepChange.keep.map((x, i) => (
                <View key={i} style={[s.trustBox, { backgroundColor: "#ecfdf5", marginTop: 4 }]}>
                  <Text style={[s.pSmall, { color: "#065f46" }]}>{x}</Text>
                </View>
              ))}
              {execSummary.killKeepChange.keep.length === 0 && <Text style={s.pSmall}>(없음)</Text>}
            </View>
            <View style={{ flex: 1, marginLeft: 4 }}>
              <Text style={[s.h3, { color: "#b45309" }]}>CHANGE</Text>
              {execSummary.killKeepChange.change.map((x, i) => (
                <View key={i} style={[s.trustBox, { backgroundColor: "#fffbeb", marginTop: 4 }]}>
                  <Text style={[s.pSmall, { color: "#78350f" }]}>{x}</Text>
                </View>
              ))}
              {execSummary.killKeepChange.change.length === 0 && <Text style={s.pSmall}>(없음)</Text>}
            </View>
          </View>

          <Text style={s.h1}>3. Next Actions (다음 분기 실행)</Text>
          {execSummary.nextActions.map((a, i) => (
            <View key={i} style={s.bullet}>
              <Text style={[s.bulletDot, { color: "#10b981" }]}>{i + 1}.</Text>
              <Text style={s.bulletText}>{a}</Text>
            </View>
          ))}
        </Page>
      )}

      {/* 4. STIMULUS */}
      {stimulus && (
        <Page size="A4" style={s.page}>
          <Text style={s.watermark}>SYNTHETIC FGI</Text>
          <Text style={s.pageNum}>4</Text>
          <Text style={s.h1}>4. 검증한 자극물</Text>
          <Text style={[s.h3, { color: "#10b981" }]}>
            [{stimulus.kind}] {stimulus.title}
          </Text>
          <Text style={s.p}>{stimulus.body}</Text>
          {stimulus.competitors && stimulus.competitors.length > 0 && (
            <Text style={[s.pSmall, { marginTop: 6 }]}>
              비교 대상: {stimulus.competitors.join(", ")}
            </Text>
          )}

          {study.researchQuestions && study.researchQuestions.length > 0 && (
            <>
              <Text style={s.h2}>조사 질문</Text>
              {(study.researchQuestions as string[]).map((q, i) => (
                <View key={i} style={s.bullet}>
                  <Text style={s.bulletDot}>{i + 1}.</Text>
                  <Text style={s.bulletText}>{q}</Text>
                </View>
              ))}
            </>
          )}
        </Page>
      )}

      {/* 5. RUN-BY-RUN */}
      {runSummaries.length > 0 && (
        <Page size="A4" style={s.page}>
          <Text style={s.watermark}>SYNTHETIC FGI</Text>
          <Text style={s.pageNum}>5</Text>
          <Text style={s.h1}>5. Run 별 결과 ({runSummaries.length}건)</Text>
          {runSummaries.map((r, idx) => (
            <View key={r.run.id} style={[s.trustBox, { marginBottom: 8 }]}>
              <Text style={s.h3}>
                Run {idx + 1}{r.run.compareLabel ? ` · ${r.run.compareLabel}` : ""}{" "}
                <Text style={s.pSmall}>· {new Date(r.run.startedAt ?? r.run.createdAt).toLocaleString("ko-KR")}</Text>
              </Text>
              <Text style={s.pSmall}>
                패널 {r.run.panelIds.length}명 · 발언 {r.speaks}회 · {Math.round(r.durationMs / 1000)}초
                {typeof r.verdict.acceptance === "number" && ` · 수용도 ${r.verdict.acceptance}/10`}
                {r.verdict.recommend && ` · ${r.verdict.recommend}`}
              </Text>
              {(r.verdict.drivers ?? []).length > 0 && (
                <Text style={[s.pSmall, { marginTop: 3 }]}>
                  매력: {r.verdict.drivers!.join(", ")}
                </Text>
              )}
              {(r.verdict.barriers ?? []).length > 0 && (
                <Text style={s.pSmall}>장벽: {r.verdict.barriers!.join(", ")}</Text>
              )}
            </View>
          ))}
        </Page>
      )}

      {/* 6. REGION COMPARE */}
      {compareGroups.length > 0 && (
        <Page size="A4" style={s.page}>
          <Text style={s.watermark}>SYNTHETIC FGI</Text>
          <Text style={s.pageNum}>6</Text>
          <Text style={s.h1}>6. 권역 비교 분석</Text>
          {compareGroups.map((g, idx) => (
            <View key={g.groupId} style={{ marginBottom: 12 }}>
              <Text style={s.h2}>
                {g.a.run.compareLabel ?? "A"} vs {g.b.run.compareLabel ?? "B"}
              </Text>
              <View style={{ flexDirection: "row" }}>
                <View style={[s.metricCard, { backgroundColor: "#ecfdf5" }]}>
                  <Text style={[s.metricLabel, { color: "#047857" }]}>{g.a.run.compareLabel ?? "A"}</Text>
                  <Text style={[s.metricValue, { color: "#047857" }]}>
                    {g.a.verdict.acceptance ?? "-"}
                  </Text>
                  <Text style={s.pSmall}>수용도</Text>
                </View>
                <View style={[s.metricCard, { backgroundColor: "#eff6ff" }]}>
                  <Text style={[s.metricLabel, { color: "#1d4ed8" }]}>{g.b.run.compareLabel ?? "B"}</Text>
                  <Text style={[s.metricValue, { color: "#1d4ed8" }]}>
                    {g.b.verdict.acceptance ?? "-"}
                  </Text>
                  <Text style={s.pSmall}>수용도</Text>
                </View>
                <View style={[s.metricCard, { backgroundColor: "#f4f4f5" }]}>
                  <Text style={s.metricLabel}>Δ</Text>
                  <Text style={[s.metricValue, { color: "#444" }]}>
                    {typeof g.diff.acceptanceDelta === "number"
                      ? (g.diff.acceptanceDelta >= 0 ? "+" : "") + g.diff.acceptanceDelta.toFixed(1)
                      : "-"}
                  </Text>
                </View>
              </View>
              {g.diff.uniqueDriversA.length + g.diff.uniqueDriversB.length > 0 && (
                <Text style={[s.pSmall, { marginTop: 6 }]}>
                  {g.a.run.compareLabel ?? "A"} 만의 매력: {g.diff.uniqueDriversA.join(", ") || "-"}
                </Text>
              )}
              {g.diff.uniqueDriversB.length > 0 && (
                <Text style={s.pSmall}>
                  {g.b.run.compareLabel ?? "B"} 만의 매력: {g.diff.uniqueDriversB.join(", ") || "-"}
                </Text>
              )}
            </View>
          ))}
          {compareGroups.length === 0 && <Text style={s.p}>(권역 비교 데이터 없음)</Text>}
        </Page>
      )}

      {/* 7. CALIBRATION */}
      {calibrations.length > 0 && (
        <Page size="A4" style={s.page}>
          <Text style={s.watermark}>SYNTHETIC FGI</Text>
          <Text style={s.pageNum}>7</Text>
          <Text style={s.h1}>7. 신뢰도 검증 (Calibration)</Text>
          {calibrations.map((c) => {
            const d = (c.deltas ?? {}) as Record<string, unknown>;
            const agreement = typeof d.agreementPct === "number" ? d.agreementPct : 0;
            const tone =
              agreement >= 70
                ? { bg: "#ecfdf5", color: "#047857" }
                : agreement >= 50
                ? { bg: "#fffbeb", color: "#b45309" }
                : { bg: "#fef2f2", color: "#7f1d1d" };
            return (
              <View key={c.id} style={[s.trustBox, { backgroundColor: tone.bg, marginBottom: 8 }]}>
                <Text style={[s.h3, { color: tone.color }]}>
                  {c.title} · 일치율 {agreement.toFixed(0)}%
                </Text>
                {typeof d.verdict === "string" && (
                  <Text style={[s.p, { color: tone.color }]}>{d.verdict}</Text>
                )}
                {typeof d.analysis === "string" && (
                  <Text style={s.pSmall}>{d.analysis}</Text>
                )}
              </View>
            );
          })}
        </Page>
      )}

      {/* 8. INSIGHTS + QUOTES */}
      <Page size="A4" style={s.page}>
        <Text style={s.watermark}>SYNTHETIC FGI</Text>
        <Text style={s.pageNum}>8</Text>
        <Text style={s.h1}>8. 누적 인사이트 & 핵심 인용구</Text>

        {allInsights.length > 0 && (
          <>
            <Text style={s.h2}>세그먼트 인사이트 ({allInsights.length}건)</Text>
            {allInsights.slice(0, 12).map((t, i) => (
              <View key={i} style={s.bullet}>
                <Text style={s.bulletDot}>·</Text>
                <Text style={s.bulletText}>{t}</Text>
              </View>
            ))}
          </>
        )}

        {allQuotes.length > 0 && (
          <>
            <Text style={s.h2}>핵심 인용구</Text>
            {allQuotes.slice(0, 10).map((q, i) => (
              <View key={i} style={s.quote}>
                <Text>"{q}"</Text>
              </View>
            ))}
          </>
        )}
      </Page>

      {/* 9. METHODOLOGY + DISCLOSURE */}
      <Page size="A4" style={s.page}>
        <Text style={s.watermark}>SYNTHETIC FGI</Text>
        <Text style={s.pageNum}>9</Text>
        <Text style={s.h1}>9. 방법론 · 한계 · 데이터 출처</Text>

        <Text style={s.h2}>패널 구성</Text>
        <Text style={s.p}>
          본 보고서의 가상 참여자는 NVIDIA Nemotron-Personas-Korea 데이터셋(CC BY 4.0)을 기반으로
          생성된 합성 페르소나입니다. 통계청 KOSIS, 대법원, 국민건강보험공단, 한국농촌경제연구원의
          분포를 반영해 252개 시군구 단위로 구성되어 있으며, 본 Study 에서는 시도·연령·직업 필터와
          권역 쿼터를 통해 모집되었습니다.
        </Text>

        <Text style={s.h2}>진행 방식</Text>
        <Text style={s.p}>
          진행자(LLM, Claude Sonnet 4.5) 가 사전 작성된 가이드를 따라 패널 N명에게 차례로 질문하고,
          각 패널은 자신의 페르소나에 일관되게 답변합니다. 발언록은 모두 기록되며, Analyst 에이전트가
          전체 발언을 분석해 인사이트·메트릭·verdict 을 산출합니다.
        </Text>

        <Text style={s.h2}>한계와 보완</Text>
        <Text style={s.p}>
          본 결과는 합성 시뮬레이션이며 실재 인물의 응답이 아닙니다. 의사결정의 단독 근거가 될 수
          없으며, 직감 결정과 외부 리서치 사이의 "의사결정 가속기" 로 활용해 주시기 바랍니다.
          큰 출시 결정 직전엔 실제 정성·정량 조사로 보정이 필요합니다.
        </Text>
        <Text style={s.p}>
          또한 본 데이터셋은 자산·소득·금융상품 보유 등의 금융 행동 데이터를 포함하지 않으므로,
          금융 도메인 특화 결론은 별도 합성 또는 가정에 의존합니다.
        </Text>

        <View style={[s.trustBox, { marginTop: 14 }]}>
          <Text style={[s.pSmall, { fontWeight: "bold" }]}>데이터 출처</Text>
          <Text style={s.pSmall}>
            NVIDIA Nemotron-Personas-Korea (CC BY 4.0)
          </Text>
          <Text style={s.pSmall}>
            https://huggingface.co/datasets/nvidia/Nemotron-Personas-Korea
          </Text>
          <Text style={[s.pSmall, { marginTop: 4 }]}>
            본 데이터셋은 통계청 KOSIS, 대법원, 국민건강보험공단, 한국농촌경제연구원의 인구·가구·소득
            분포를 반영한 합성 페르소나로 구성됩니다.
          </Text>
        </View>

        <Text style={[s.pSmall, { marginTop: 14, textAlign: "center" }]}>
          — 본 보고서는 vFGI 시스템에 의해 자동 생성되었습니다 — Generated {new Date().toLocaleString("ko-KR")} —
        </Text>
      </Page>

      {/* silence unused warning */}
      {void panelMap}
    </Document>
  );
}
