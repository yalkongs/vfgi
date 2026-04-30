// E2 — 시군구 단위 컨텍스트 사전
// KOSIS·국토부·관광공사 공개 데이터 기반의 정성적 컨텍스트.
// 페르소나 응답에 자연스럽게 박힐 수 있는 지역 디테일 (랜드마크·산업·음식·정서).

export type DistrictInfo = {
  region: "수도권" | "영남" | "호남" | "충청" | "강원제주";
  dialect: "표준" | "영남" | "호남" | "충청" | "강원" | "제주";
  landmarks: string[]; // 동네 사람이 자연스럽게 입에 올리는 장소
  industries: string[]; // 주요 산업/직업군
  notable: string[]; // 음식·시장·문화·관습
  vibe: string; // 한 줄 분위기
};

const DEFAULT_INFO: Record<string, DistrictInfo> = {
  // === 서울 ===
  "서울-강남구": {
    region: "수도권", dialect: "표준",
    landmarks: ["강남역", "테헤란로", "코엑스", "신사동 가로수길"],
    industries: ["IT 본사", "대기업", "벤처", "전문직"],
    notable: ["미슐랭 식당", "헬스 클럽", "스타벅스 리저브"],
    vibe: "고소득 직장인·전문직 중심, 디지털 친화도 높음",
  },
  "서울-마포구": {
    region: "수도권", dialect: "표준",
    landmarks: ["홍대", "합정", "망원시장", "연남동"],
    industries: ["미디어", "광고", "스타트업", "프리랜서"],
    notable: ["뉴오프닝 카페", "라이브 클럽", "맛집 SNS"],
    vibe: "30대 크리에이티브 직군·딩크 부부 다수",
  },
  "서울-송파구": {
    region: "수도권", dialect: "표준",
    landmarks: ["잠실", "롯데월드타워", "올림픽공원", "석촌호수"],
    industries: ["대기업 본사", "사무직", "교육"],
    notable: ["학원가", "키즈카페", "한강 산책로"],
    vibe: "30~40대 자녀 양육 가구·맞벌이 비중 높음",
  },
  "서울-노원구": {
    region: "수도권", dialect: "표준",
    landmarks: ["노원역", "수락산", "월계동"],
    industries: ["교사", "공무원", "사무직"],
    notable: ["학원가 (중계동)", "전세 아파트 단지"],
    vibe: "교육열 강한 중산층 가구",
  },
  // === 경기 ===
  "경기-성남시 분당구": {
    region: "수도권", dialect: "표준",
    landmarks: ["판교 테크노밸리", "정자동 카페거리", "야탑역"],
    industries: ["IT 대기업", "금융", "전문직"],
    notable: ["네이버·카카오 사옥", "분당 학원가", "아파트 단지 밀집"],
    vibe: "IT·금융 고소득 직장인, 자녀 사교육 강세",
  },
  "경기-수원시 영통구": {
    region: "수도권", dialect: "표준",
    landmarks: ["광교호수공원", "삼성디지털시티", "영통역"],
    industries: ["삼성전자", "사무직", "교육"],
    notable: ["삼성 사원 아파트", "영통 학원가"],
    vibe: "대기업 직원·맞벌이·자녀 양육",
  },
  // === 인천 ===
  "인천-연수구": {
    region: "수도권", dialect: "표준",
    landmarks: ["송도국제도시", "센트럴파크", "송도컨벤시아"],
    industries: ["바이오", "IT", "외국계"],
    notable: ["국제학교", "신축 아파트", "외국인 거주 비율"],
    vibe: "신도시 30~40대 직장인",
  },
  // === 대구 ===
  "대구-수성구": {
    region: "영남", dialect: "영남",
    landmarks: ["수성못", "범어네거리", "황금동"],
    industries: ["교육", "공기업", "전문직"],
    notable: ["수성구 학원가 (대구판 대치동)", "수성못 산책길"],
    vibe: "대구 교육 1번지, 자녀 입시 가구 다수",
  },
  "대구-달서구": {
    region: "영남", dialect: "영남",
    landmarks: ["성서", "두류공원", "이월드"],
    industries: ["제조", "유통", "서비스업"],
    notable: ["서문시장", "달서구 전통시장", "두류공원 새벽 등산"],
    vibe: "자영업·노동·중장년 가구 비중 높음",
  },
  "대구-북구": {
    region: "영남", dialect: "영남",
    landmarks: ["칠곡", "경북대학교", "복현동"],
    industries: ["대학·교육", "운수", "유통"],
    notable: ["칠곡 신도시", "경북대 인근 원룸촌"],
    vibe: "대학생·중장년 자영업 혼재",
  },
  // === 경상북 ===
  "경상북-포항시 남구": {
    region: "영남", dialect: "영남",
    landmarks: ["포스코", "영일대 해수욕장", "효자동"],
    industries: ["철강", "제조 협력사", "교육"],
    notable: ["포스코 사원아파트", "죽도시장 회"],
    vibe: "포스코 협력사·교사·맞벌이 가구",
  },
  "경상북-구미시": {
    region: "영남", dialect: "영남",
    landmarks: ["구미 산업단지", "금오산", "원평동"],
    industries: ["전자 제조 (LG·삼성 협력사)", "운수"],
    notable: ["산업단지 식당가", "공장 교대근무 문화"],
    vibe: "제조업 시니어·중장년 가장 가구",
  },
  "경상북-안동시": {
    region: "영남", dialect: "영남",
    landmarks: ["하회마을", "월영교", "안동찜닭 골목"],
    industries: ["관광", "농업", "공무원"],
    notable: ["전통 한옥", "안동소주", "찜닭"],
    vibe: "고령 인구·전통 가치 강세",
  },
  // === 부산·울산·경남 ===
  "부산-해운대구": {
    region: "영남", dialect: "영남",
    landmarks: ["해운대 해수욕장", "센텀시티", "마린시티"],
    industries: ["서비스", "금융", "관광"],
    notable: ["고급 아파트", "센텀 백화점", "광안대교"],
    vibe: "관광·서비스·외지 유입 다수",
  },
  "울산-남구": {
    region: "영남", dialect: "영남",
    landmarks: ["삼산동", "울산공항", "롯데호텔 울산"],
    industries: ["현대중공업·SK 계열", "고소득 직장인"],
    notable: ["사원 아파트", "울산 광역버스"],
    vibe: "대기업 정규직 중심 고소득층",
  },
  "경상남-창원시 의창구": {
    region: "영남", dialect: "영남",
    landmarks: ["창원광장", "성산구 공단", "용지호수공원"],
    industries: ["기계·조선 부품", "공무원"],
    notable: ["계획도시 격자 도로", "현대로템·LG"],
    vibe: "제조업 직장인·공무원 가구",
  },
  // === 호남 ===
  "광주-서구": {
    region: "호남", dialect: "호남",
    landmarks: ["치평동 카페거리", "상무지구", "5·18민주광장"],
    industries: ["금융", "유통", "의료"],
    notable: ["상무 신도심", "쌍촌동 카페거리"],
    vibe: "광주 신도심 직장인·전문직",
  },
  "전라남-순천시": {
    region: "호남", dialect: "호남",
    landmarks: ["순천만 국가정원", "조계산", "원도심"],
    industries: ["관광", "농업", "교육"],
    notable: ["순천만 갈대밭", "꼬막정식"],
    vibe: "관광 도시·중장년 토박이",
  },
  "전라북-전주시 완산구": {
    region: "호남", dialect: "호남",
    landmarks: ["전주 한옥마을", "남부시장", "객사거리"],
    industries: ["관광", "교육", "서비스"],
    notable: ["전주비빔밥", "콩나물국밥", "경기전"],
    vibe: "역사 도시·관광 종사자·소상공인",
  },
  // === 충청 ===
  "충청남-천안시 동남구": {
    region: "충청", dialect: "충청",
    landmarks: ["독립기념관", "천안종합터미널", "병천 순대거리"],
    industries: ["제조 (삼성SDI)", "물류", "교육"],
    notable: ["병천순대", "호두과자"],
    vibe: "수도권 통근권·제조업 중장년",
  },
  "대전-유성구": {
    region: "충청", dialect: "충청",
    landmarks: ["대덕연구단지", "KAIST", "유성온천"],
    industries: ["연구원·공공연구소", "IT"],
    notable: ["연구단지 카페", "유성 시장"],
    vibe: "연구원·교수·고학력 가구",
  },
  "충청북-청주시 흥덕구": {
    region: "충청", dialect: "충청",
    landmarks: ["오송", "테크노폴리스", "성안길"],
    industries: ["바이오", "반도체 (SK하이닉스)", "공무원"],
    notable: ["오송 바이오단지"],
    vibe: "바이오·반도체 직장인",
  },
  // === 강원 ===
  "강원-춘천시": {
    region: "강원제주", dialect: "강원",
    landmarks: ["남이섬", "공지천", "명동 닭갈비골목"],
    industries: ["관광", "공무원", "교육"],
    notable: ["춘천 닭갈비·막국수"],
    vibe: "관광·공무원·중장년 토박이",
  },
  // === 제주 ===
  "제주-제주시": {
    region: "강원제주", dialect: "제주",
    landmarks: ["한라산", "성산일출봉", "제주공항"],
    industries: ["관광", "농수산", "서비스"],
    notable: ["흑돼지", "갈치조림", "감귤"],
    vibe: "관광 종사자·이주민·토박이 혼재",
  },
};

const REGION_BY_PROVINCE: Record<string, DistrictInfo["region"]> = {
  서울: "수도권", 경기: "수도권", 인천: "수도권",
  대구: "영남", 부산: "영남", 울산: "영남", 경상북: "영남", 경상남: "영남", 경북: "영남", 경남: "영남",
  광주: "호남", 전라남: "호남", 전라북: "호남", 전남: "호남", 전북: "호남",
  대전: "충청", 충청남: "충청", 충청북: "충청", 충남: "충청", 충북: "충청", 세종: "충청",
  강원: "강원제주", 제주: "강원제주",
};

const DIALECT_BY_PROVINCE: Record<string, DistrictInfo["dialect"]> = {
  서울: "표준", 경기: "표준", 인천: "표준",
  대구: "영남", 부산: "영남", 울산: "영남", 경상북: "영남", 경상남: "영남", 경북: "영남", 경남: "영남",
  광주: "호남", 전라남: "호남", 전라북: "호남", 전남: "호남", 전북: "호남",
  대전: "충청", 충청남: "충청", 충청북: "충청", 충남: "충청", 충북: "충청", 세종: "충청",
  강원: "강원", 제주: "제주",
};

export function getDistrictInfo(province: string, district: string): DistrictInfo {
  const key = `${province}-${district}`;
  if (DEFAULT_INFO[key]) return DEFAULT_INFO[key];
  // fallback: province 단위 추정
  const region = REGION_BY_PROVINCE[province] ?? "수도권";
  const dialect = DIALECT_BY_PROVINCE[province] ?? "표준";
  return {
    region,
    dialect,
    landmarks: [],
    industries: [],
    notable: [],
    vibe: `${province} ${district} 거주, ${region} 권역`,
  };
}
