// E10 — Realism 4지표 (DCS/LDI/RDS/SAS) 자동 측정
// LLM 호출 없이 deterministic 한 점수 계산.

import type { FGIEvent } from "../eventStream";
import type { Persona } from "../../db/schema";
import { synthesizeFinancialContext } from "../persona/financialContext";
import { getDistrictInfo } from "../persona/districtContext";

export type RealismScores = {
  dcs: number; // Demographic Consistency Score (0-1)
  ldi: number; // Linguistic Diversity Index (0-1+)
  rds: number; // Response Diversity Score (0-1)
  sas: number; // Situational Anchoring Score (mean per speak, 0-N)
  computedAt: string;
  details: {
    speakCount: number;
    avgSpeakLength: number;
    speakLengthStd: number;
    pairwiseSimilarity: number;
    referencePool: number; // 페르소나 인용 가능 토큰 풀 크기
  };
};

function tokenize(text: string): string[] {
  // 간단 토크나이저 — 한국어 어절 + 영문/숫자
  return text
    .toLowerCase()
    .replace(/[.,!?"'·…\\\[\\\]\(\)]/g, " ")
    .split(/\s+/)
    .filter((t) => t.length > 0);
}

function jaccard(a: Set<string>, b: Set<string>): number {
  if (a.size === 0 && b.size === 0) return 1;
  let inter = 0;
  for (const x of a) if (b.has(x)) inter++;
  const union = a.size + b.size - inter;
  return union === 0 ? 0 : inter / union;
}

function computeTTR(tokens: string[]): number {
  if (tokens.length === 0) return 0;
  const types = new Set(tokens);
  return types.size / tokens.length;
}

// === DCS — 인구학적 일관성 ===
// 단일 발화에서 페르소나 카드와 명시적 모순 키워드 검출 (룰 기반).
// LLM judge 모드는 옵션 (precision mode 와 통합 가능).
function detectDemographicViolations(
  speakText: string,
  persona: Persona
): number {
  const text = speakText.toLowerCase();
  let violations = 0;

  // 연령 모순
  if (persona.age >= 65) {
    if (/(tiktok|틱톡|디스코드|메타버스|크립토|코인|ㅋㅋㅋㅋ|ㅎㅎㅎ)/.test(text)) violations++;
    if (/(찐|갓생|MZ|JMT|킹받)/.test(text)) violations++;
  }
  if (persona.age < 30) {
    if (/(어렸을 적|예전엔|옛날엔|내 나이가 되면)/.test(text)) violations++;
  }

  // 직업 모순
  if (/전업주부|무직/.test(persona.occupation)) {
    if (/(우리 회사|사무실에서|회의에서|상사가)/.test(text)) violations++;
  }
  if (persona.age >= 65 && /(스타트업|대기업 임원)/.test(persona.occupation)) {
    // 65+ 가 현직 임원이라고 하면 흔한 모순
  }

  // 지역 모순 — 다른 지역 랜드마크 인용
  const district = getDistrictInfo(persona.province, persona.district);
  if (district.region === "영남") {
    if (/(한강|홍대|강남|판교|광화문)/.test(text)) violations++;
  }
  if (district.region === "수도권") {
    if (/(수성못|동성로|서면|국제시장|광주 송정|순천만)/.test(text)) violations++;
  }

  return violations;
}

export function computeRealismScores(
  events: FGIEvent[],
  panel: Persona[]
): RealismScores {
  const speaks = events.filter((e) => e.type === "speak") as Array<
    Extract<FGIEvent, { type: "speak" }>
  >;
  const personaMap = Object.fromEntries(panel.map((p) => [p.id, p]));

  if (speaks.length === 0) {
    return {
      dcs: 0,
      ldi: 0,
      rds: 0,
      sas: 0,
      computedAt: new Date().toISOString(),
      details: {
        speakCount: 0,
        avgSpeakLength: 0,
        speakLengthStd: 0,
        pairwiseSimilarity: 1,
        referencePool: 0,
      },
    };
  }

  // 발화 기본 통계
  const lengths = speaks.map((s) => s.text.length);
  const avgLen = lengths.reduce((a, b) => a + b, 0) / lengths.length;
  const lenVar =
    lengths.reduce((a, b) => a + (b - avgLen) ** 2, 0) / lengths.length;
  const lenStd = Math.sqrt(lenVar);

  const tokenSets = speaks.map((s) => new Set(tokenize(s.text)));

  // === DCS ===
  let totalViolations = 0;
  for (const sp of speaks) {
    const p = personaMap[sp.personaId];
    if (!p) continue;
    totalViolations += detectDemographicViolations(sp.text, p);
  }
  const dcs = Math.max(0, 1 - totalViolations / speaks.length);

  // === LDI ===
  // 표준편차/평균 (CV) + 평균 TTR + 길이 다양성
  const cv = avgLen > 0 ? lenStd / avgLen : 0;
  const meanTTR =
    speaks.reduce((a, s) => a + computeTTR(tokenize(s.text)), 0) / speaks.length;

  // 8명 발화 토큰의 전체 union vs 개별 평균 — 어휘 풀 다양성
  let pairOverlap = 0;
  let pairCount = 0;
  for (let i = 0; i < tokenSets.length; i++) {
    for (let j = i + 1; j < tokenSets.length; j++) {
      pairOverlap += jaccard(tokenSets[i], tokenSets[j]);
      pairCount++;
    }
  }
  const avgPairwiseJaccard = pairCount > 0 ? pairOverlap / pairCount : 0;
  const vocabDiversity = 1 - avgPairwiseJaccard;
  const ldi = Math.min(1, 0.4 * cv + 0.3 * meanTTR + 0.3 * vocabDiversity);

  // === RDS ===
  // 패널 간 발화 다양성 — 동일 페르소나의 발화는 묶어서 평균 발화 토큰셋 만듦
  const personaTokens = new Map<string, Set<string>>();
  for (const sp of speaks) {
    const cur = personaTokens.get(sp.personaId) ?? new Set<string>();
    for (const t of tokenize(sp.text)) cur.add(t);
    personaTokens.set(sp.personaId, cur);
  }
  const personaSets = Array.from(personaTokens.values());
  let pairSim = 0;
  let pairs = 0;
  for (let i = 0; i < personaSets.length; i++) {
    for (let j = i + 1; j < personaSets.length; j++) {
      pairSim += jaccard(personaSets[i], personaSets[j]);
      pairs++;
    }
  }
  const avgPersonaSim = pairs > 0 ? pairSim / pairs : 0;
  const rds = 1 - avgPersonaSim;

  // === SAS ===
  // 발화에서 페르소나 카드 attribute 인용 횟수 평균
  let totalReferences = 0;
  let totalPool = 0;
  for (const sp of speaks) {
    const p = personaMap[sp.personaId];
    if (!p) continue;
    const fields = (p.fields ?? {}) as Record<string, unknown>;
    const fin = synthesizeFinancialContext(p);
    const district = getDistrictInfo(p.province, p.district);
    // 인용 후보 토큰 추출
    const refTokens = new Set<string>();
    refTokens.add(p.province);
    refTokens.add(p.district);
    refTokens.add(p.occupation);
    if (p.familyType) refTokens.add(p.familyType);
    if (p.housingType) refTokens.add(p.housingType);
    refTokens.add(fin.primaryBank);
    for (const sb of fin.secondaryBank) refTokens.add(sb);
    for (const lm of district.landmarks) refTokens.add(lm);
    for (const ind of district.industries) refTokens.add(ind);
    for (const not of district.notable) refTokens.add(not);
    for (const ev of fin.pendingFinancialEvents) refTokens.add(ev);
    // persona summary 에서 단어 추출
    const summary = String(fields.persona ?? "");
    for (const word of tokenize(summary)) if (word.length >= 2) refTokens.add(word);

    totalPool += refTokens.size;

    let refs = 0;
    for (const tok of refTokens) {
      if (tok && tok.length >= 2 && sp.text.includes(tok)) refs++;
    }
    totalReferences += refs;
  }
  const sas = speaks.length > 0 ? totalReferences / speaks.length : 0;

  return {
    dcs: Number(dcs.toFixed(3)),
    ldi: Number(ldi.toFixed(3)),
    rds: Number(rds.toFixed(3)),
    sas: Number(sas.toFixed(3)),
    computedAt: new Date().toISOString(),
    details: {
      speakCount: speaks.length,
      avgSpeakLength: Math.round(avgLen),
      speakLengthStd: Math.round(lenStd),
      pairwiseSimilarity: Number(avgPersonaSim.toFixed(3)),
      referencePool: totalPool,
    },
  };
}

export function realismGrade(scores: RealismScores): {
  overall: number; // 0-100
  grade: "A" | "B" | "C" | "D";
  notes: string[];
} {
  const overall =
    scores.dcs * 30 + scores.ldi * 20 + scores.rds * 25 + Math.min(1, scores.sas / 1.8) * 25;
  const grade =
    overall >= 80 ? "A" : overall >= 65 ? "B" : overall >= 50 ? "C" : "D";
  const notes: string[] = [];
  if (scores.dcs < 0.85) notes.push("DCS 낮음 — 페르소나 모순 발화 발견");
  if (scores.rds < 0.35) notes.push("RDS 낮음 — 패널 발화가 비슷한 톤으로 수렴");
  if (scores.sas < 1.5) notes.push("SAS 낮음 — 페르소나 디테일 인용 부족, 일반론 발화 다수");
  if (scores.ldi < 0.45) notes.push("LDI 낮음 — 어휘·문체 다양성 부족");
  return { overall: Number(overall.toFixed(1)), grade, notes };
}
