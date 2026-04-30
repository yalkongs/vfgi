# vFGI · Virtual Focus Group Interview

> iM뱅크의 상품·서비스·정책·UX·브랜드를 **출시 전에 가상 고객에게 미리 물어보는 메타-리서치 플랫폼**

라이브: **[https://vfgi.vercel.app](https://vfgi.vercel.app)**

---

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

> ⚠️ 본 시스템은 **합성 시뮬레이션**입니다. 결정 직전 실제 정성·정량 조사로 보정한 후 활용하시기 바랍니다.

---

## 페르소나 출처

가상 참여자는 **[NVIDIA Nemotron-Personas-Korea](https://huggingface.co/datasets/nvidia/Nemotron-Personas-Korea)** 데이터셋(CC BY 4.0)을 기반으로 생성되었습니다.

- 통계청 KOSIS, 대법원, 국민건강보험공단, 한국농촌경제연구원 등 **한국 공공데이터 분포**를 반영
- NVIDIA NeMo Data Designer + Gemma-4-31B-it + 확률적 그래프 모델로 합성
- 한국 인구 100만 레코드 × 7종 페르소나 = 700만 페르소나(17억 토큰) 중 **본 프로젝트는 1,000명 시드**

본 결과는 합성 페르소나의 응답이며 **실재 인물의 응답이 아닙니다**.

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
