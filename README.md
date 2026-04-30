# vFGI · Virtual Focus Group Interview

> iM뱅크의 상품·서비스·정책·UX·브랜드를 **출시 전에 가상 고객에게 미리 물어보는 메타-리서치 플랫폼**

## 배경

신상품 컨셉, 광고 카피, 앱 화면 변경, 금리 정책 같은 결정은 보통 **소수의 임직원 토론 → 일부 표적집단 인터뷰(FGI) → 출시** 순으로 진행됩니다. 그러나 실제 FGI는:

- 모집·진행에 **2~4주** 소요
- 1회당 수백만 원 비용
- 대구·경북 같은 특정 지역, 워킹맘 같은 미세 세그먼트 모집이 어렵고 표본 다양성도 한계
- A/B 카피·여러 컨셉을 빠르게 비교하기 곤란

이 한계를 보완하기 위해 **합성 페르소나 기반 가상 FGI(vFGI)** 를 시뮬레이션 환경으로 구축했습니다.

## 목적

1. **사전 검증의 사이클 가속**: "5분 입력 → 2분 인터뷰 → 즉시 인사이트·PDF 보고서"
2. **세그먼트 다양성 확보**: 17개 시도 × 252개 시군구 × 19~99세 분포의 가상 고객 1,000명 풀에서 임의 패널 모집
3. **A/B·반복 실험**: 같은 자극물에 다른 패널, 같은 패널에 다른 자극물, 같은 시드로 재현 실행
4. **메타-FGI 운영체계**: 단발 데모가 아니라 다양한 자극물(컨셉·카피·UX·정책·브랜드 등 9종)을 사용자가 자연어로 정의해 vFGI 를 매번 자동 구성·실행·비교하는 시스템


---

## 페르소나 데이터셋 — 왜 이 데이터셋인가

가상 참여자는 **[NVIDIA Nemotron-Personas-Korea](https://huggingface.co/datasets/nvidia/Nemotron-Personas-Korea)** 데이터셋(CC BY 4.0)을 기반으로 생성됩니다.

### 금융 리서치에 특히 강한 이유

이 데이터셋은 **한국 금융 고객의 성향을 지역 단위로 세밀하게 진단하는 데 매우 유용**하며, 그 결과 다음 영역에서 **높은 의사결정 정확도**를 제공합니다:

- 🏦 **금융상품 개발** — 지역·연령·가구·소득군별 상품 적합도, 우대조건 수용성, 가격 민감도 측정
- 📱 **모바일 앱 사용성** — 디지털 친화도가 다른 세그먼트(시니어 1인가구, 워킹맘, 자영업 사장 등)별 UX 가설 검증
- 🏪 **채널 전략** — 영업점/콜센터/모바일/ATM의 역할 재정의, 비대면 전환 의향, 시니어·취약계층 신뢰도 영향
- 💬 **마케팅·브랜드 메시지** — 권역(대구·경북, 수도권 등)·세대별 카피 반응, 브랜드 리포지셔닝 수용성
- 📊 **정책/약관 변경** — 금리 조정, 수수료 변경 등 정책 자극에 대한 형평성 인식 및 대안 행동 추정

### 어떻게 그런 정확도가 가능한가

1. **252개 시군구 × 17개 시도 단위의 지역 세분화** — 광주 서구 자영업 70대, 구미 제조업 50대, 분당 직장인 40대 등 미시 세그먼트 구분
2. **공식 1차 통계 기반** — 통계청 KOSIS, 대법원, 국민건강보험공단, 한국농촌경제연구원의 인구·가구·소득·소비행태 분포를 그대로 반영
3. **확률적 그래프 모델(PGM)로 변수 결합분포 학습** — 단순 LLM 생성물과 달리, 인구학적 변수 간 일관성 보장(고령층 여성 비중 1.52배, 50대 후반 사별·이혼 패턴 등)
4. **다층 페르소나** — 직업·스포츠·예술·여행·음식·가족 7개 페르소나 + 6개 속성 = 한 사람당 13개 레이어로 의사결정 동인까지 추론 가능
5. **CC BY 4.0** — 상업적 활용 자유로워 금융권 내부 검증·외부 발표 모두 가능

### 데이터셋 스펙
- **규모**: 100만 레코드 × 7종 페르소나 = 700만 페르소나(17억 토큰)
- **본 프로젝트**: 그중 **1,000명 시드** 임포트 (필요 시 100k~1M 확장 가능)
- **합성 방법**: NVIDIA NeMo Data Designer + Gemma-4-31B-it + 자체 PGM
- **공개일**: 2026-04-20 (Hugging Face)

### 한계와 보완

- 18세 미만 페르소나 부재 (청소년 대상 상품 검증 시 별도 확보 필요)

---

## 핵심 기능

| 영역 | 기능 |
|---|---|
| **자극물** | 9종 지원 — 컨셉·카피·UX 화면·광고 크리에이티브·정책·브랜드·채널·앱 기능·가격 |
| **가이드 자동 생성** | 목적·연구질문·자극물 → AI가 6단계(워밍업·현행·노출·평가·가격·클로징) 인터뷰 가이드를 한국어로 생성 |
| **참여자 모집** | 시도·연령·직업·교육 필터 + 권역 쿼터 + 시드 기반 재현성. 인원 2~200명 임의 |
| **실시간 인터뷰** | 진행자/패널 다중 에이전트가 SSE 로 발언을 실시간 스트리밍 |
| **AI 심층 분석** | 발언록 전체 → 세그먼트별 인사이트, 메트릭, KILL/KEEP/CHANGE, verdict 추출 |
| **A/B 비교** | 두 실행을 메트릭 Δ·공통/고유 매력·장벽·토픽 단위로 비교 |
| **재현 실행** | 같은 시드·자극물로 재실행해 결과 안정성 확인. 이벤트 영속화 후 발언록 재생 가능 |
| **PDF 보고서** | 표지·요약·자극물·참여자·인사이트·인용구의 한국어 PDF (Pretendard 임베딩) |

---

## 기술 스택

- **Frontend**: Next.js 16 (App Router) · React 19 · Tailwind CSS 4 · Turbopack
- **Backend**: Vercel Functions (Fluid Compute) · Server Actions · SSE
- **DB / Storage**: Vercel Postgres (Neon) · Vercel Blob · Drizzle ORM
- **AI**: Vercel AI SDK v6 · Anthropic Claude (Sonnet 4.5 / Haiku 4.5) · Vercel AI Gateway 폴백
- **PDF**: @react-pdf/renderer + Pretendard 폰트
- **Deploy**: Vercel (production: vfgi.vercel.app)

---

## 로컬 개발

```bash
# 1) 의존성
npm install

# 2) Vercel 프로젝트 연결 후 환경변수 동기화
vercel link
vercel env pull .env.local
# .env.local 에 ANTHROPIC_API_KEY=sk-ant-... 추가

# 3) DB 스키마 적용 + 페르소나 1,000명 시드 (1회만)
npm run db:migrate
npm run seed:personas
npm run seed:templates

# 4) 개발 서버
npm run dev
# http://localhost:3000
```

### 주요 npm scripts
- `dev` / `build` / `start` — Next.js
- `db:generate` / `db:migrate` / `db:studio` — Drizzle
- `seed:personas` — HuggingFace datasets-server → Postgres (1,000명)
- `seed:templates` — 9종 자극물 템플릿 시드

---

## 디렉토리 구조

```
app/
  studies/                # 인터뷰 목록·생성·상세·실행·재생·비교
  personas/               # 1,000명 풀 탐색
  library/                # 9종 자극물 템플릿
  api/                    # studies / runs / personas / guide / reports / analyze
components/               # Nav, EventStream, RunRunner, AnalyzeButton
db/
  schema.ts               # 13개 테이블
  client.ts               # Drizzle + Postgres 클라이언트
  migrations/             # 자동 생성 SQL
lib/
  agents/analyst.ts       # 분석 에이전트
  orchestrator.ts         # 인터뷰 진행 오케스트레이터
  guideBuilder.ts         # 가이드 자동 생성
  personaSampler.ts       # 쿼터 샘플링 + 시드 재현
  modelRouter.ts          # 역할별 모델 라우팅
  eventStream.ts          # SSE v2 인코더/파서
  diff.ts                 # A/B 비교 메트릭
  pdf/report.tsx          # PDF 레이아웃
prompts/
  system/                 # 진행자 시스템 프롬프트
  templates/stimulus/     # 자극물 9종 베이스 템플릿
public/fonts/             # Pretendard
scripts/
  migrate.ts              # 마이그레이션 적용
  import-personas.ts      # HuggingFace → DB
  seed-templates.ts       # 템플릿 시드
```

---

## 라이선스 / 인용

- 본 코드: 내부 데모 목적
- 페르소나 데이터: [NVIDIA Nemotron-Personas-Korea](https://huggingface.co/datasets/nvidia/Nemotron-Personas-Korea) (CC BY 4.0) — 출처 명시 시 자유 사용
- 한글 폰트: Pretendard (SIL Open Font License 1.1)
