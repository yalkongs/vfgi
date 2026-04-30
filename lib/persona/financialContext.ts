// E5 — 금융 행동 합성 레이어
// 통계청 가구금융복지조사·한국은행 가계금융조사·금감원 금융이해력조사 분포를 기반으로
// 페르소나의 (age, region, occupation, housing) 결합으로 결정론적으로 합성한다.
// LLM 호출 없이 시드 기반 deterministic.

import type { Persona } from "../../db/schema";

export type RiskAversion = "low" | "medium" | "high";
export type DigitalLiteracy = "low" | "medium" | "high";

export type FinancialContext = {
  monthlyIncomeRange: string;
  assetsRange: string;
  debtsRange: string;
  primaryBank: string;
  secondaryBank: string[];
  hasMortgage: boolean;
  hasCreditCard: boolean;
  cardCount: number;
  hasInvestment: boolean;
  investmentTypes: string[];
  riskAversion: RiskAversion;
  digitalLiteracy: DigitalLiteracy;
  preferredChannels: string[]; // 모바일·영업점·콜센터·ATM
  monthlySavings: string;
  pendingFinancialEvents: string[]; // 등록금·결혼·이사·퇴직 등 다음 1년 이벤트
};

// === KOSIS 가구금융복지조사 2024 기반 분포 (단순화) ===
function pickIncomeRange(age: number, occupation: string, housing?: string | null): string {
  const occ = occupation.toLowerCase();
  // 직업 키워드 기반 보정
  const isProfessional = /개발|엔지니어|의사|변호사|회계사|금융|차장|부장|임원|대학|연구/.test(occupation);
  const isManagerial = /부장|차장|팀장|관리자|임원/.test(occupation);
  const isSelfEmployed = /자영업|소상공인|프리랜서|사장|운영|상인/.test(occupation);
  const isLabor = /노무|단순|배달|운수|화물|건설|청소|경비|판매|서비스/.test(occupation);
  const isStudent = /학생/.test(occupation);
  const isRetired = /무직|은퇴|연금/.test(occupation);

  if (isStudent) return "월 100만원 미만";
  if (isRetired) return "월 150~250만원";
  if (age < 30) {
    if (isProfessional) return "월 350~500만원";
    if (isLabor) return "월 200~280만원";
    return "월 250~350만원";
  }
  if (age < 40) {
    if (isManagerial) return "월 600~900만원";
    if (isProfessional) return "월 450~700만원";
    if (isSelfEmployed) return "월 300~600만원 (변동)";
    if (isLabor) return "월 250~350만원";
    return "월 350~500만원";
  }
  if (age < 55) {
    if (isManagerial) return "월 800~1,400만원";
    if (isProfessional) return "월 600~900만원";
    if (isSelfEmployed) return "월 350~700만원 (변동 큼)";
    if (isLabor) return "월 280~400만원";
    return "월 450~650만원";
  }
  if (age < 65) {
    if (isManagerial) return "월 700~1,200만원";
    if (isSelfEmployed) return "월 300~600만원 (변동)";
    if (isLabor) return "월 250~350만원";
    return "월 400~600만원";
  }
  if (occupation.includes("연금")) return "월 80~180만원";
  return "월 150~280만원";
  void housing;
}

function pickAssetsRange(age: number, income: string, housing?: string | null): string {
  const owned = /자가/.test(housing ?? "");
  const apt = /아파트/.test(housing ?? "");
  if (age < 30) return owned ? "5천만~2억" : "1천만~5천만";
  if (age < 40) {
    if (owned && apt) return "3억~7억";
    if (owned) return "1억~3억";
    return "3천만~1억 5천";
  }
  if (age < 55) {
    if (owned && apt) return "5억~12억";
    if (owned) return "2억~5억";
    return "8천만~3억";
  }
  if (age < 65) {
    if (owned && apt) return "6억~15억";
    if (owned) return "3억~7억";
    return "1억~3억";
  }
  if (owned && apt) return "5억~12억 (실거주 + 노후자금)";
  if (owned) return "2억~5억";
  return "5천만~2억";
  void income;
}

function pickDebtsRange(age: number, housing?: string | null, occupation?: string): string {
  const owned = /자가/.test(housing ?? "");
  const rent = /전세/.test(housing ?? "");
  const isSelfEmployed = /자영업|소상공인|사장|상인/.test(occupation ?? "");
  if (age < 30) return rent ? "전세대출 5천만~1억" : "0~2천만";
  if (age < 40) {
    if (owned) return "주담대 1.5억~3.5억";
    if (rent) return "전세대출 1.5억~3억";
    return "0~3천만";
  }
  if (age < 55) {
    if (owned) return "주담대 잔액 1억~3억";
    if (isSelfEmployed) return "사업자대출 5천만~1.5억";
    if (rent) return "전세대출 1억~2.5억";
    return "0~5천만";
  }
  if (age < 65) {
    if (owned) return "주담대 잔액 0~1.5억 (상환 중)";
    if (isSelfEmployed) return "사업자대출 3천만~1억";
    return "0~3천만";
  }
  return "거의 없음";
}

// 권역별 주거래은행 선호 분포 (단순화)
const PRIMARY_BANK_POOL: Record<string, string[]> = {
  대구: ["iM뱅크", "iM뱅크", "국민", "신한", "농협"], // iM 가중치
  경상북: ["iM뱅크", "농협", "iM뱅크", "신한"],
  경북: ["iM뱅크", "농협", "iM뱅크", "신한"],
  경상남: ["부산은행", "농협", "신한", "국민"],
  경남: ["부산은행", "농협", "신한", "국민"],
  부산: ["부산은행", "국민", "신한", "농협"],
  울산: ["부산은행", "국민", "농협"],
  광주: ["광주은행", "농협", "국민"],
  전라남: ["광주은행", "농협", "국민"],
  전남: ["광주은행", "농협", "국민"],
  전라북: ["전북은행", "농협", "국민"],
  전북: ["전북은행", "농협", "국민"],
  서울: ["국민", "신한", "하나", "우리", "카카오뱅크"],
  경기: ["국민", "신한", "농협", "하나", "카카오뱅크"],
  인천: ["국민", "신한", "농협", "우리"],
  대전: ["국민", "신한", "농협"],
  충청남: ["국민", "농협", "신한"],
  충남: ["국민", "농협", "신한"],
  충청북: ["국민", "농협", "신한"],
  충북: ["국민", "농협", "신한"],
  세종: ["국민", "신한", "농협"],
  강원: ["농협", "국민", "신한"],
  제주: ["제주은행", "국민", "농협"],
};

function hash(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0;
  return Math.abs(h);
}

function pickPrimaryBank(persona: Pick<Persona, "id" | "province" | "age">): string {
  const pool = PRIMARY_BANK_POOL[persona.province] ?? ["국민", "신한", "농협"];
  // 30대 미만은 인터넷은행 가중치 ↑
  const candidates =
    persona.age < 35 ? [...pool, "카카오뱅크", "토스뱅크"] : pool;
  return candidates[hash(persona.id + "primary") % candidates.length];
}

function pickSecondary(persona: Pick<Persona, "id" | "age">, primary: string): string[] {
  const all = ["카카오뱅크", "토스뱅크", "케이뱅크", "신한", "국민", "하나", "농협"];
  const filtered = all.filter((b) => b !== primary);
  const count = persona.age < 40 ? 2 : 1;
  const out: string[] = [];
  for (let i = 0; i < count; i++) {
    const idx = hash(persona.id + "sec" + i) % filtered.length;
    if (!out.includes(filtered[idx])) out.push(filtered[idx]);
  }
  return out;
}

function pickRiskAversion(age: number, occupation: string): RiskAversion {
  if (age < 35 && /개발|엔지니어|마케팅|광고/.test(occupation)) return "low";
  if (age < 45) return "medium";
  if (age >= 60) return "high";
  return "medium";
}

function pickDigitalLiteracy(age: number, occupation: string): DigitalLiteracy {
  if (/개발|디자인|마케팅|IT|디지털|AI|UX/.test(occupation)) return "high";
  if (age < 40) return "high";
  if (age < 55) return "medium";
  if (age < 70) return "low";
  return "low";
}

function pickPreferredChannels(literacy: DigitalLiteracy, age: number): string[] {
  if (literacy === "high") return ["모바일앱", "인터넷뱅킹", "오픈뱅킹"];
  if (literacy === "medium") {
    if (age >= 50) return ["모바일앱(간단조회)", "영업점(상품가입)", "ATM"];
    return ["모바일앱", "영업점", "ATM"];
  }
  return ["영업점", "콜센터", "ATM", "통장"];
}

function pickPendingEvents(persona: Pick<Persona, "age" | "familyType" | "id">): string[] {
  const out: string[] = [];
  const family = persona.familyType ?? "";
  if (persona.age >= 28 && persona.age < 38 && /부부|미혼/.test(family)) {
    if (hash(persona.id + "marriage") % 4 === 0) out.push("결혼·신혼집 마련 (1~2년 내)");
  }
  if (/자녀/.test(family)) {
    if (persona.age >= 35 && persona.age < 50)
      out.push("자녀 사교육비 증가 (학원·과외)");
    if (persona.age >= 45 && persona.age < 60)
      out.push("자녀 대학 등록금 (1~3년 내)");
    if (persona.age >= 50)
      out.push("자녀 결혼자금 (5년 내)");
  }
  if (persona.age >= 50 && persona.age < 65) out.push("노후자금 마련");
  if (persona.age >= 58) out.push("퇴직 또는 사업 정리 검토");
  if (persona.age >= 65) out.push("의료비 대비");
  return out;
}

function pickInvestment(literacy: DigitalLiteracy, age: number, persona: Pick<Persona, "id">): {
  has: boolean;
  types: string[];
} {
  if (literacy === "low" && age >= 60) return { has: false, types: [] };
  const types: string[] = [];
  if (literacy === "high" && age < 45) {
    if (hash(persona.id + "etf") % 2 === 0) types.push("미국 ETF (S&P500/나스닥)");
    if (hash(persona.id + "krx") % 3 === 0) types.push("국내 주식");
    if (hash(persona.id + "coin") % 4 === 0) types.push("암호화폐 소액");
  } else if (age < 60) {
    if (hash(persona.id + "fund") % 3 === 0) types.push("적립식 펀드");
    if (hash(persona.id + "krx") % 4 === 0) types.push("국내 주식 (보수적)");
  } else {
    if (hash(persona.id + "bond") % 3 === 0) types.push("국채");
  }
  return { has: types.length > 0, types };
}

export function synthesizeFinancialContext(persona: Persona): FinancialContext {
  const occ = persona.occupation ?? "";
  const monthlyIncomeRange = pickIncomeRange(persona.age, occ, persona.housingType);
  const assetsRange = pickAssetsRange(persona.age, monthlyIncomeRange, persona.housingType);
  const debtsRange = pickDebtsRange(persona.age, persona.housingType, occ);
  const primaryBank = pickPrimaryBank(persona);
  const secondaryBank = pickSecondary(persona, primaryBank);
  const riskAversion = pickRiskAversion(persona.age, occ);
  const digitalLiteracy = pickDigitalLiteracy(persona.age, occ);
  const preferredChannels = pickPreferredChannels(digitalLiteracy, persona.age);
  const investment = pickInvestment(digitalLiteracy, persona.age, persona);
  const pendingFinancialEvents = pickPendingEvents(persona);

  const hasMortgage = /주담대|주택담보/.test(debtsRange);
  const hasCreditCard =
    !(persona.age >= 70) && digitalLiteracy !== "low" ? true : hash(persona.id + "card") % 3 !== 0;
  const cardCount = digitalLiteracy === "high" && persona.age < 45 ? 2 : 1;

  // 월 저축률 추정
  const monthlySavings =
    persona.age < 35
      ? "월 30~80만원 (자산 형성기)"
      : persona.age < 50
      ? "월 50~150만원 (가족·교육비 부담)"
      : persona.age < 65
      ? "월 80~250만원 (노후 대비)"
      : "월 30~100만원 (이자 수령 + 일부 저축)";

  return {
    monthlyIncomeRange,
    assetsRange,
    debtsRange,
    primaryBank,
    secondaryBank,
    hasMortgage,
    hasCreditCard,
    cardCount,
    hasInvestment: investment.has,
    investmentTypes: investment.types,
    riskAversion,
    digitalLiteracy,
    preferredChannels,
    monthlySavings,
    pendingFinancialEvents,
  };
}

export function formatFinancialContext(f: FinancialContext): string {
  return [
    `소득: ${f.monthlyIncomeRange}`,
    `자산: ${f.assetsRange}`,
    `부채: ${f.debtsRange}`,
    `주거래: ${f.primaryBank}${f.secondaryBank.length ? ` + ${f.secondaryBank.join(", ")}` : ""}`,
    `카드: ${f.hasCreditCard ? `${f.cardCount}장 보유` : "없음"} | 주담대: ${f.hasMortgage ? "있음" : "없음"}`,
    `투자: ${f.hasInvestment ? f.investmentTypes.join(", ") : "없음"}`,
    `리스크 성향: ${f.riskAversion} | 디지털: ${f.digitalLiteracy}`,
    `선호 채널: ${f.preferredChannels.join(" → ")}`,
    `월 저축: ${f.monthlySavings}`,
    f.pendingFinancialEvents.length
      ? `예정 이벤트: ${f.pendingFinancialEvents.join(" / ")}`
      : "예정 이벤트: -",
  ].join("\n");
}
