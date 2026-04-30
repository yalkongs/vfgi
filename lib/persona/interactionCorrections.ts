// E6 — 변수 교호작용 보정 (정적 사전 v0)
// 본 데이터셋이 단일 변수 분포는 정확하나 변수 간 교호작용이 약함.
// 자주 묻는 자극물 도메인에서 주의해야 할 (region × age × occupation × topic) 패턴을
// 외부 통계·실무 지식 기반으로 정의해, 패널 발화 시 LLM 이 참고하도록 컨텍스트로 주입.
//
// 향후 R&D: 실제 FGI 결과로부터 이 규칙들을 자동 학습 (Phase D).

export type InteractionRule = {
  id: string;
  match: {
    region?: string[]; // 권역
    ageMin?: number;
    ageMax?: number;
    occupationKeyword?: string[];
    stimulusKind?: string[]; // concept, copy, ux_screen, ...
  };
  guidance: string; // 발화 시 참고할 한 문장
};

export const INTERACTION_RULES: InteractionRule[] = [
  // 영남 자영업 시니어 — 디지털 보수성 강함
  {
    id: "yng-self-senior-digital",
    match: { region: ["영남"], ageMin: 50, occupationKeyword: ["자영업", "사장", "상인"], stimulusKind: ["ux_screen", "feature", "channel"] },
    guidance:
      "영남 50+ 자영업자는 모바일 신기능을 '귀찮다·복잡하다·실수할까 무섭다'로 표현하는 경향. 영업점 직원과의 신뢰 관계를 자주 언급.",
  },
  // 호남 60대 농업 — 농협 의존도
  {
    id: "hnm-farm-senior-bank",
    match: { region: ["호남"], ageMin: 55, occupationKeyword: ["농업", "농민", "어업"], stimulusKind: ["concept", "policy", "channel"] },
    guidance:
      "호남 농업 60대는 농협을 '진짜 은행'으로 인식. 시중은행 상품을 '동네 분위기와 안 맞는다'고 평가하는 경향. 이장·작목반 의견을 자주 인용.",
  },
  // 수도권 30대 워킹맘 — 시간 빈곤 + 자녀 교육비
  {
    id: "metro-30s-mom",
    match: { region: ["수도권"], ageMin: 30, ageMax: 45, occupationKeyword: ["간호사", "워킹맘", "교사", "직장인"], stimulusKind: ["concept", "feature", "ux_screen"] },
    guidance:
      "수도권 30~40대 워킹맘은 '시간이 가장 비싸다'·'자동이체 안 되는 건 안 쓴다'·'아이 교육비가 우선'을 자주 표현. 출석·매일 미션·게이미피케이션은 부담으로 인식하는 경우 많음.",
  },
  // 분당/판교 IT 30대 — 가격·앱UX 까다로움
  {
    id: "metro-it-30s",
    match: { region: ["수도권"], ageMin: 28, ageMax: 42, occupationKeyword: ["개발", "엔지니어", "디자이너", "IT"], stimulusKind: ["concept", "ux_screen", "copy", "price"] },
    guidance:
      "IT 직군 30대는 앱 UX·로딩 속도·데이터 보안에 까다로움. 카피의 '뉘앙스 어색함'을 빨리 잡아냄. 토스·카카오뱅크와의 비교를 적극 언급.",
  },
  // 영남 50대 부부+미혼자녀 가구 — 자녀 등록금·결혼 부담
  {
    id: "yng-50s-family",
    match: { region: ["영남"], ageMin: 45, ageMax: 60, occupationKeyword: ["회사", "사무", "공무원", "교사", "제조"], stimulusKind: ["concept", "price", "feature"] },
    guidance:
      "영남 50대 자녀양육 가구는 '자녀 등록금'·'결혼자금'·'부모 의료비'를 동시에 지고 있음. 만기 12개월 적금이라도 중도해지 가능성을 미리 걱정.",
  },
  // 충청 60+ 시니어 — 절약·검소 정서
  {
    id: "chc-senior-thrift",
    match: { region: ["충청"], ageMin: 60, stimulusKind: ["concept", "price"] },
    guidance:
      "충청 60+ 는 '소박하다'·'쏠쏠하다' 표현 빈도 높음. 큰 수익보다 안정·원금보장을 우선. 광고가 화려하면 '뭔가 숨긴 것 같다' 경계심.",
  },
  // 부산·울산 대기업 정규직 — 고소득·자녀 사교육
  {
    id: "bsl-corp-40s",
    match: { region: ["영남"], ageMin: 35, ageMax: 55, occupationKeyword: ["현대중공업", "포스코", "삼성", "LG", "SK"], stimulusKind: ["concept", "price"] },
    guidance:
      "부산·울산 대기업 정규직은 사원 대출·복지·퇴직금 비교를 자주. 시중은행 상품을 '회사 거래은행'과 비교해 평가.",
  },
  // 제주 40대 관광·서비스업
  {
    id: "jeju-tourism",
    match: { region: ["강원제주"], ageMin: 30, ageMax: 55, occupationKeyword: ["관광", "서비스", "숙박", "음식"], stimulusKind: ["concept", "channel"] },
    guidance:
      "제주 관광·서비스업 40대는 '성수기 vs 비수기 현금흐름 격차' 를 자주 언급. 단기 자유적금·예금 선호.",
  },
  // 강남·분당 임원/부장
  {
    id: "metro-exec",
    match: { region: ["수도권"], ageMin: 45, occupationKeyword: ["임원", "부장", "차장", "이사"], stimulusKind: ["concept", "price", "brand"] },
    guidance:
      "수도권 고소득 임원/부장은 실효 금리·중도해지 패널티·세제혜택을 까다롭게. 마케팅 카피보다 약관 디테일을 봄.",
  },
];

export function findRelevantInteractions(
  region: string,
  age: number,
  occupation: string,
  stimulusKind: string
): InteractionRule[] {
  return INTERACTION_RULES.filter((r) => {
    if (r.match.region && !r.match.region.includes(region)) return false;
    if (r.match.ageMin !== undefined && age < r.match.ageMin) return false;
    if (r.match.ageMax !== undefined && age > r.match.ageMax) return false;
    if (r.match.occupationKeyword) {
      if (!r.match.occupationKeyword.some((k) => occupation.includes(k))) return false;
    }
    if (r.match.stimulusKind && !r.match.stimulusKind.includes(stimulusKind)) return false;
    return true;
  });
}
