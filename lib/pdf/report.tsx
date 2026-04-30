import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
  Font,
} from "@react-pdf/renderer";
import { resolve } from "node:path";
import type { Run, Study, Stimulus, Persona } from "../../db/schema";
import type { RunSummary } from "../diff";

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

const styles = StyleSheet.create({
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
  cover: {
    paddingTop: 100,
  },
  title: {
    fontSize: 28,
    fontWeight: "bold",
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    color: "#555",
    marginBottom: 60,
  },
  meta: {
    fontSize: 10,
    color: "#666",
    lineHeight: 1.5,
  },
  h2: {
    fontSize: 16,
    fontWeight: "bold",
    marginTop: 14,
    marginBottom: 8,
    borderBottomWidth: 2,
    borderBottomColor: "#10b981",
    paddingBottom: 4,
  },
  h3: {
    fontSize: 12,
    fontWeight: "bold",
    marginTop: 10,
    marginBottom: 4,
  },
  p: {
    fontSize: 10,
    lineHeight: 1.5,
    marginBottom: 4,
  },
  panelGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
  },
  panelCard: {
    width: "48%",
    padding: 8,
    backgroundColor: "#f4f4f5",
    borderRadius: 4,
    marginBottom: 6,
  },
  metricRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 4,
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },
  badge: {
    backgroundColor: "#10b981",
    color: "white",
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 99,
    fontSize: 9,
  },
  bullet: {
    flexDirection: "row",
    marginBottom: 3,
  },
  bulletDot: {
    width: 10,
    fontWeight: "bold",
  },
  bulletText: {
    flex: 1,
    fontSize: 10,
    lineHeight: 1.4,
  },
  quoteCard: {
    padding: 8,
    backgroundColor: "#fef3c7",
    borderLeftWidth: 3,
    borderLeftColor: "#f59e0b",
    marginBottom: 6,
    fontStyle: "italic",
  },
});

export type ReportInput = {
  study: Study;
  stimulus: Stimulus;
  run: Run;
  panel: Persona[];
  summary: RunSummary;
};

export function buildReportDocument(input: ReportInput) {
  ensureFonts();
  const { study, stimulus, run, panel, summary } = input;

  return (
    <Document
      title={`vFGI 리포트 — ${study.title}`}
      author="iM뱅크 가상 인터뷰"
      subject={study.objective}
    >
      <Page size="A4" style={styles.page}>
        <Text style={styles.watermark}>SYNTHETIC FGI · 합성 페르소나 기반</Text>

        <View style={styles.cover}>
          <Text style={styles.title}>{study.title}</Text>
          <Text style={styles.subtitle}>vFGI · Virtual Focus Group Interview Report</Text>
          <Text style={styles.meta}>
            목적: {study.objective}
          </Text>
          <Text style={styles.meta}>
            실행일: {run.startedAt ? new Date(run.startedAt).toLocaleString("ko-KR") : "-"}
          </Text>
          <Text style={styles.meta}>
            참여자: {panel.length}명 · 발언 {summary.speaks}회 · 진행 {Math.round(summary.durationMs / 1000)}초
          </Text>
          <Text style={styles.meta}>
            Run ID: {run.id}
          </Text>
          <Text style={styles.meta}>Seed: {run.seed}</Text>
        </View>
      </Page>

      <Page size="A4" style={styles.page}>
        <Text style={styles.watermark}>SYNTHETIC FGI</Text>
        <Text style={styles.h2}>1. 핵심 요약</Text>

        <View style={{ flexDirection: "row", gap: 8, marginBottom: 10 }}>
          <View style={{ flex: 1, padding: 10, backgroundColor: "#ecfdf5", borderRadius: 4 }}>
            <Text style={{ fontSize: 9, color: "#047857" }}>수용도 (0-10)</Text>
            <Text style={{ fontSize: 28, fontWeight: "bold", color: "#047857" }}>
              {summary.verdict.acceptance ?? "-"}
            </Text>
          </View>
          <View style={{ flex: 1, padding: 10, backgroundColor: "#f4f4f5", borderRadius: 4 }}>
            <Text style={{ fontSize: 9, color: "#52525b" }}>최종 판정</Text>
            <Text style={{ fontSize: 16, fontWeight: "bold", marginTop: 6 }}>
              {summary.verdict.recommend ?? "(미판정)"}
            </Text>
          </View>
        </View>

        <Text style={styles.h3}>핵심 매력 포인트</Text>
        {(summary.verdict.drivers ?? []).map((d, i) => (
          <View key={i} style={styles.bullet}>
            <Text style={styles.bulletDot}>+</Text>
            <Text style={styles.bulletText}>{d}</Text>
          </View>
        ))}
        {(summary.verdict.drivers ?? []).length === 0 && (
          <Text style={styles.p}>(데이터 없음)</Text>
        )}

        <Text style={styles.h3}>핵심 장벽</Text>
        {(summary.verdict.barriers ?? []).map((b, i) => (
          <View key={i} style={styles.bullet}>
            <Text style={styles.bulletDot}>-</Text>
            <Text style={styles.bulletText}>{b}</Text>
          </View>
        ))}
        {(summary.verdict.barriers ?? []).length === 0 && (
          <Text style={styles.p}>(데이터 없음)</Text>
        )}

        {Object.keys(summary.metrics).length > 0 && (
          <>
            <Text style={styles.h2}>2. 메트릭</Text>
            {Object.entries(summary.metrics).map(([k, v]) => (
              <View key={k} style={styles.metricRow}>
                <Text>{k}</Text>
                <Text style={{ fontWeight: "bold" }}>{v.toFixed(2)}</Text>
              </View>
            ))}
          </>
        )}

        <Text style={styles.h2}>3. 검증한 자극물</Text>
        <Text style={[styles.h3, { color: "#10b981" }]}>
          [{stimulus.kind}] {stimulus.title}
        </Text>
        <Text style={styles.p}>{stimulus.body}</Text>
        {stimulus.competitors && stimulus.competitors.length > 0 && (
          <Text style={[styles.p, { color: "#666", marginTop: 4 }]}>
            비교 대상: {stimulus.competitors.join(", ")}
          </Text>
        )}
      </Page>

      <Page size="A4" style={styles.page}>
        <Text style={styles.watermark}>SYNTHETIC FGI</Text>
        <Text style={styles.h2}>4. 참여자 ({panel.length}명)</Text>
        <View style={styles.panelGrid}>
          {panel.map((p) => (
            <View key={p.id} style={styles.panelCard}>
              <Text style={{ fontWeight: "bold", fontSize: 11 }}>{p.name}</Text>
              <Text style={{ color: "#555", fontSize: 9, marginTop: 2 }}>
                {p.sex} {p.age}세 · {p.province} {p.district}
              </Text>
              <Text style={{ color: "#555", fontSize: 9 }}>
                {p.occupation}
              </Text>
            </View>
          ))}
        </View>

        {summary.insightTopics.length > 0 && (
          <>
            <Text style={styles.h2}>5. 세그먼트 인사이트</Text>
            {summary.insightTopics.map((t, i) => (
              <View key={i} style={styles.bullet}>
                <Text style={styles.bulletDot}>•</Text>
                <Text style={styles.bulletText}>{t}</Text>
              </View>
            ))}
          </>
        )}

        {summary.topQuotes.length > 0 && (
          <>
            <Text style={styles.h2}>6. 핵심 인용구</Text>
            {summary.topQuotes.map((q, i) => (
              <View key={i} style={styles.quoteCard}>
                <Text>"{q}"</Text>
              </View>
            ))}
          </>
        )}

        <View style={{ marginTop: 30, borderTopWidth: 1, borderTopColor: "#ddd", paddingTop: 10 }}>
          <Text style={[styles.p, { color: "#888", fontSize: 8, fontWeight: "bold" }]}>
            데이터 출처 · 페르소나 생성 기반
          </Text>
          <Text style={[styles.p, { color: "#888", fontSize: 8 }]}>
            본 리포트의 가상 참여자(페르소나)는 NVIDIA Nemotron-Personas-Korea 데이터셋
            (CC BY 4.0, https://huggingface.co/datasets/nvidia/Nemotron-Personas-Korea)을
            기반으로 생성되었습니다. 해당 데이터셋은 통계청 KOSIS, 대법원, 국민건강보험공단,
            농촌경제연구원 등 한국 공공데이터 분포를 반영한 합성 페르소나로 구성됩니다.
          </Text>
          <Text style={[styles.p, { color: "#888", fontSize: 8, marginTop: 6 }]}>
            본 결과는 합성 페르소나 기반 시뮬레이션이며 실재 인물의 응답이 아닙니다.
            의사결정 전 실제 정성/정량 조사로 결과를 보정한 후 활용하시기 바랍니다.
          </Text>
        </View>
      </Page>
    </Document>
  );
}
