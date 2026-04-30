// E3 — 사투리·세대 어휘 사전
// 페르소나의 (region × age_band) 셀별 어휘 힌트.
// 강제하지 않음 — "자연스러우면 사용하라" 수준의 프롬프트 hint.

export type DialectKey = "표준" | "영남" | "호남" | "충청" | "강원" | "제주";
export type AgeBand = "MZ" | "X세대" | "베이비붐" | "고령";

export function ageBand(age: number): AgeBand {
  if (age < 35) return "MZ"; // 1990년대 이후 출생
  if (age < 55) return "X세대";
  if (age < 70) return "베이비붐";
  return "고령";
}

const REGIONAL_MARKERS: Record<DialectKey, string[]> = {
  표준: [
    // 표준어 — 사투리 마커 없음. 외래어 비율은 세대별로 다름.
  ],
  영남: [
    "그래갖고", "와이러노", "디게", "쪼매", "마", "그라모",
    "어쩐다고", "그란데", "캤다", "안카나", "기어이", "택도없다",
    "퍼뜩", "고마", "이래도", "있나", "마이", "쪼만", "택도",
  ],
  호남: [
    "긍께", "워매", "거시기", "허벌나게", "그라제", "잉",
    "글쎄잉", "아따", "징허네", "겁나게", "어찌끄나",
    "안되겄어", "할라고", "어쩐당가", "이리오쇼",
  ],
  충청: [
    "충청도 양반인디", "그려", "아녀", "혀", "갔슈", "왔슈",
    "허는데유", "그류", "그랴", "먼저 하슈", "이짝", "저짝",
  ],
  강원: [
    "그래여", "그치만요", "여기두", "있어유", "허는데",
    "감자루", "내려가요", "올라가요",
  ],
  제주: [
    "혼저옵서예", "수다", "고팡", "할망", "하르방", "왓수다",
    "고마와요", "어디 감수꽈", "맞수다",
  ],
};

const GENERATIONAL_VOCABULARY: Record<AgeBand, string[]> = {
  MZ: [
    "찐", "갓생", "MZ", "찐이다", "킹받네", "ㅇㅈ", "ㄹㅇ",
    "급식체", "대박", "헐", "아 진짜", "꼴받", "팩폭",
    "JMT", "미쳤다", "끝내준다", "찐친", "혼틈", "갠소",
  ],
  X세대: [
    "솔직히", "대박", "장난 아니다", "괜찮네", "그렇긴 한데",
    "별로다", "쏠쏠하다", "괜찮은 것 같은데", "그래도",
  ],
  베이비붐: [
    "젊었을 적엔", "예전에는", "옛날에는", "내 나이가 되면",
    "그땐 그게 흔했어", "쏠쏠했다", "튼튼하다", "값어치",
    "신중해야 한다", "차근차근", "어른 말 좀 들어",
  ],
  고령: [
    "옛날엔", "내 어렸을 때", "그땐 그랬지", "지금은 모르겠고",
    "동네 어른들이", "이장님이", "은행 직원이",
    "젊은 사람들 같지가 않아", "다 그래", "그러면 안 되지",
  ],
};

const FINANCIAL_VOCAB: Record<AgeBand, string[]> = {
  MZ: ["토스", "카카오뱅크", "ETF", "코인", "주식 앱", "자동이체", "리워드", "캐시백"],
  X세대: ["청약", "대출 갈아타기", "신용카드 혜택", "예적금", "보험", "주거래은행"],
  베이비붐: ["정기예금", "국채", "보장성 보험", "퇴직금", "자녀 결혼", "노후"],
  고령: ["통장", "농협", "이장님", "현금", "은행 영업점", "연금", "공제회"],
};

export type DialectHint = {
  dialect: DialectKey;
  ageBand: AgeBand;
  regionalMarkers: string[];
  generationalVocab: string[];
  financialVocab: string[];
  guidance: string;
};

export function buildDialectHint(dialect: DialectKey, age: number): DialectHint {
  const ab = ageBand(age);
  const regionalMarkers = REGIONAL_MARKERS[dialect].slice(0, 8);
  const generationalVocab = GENERATIONAL_VOCABULARY[ab].slice(0, 8);
  const financialVocab = FINANCIAL_VOCAB[ab];

  let guidance = "";
  if (dialect === "표준") {
    guidance = `${ab} 세대 표준어 어조. ${ab === "MZ" ? "외래어·축약·SNS 어휘 자연스럽게." : ab === "고령" ? "한자어와 옛 표현이 자주 섞임." : ""}`;
  } else {
    guidance = `${dialect} 사투리 자연스러운 정도(과장 X). ${ab} 세대 어휘 톤. 마커 예: ${regionalMarkers.slice(0, 3).join(", ")} 등을 답변 1~2개에 한 번 자연스럽게 섞기.`;
  }

  return {
    dialect,
    ageBand: ab,
    regionalMarkers,
    generationalVocab,
    financialVocab,
    guidance,
  };
}
