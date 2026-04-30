export type Persona = {
  id: string;
  name: string;
  sex: "남자" | "여자";
  age: number;
  province: string;
  district: string;
  occupation: string;
  marital_status: string;
  family_type: string;
  housing_type: string;
  education_level: string;
  income_band: string;
  financial_context: string;
  professional_persona: string;
  family_persona: string;
  culinary_persona: string;
  hobbies_and_interests: string;
  career_goals_and_ambitions: string;
  cultural_background: string;
  persona_summary: string;
};

export const PERSONAS: Persona[] = [
  {
    id: "p1",
    name: "박민철",
    sex: "남자",
    age: 34,
    province: "대구",
    district: "수성구",
    occupation: "중견 IT기업 백엔드 개발자",
    marital_status: "미혼",
    family_type: "1인가구",
    housing_type: "오피스텔(전세)",
    education_level: "대학교 졸업",
    income_band: "월 380만원대",
    financial_context:
      "주거래은행은 카카오뱅크. iM뱅크는 부모님 영향으로 비상금 통장만 있음. 토스·KB증권으로 ETF 적립식 투자. 청약통장 외 적금은 단기 6개월짜리만 굴리는 편.",
    professional_persona:
      "스타트업 출신으로 사이드 프로젝트와 코드 리뷰에 시간을 쓰는 효율 우선주의자. 새 금융상품도 앱 UX와 자동화가 마음에 들어야 가입한다.",
    family_persona:
      "결혼 계획은 아직. 부모님은 칠곡에 거주, 명절마다 내려가서 용돈 송금. 동생이 막 취업해 가끔 금융 자문을 해 준다.",
    culinary_persona:
      "동성로 카페·서면 맛집 탐방이 취미. 배달 앱 사용 빈도 높고, 캐시백 카드 혜택에 민감.",
    hobbies_and_interests:
      "주말 풋살, 닌텐도 스위치, 유튜브 IT 채널, 여행 적금으로 1년에 한 번 일본 출장 겸 여행.",
    career_goals_and_ambitions:
      "테크리드로 성장하면서 30대 후반에 수도권 진입 또는 수성구 소형 아파트 매입.",
    cultural_background:
      "대구 토박이. 사투리 잔잔하지만 회사에서는 표준어. SNS는 주로 X와 인스타.",
    persona_summary:
      "수성구 1인가구 30대 남성 개발자. 디지털 채널 우선, 우대금리·자동화·앱 UX에 민감.",
  },
  {
    id: "p2",
    name: "이정희",
    sex: "여자",
    age: 41,
    province: "경북",
    district: "포항시 남구",
    occupation: "초등학교 교사",
    marital_status: "배우자있음",
    family_type: "부부+미혼자녀(2명)",
    housing_type: "아파트(자가, 24평)",
    education_level: "교육대학원 석사",
    income_band: "맞벌이 합산 월 720만원대",
    financial_context:
      "iM뱅크 급여계좌 10년차. 자녀 교육비를 위한 적금·청약·교직원 공제회 활용. 모바일뱅킹은 사용하지만 공인인증 시절 습관이 남아 있음.",
    professional_persona:
      "꼼꼼한 학급 관리, 학부모 응대 업무 많음. 안정성·신뢰도가 최우선. 새로운 상품은 동료 추천을 거쳐 가입하는 보수적 성향.",
    family_persona:
      "초3·초5 두 자녀, 시댁은 안동. 남편은 포스코 협력사 사무직. 가계부 어플과 엑셀 병행.",
    culinary_persona:
      "주말은 가족 외식, 평일은 직접 요리. 친환경 식재료 구독.",
    hobbies_and_interests:
      "필라테스, 동네 도서관 독서모임, 자녀와 캠핑.",
    career_goals_and_ambitions:
      "10년 내 교감 진급, 두 자녀 대학 학자금 1억 이상 마련.",
    cultural_background:
      "경북 포항 거주, 안동 출신. 지역 커뮤니티 활동 활발.",
    persona_summary:
      "포항 거주 40대 초반 맞벌이 교사 엄마. iM뱅크 장기 고객, 안정성·교육비 마련이 핵심 동인.",
  },
  {
    id: "p3",
    name: "김영숙",
    sex: "여자",
    age: 56,
    province: "대구",
    district: "달서구",
    occupation: "전통시장 반찬가게 자영업자",
    marital_status: "배우자있음",
    family_type: "부부+미혼자녀(1명, 대학생)",
    housing_type: "다세대주택(자가)",
    education_level: "고등학교 졸업",
    income_band: "월 450만원대(매출 변동 큼)",
    financial_context:
      "iM뱅크 사업자 계좌 사용. 카드매출 정산이 주거래. 대출은 보증재단 통해 4천만원. 적금은 자동이체 부담돼 월 10만원 단위로 쪼개 가입.",
    professional_persona:
      "새벽 4시 시장 경매부터 저녁 정리까지 노동 강도 큼. 단골 응대가 일의 핵심. 디지털 어플은 결제·송금 정도, 새로운 가입은 직원 도움 필수.",
    family_persona:
      "남편은 화물 기사. 외동딸이 서울권 대학에 다녀 매달 학비·생활비 송금. 대학 등록금 대출 잔액 걱정.",
    culinary_persona:
      "본인이 만든 반찬과 시장 단골 노점 음식. 외식은 거의 없음.",
    hobbies_and_interests:
      "트로트 유튜브, 동네 부녀회, 가게 단골과 수다.",
    career_goals_and_ambitions:
      "딸 결혼 전에 가게 자가건물로 옮기고, 60대 중반에 점포 정리 후 노후 정착.",
    cultural_background:
      "달서구 30년 거주, 강한 경상도 사투리. 종이 통장에 대한 신뢰가 큼.",
    persona_summary:
      "대구 자영업 50대 여성 사장님. 디지털 친화도 낮음, 우대금리보다 입출금 자유로운 적금 선호.",
  },
  {
    id: "p4",
    name: "정상훈",
    sex: "남자",
    age: 49,
    province: "경기",
    district: "성남시 분당구",
    occupation: "대기업 차장(금융)",
    marital_status: "배우자있음",
    family_type: "부부+미혼자녀(2명)",
    housing_type: "아파트(자가, 34평)",
    education_level: "4년제 대학",
    income_band: "맞벌이 합산 월 1,400만원대",
    financial_context:
      "iM뱅크 미사용. 신한·하나·KB 분산. 증권 계좌 3개, 미국 ETF·국내 채권. 적금은 단기 풍차돌리기, 신상품은 출시 일주일 내 검토.",
    professional_persona:
      "금융 종사자라 상품 설계·우대조건 까다롭게 본다. 마케팅 카피보다 실효 금리·중도해지 패널티를 따짐.",
    family_persona:
      "고1 아들, 중2 딸. 분당 학원가에서 사교육비 월 200만원 이상 지출. 양가 부모 부양 부담.",
    culinary_persona:
      "와인·위스키 모임, 분당 미식 모임. 평일 점심은 회사 근처.",
    hobbies_and_interests:
      "골프, 미국 주식 차트 분석, 캠핑카 검토.",
    career_goals_and_ambitions:
      "55세 임원 도전, 대출 5년 내 상환, 자녀 유학 자금 별도.",
    cultural_background:
      "지방 출신 → 분당 정착 20년. 합리적·분석적 의사결정.",
    persona_summary:
      "수도권 40대 후반 고소득 직장인. iM뱅크 비고객, 비대면 신규 유치 타겟. 실효 금리·조건에 민감.",
  },
  {
    id: "p5",
    name: "최유나",
    sex: "여자",
    age: 32,
    province: "서울",
    district: "마포구",
    occupation: "광고 에이전시 AE",
    marital_status: "배우자있음",
    family_type: "부부(자녀 없음, 딩크 지향)",
    housing_type: "아파트(전세, 24평)",
    education_level: "4년제 대학",
    income_band: "맞벌이 합산 월 950만원대",
    financial_context:
      "토스·카카오뱅크 메인. iM뱅크는 들어본 적 정도. 청년도약계좌 만기 후 다음 적금 갈아탈 계획. SNS 후기 영향 큼.",
    professional_persona:
      "콘텐츠·캠페인 기획. 톤앤매너·브랜드 일관성에 민감. 광고 카피만 봐도 신뢰도 평가.",
    family_persona:
      "부부 모두 직장인, 반려묘 2마리. 양가는 모두 지방. 친구 모임 빈도 높음.",
    culinary_persona:
      "와인바·뉴오프닝 카페 빠른 탐방. 배민 단골.",
    hobbies_and_interests:
      "필름카메라, 러닝 크루, 인스타·뉴스레터 구독.",
    career_goals_and_ambitions:
      "프리랜서 독립 또는 부부 공동 브랜드 런칭. 5년 내 자가 매수.",
    cultural_background:
      "서울 토박이. 디지털·트렌드 민감. 모바일 경험 우선.",
    persona_summary:
      "수도권 30대 초반 딩크 부부. iM뱅크 인지도 낮음, 디지털 신뢰감·브랜드 톤이 가입 결정 변수.",
  },
  {
    id: "p6",
    name: "한경수",
    sex: "남자",
    age: 58,
    province: "경북",
    district: "구미시",
    occupation: "제조업 현장 반장",
    marital_status: "배우자있음",
    family_type: "부부+미혼자녀(1명, 군복무 중)",
    housing_type: "아파트(자가, 32평)",
    education_level: "전문대학 졸업",
    income_band: "월 530만원대(시간외수당 포함)",
    financial_context:
      "iM뱅크 급여 통장 25년. 퇴직 6~7년 남음. 정기예금·국채 중심, 적금은 자녀 결혼·부모 의료비 대비. 모바일뱅킹은 자주 쓰지만 새 가입은 영업점 직원과 상의.",
    professional_persona:
      "공장 라인 안전관리, 후배 교육 담당. 약속·신뢰 중시. 광고문구보다 직원 추천·동료 후기 우선.",
    family_persona:
      "아내는 학교 급식조리원, 아들 군복무 중. 칠순 어머니 안동 거주, 의료비 지원 중.",
    culinary_persona:
      "주말 텃밭 야채로 가족 식사. 회사 구내식당.",
    hobbies_and_interests:
      "주말 등산, 트로트, 야구(삼성 라이온즈).",
    career_goals_and_ambitions:
      "퇴직 전 노후자금 3억 확보, 자녀 결혼자금 1억.",
    cultural_background:
      "구미·안동 생활권. 평생 직장 문화, 보수적 의사결정.",
    persona_summary:
      "구미 50대 후반 제조업 시니어. iM뱅크 충성고객, 신상품엔 안정성·만기 유연성·세제혜택을 우선시.",
  },
  {
    id: "p7",
    name: "윤서아",
    sex: "여자",
    age: 38,
    province: "서울",
    district: "송파구",
    occupation: "워킹맘 (대형병원 간호사)",
    marital_status: "배우자있음",
    family_type: "부부+미혼자녀(1명, 5세)",
    housing_type: "아파트(전세, 30평)",
    education_level: "간호대학 4년제",
    income_band: "맞벌이 합산 월 1,050만원대(3교대)",
    financial_context:
      "신한 주거래, KB 청약, 토스 자녀계좌. iM뱅크 미사용. 자녀 학자금·내집마련이 양대 목표. 자동이체 의존도 매우 높음.",
    professional_persona:
      "야간 근무 잦아 시간이 가장 귀함. 모바일 완결성, 한눈에 보이는 우대조건이 결정 요소.",
    family_persona:
      "남편은 IT 회사원. 친정은 안동, 시댁은 부산. 자녀 어린이집 등하원 도움 부족.",
    culinary_persona:
      "밀키트·새벽배송 의존. 외식은 가끔.",
    hobbies_and_interests:
      "필라테스, 자녀와 키즈카페, 인스타에서 육아템 탐색.",
    career_goals_and_ambitions:
      "5년 내 자녀 영어유치원 비용 + 송파권 자가 매수 계획.",
    cultural_background:
      "안동 출신, 서울 11년차. 친정 가족과 영상통화 잦음.",
    persona_summary:
      "수도권 30대 후반 워킹맘. 시간 빈곤 + 자녀 교육비. iM뱅크는 모바일 완결성·자동화로 끌어와야 하는 타겟.",
  },
  {
    id: "p8",
    name: "장태석",
    sex: "남자",
    age: 45,
    province: "대구",
    district: "북구",
    occupation: "1톤 화물 개인사업자",
    marital_status: "이혼",
    family_type: "부+자녀(중1)",
    housing_type: "아파트(전세, 18평)",
    education_level: "고등학교 졸업",
    income_band: "월 380~520만원(변동성 큼)",
    financial_context:
      "iM뱅크 사업자·자녀 통장 보유. 운수공제·정기 적금 중도해지 경험 많음. 캐피탈 대출 잔액 1,800만원, 카드 리볼빙은 끊은 상태.",
    professional_persona:
      "현장 1인 운영. 자녀 학교·픽업 일정 맞추느라 일정 압박 큼. 중도해지 패널티가 작은 상품 선호.",
    family_persona:
      "이혼 후 자녀 양육. 친정에 자녀 자주 맡김. 자녀 사춘기 진입.",
    culinary_persona:
      "기사식당, 편의점 도시락. 자녀와는 주말에 외식.",
    hobbies_and_interests:
      "낚시, 차박, 화물 동호회.",
    career_goals_and_ambitions:
      "5년 내 부채 상환, 자녀 고등 진학 시 학원비 마련, 차량 교체.",
    cultural_background:
      "북구 토박이, 강한 사투리. 영업점 방문 익숙.",
    persona_summary:
      "대구 40대 자영업 한부모. 현금흐름 변동성·중도해지 유연성·자녀 통장 연계가 핵심 변수.",
  },
];
