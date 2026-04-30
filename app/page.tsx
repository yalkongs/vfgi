import Link from "next/link";

export default function Home() {
  return (
    <main className="mx-auto max-w-5xl px-6 py-16 space-y-12">
      <header className="space-y-4">
        <p className="text-xs uppercase tracking-widest text-emerald-600">
          vFGI · Virtual Focus Group Interview · iM뱅크
        </p>
        <h1 className="text-4xl font-semibold tracking-tight">
          상품·서비스를 가상 고객에게 미리 물어보세요
        </h1>
        <p className="text-base text-zinc-600 dark:text-zinc-400 max-w-2xl leading-relaxed">
          참여자는{" "}
          <a
            href="https://huggingface.co/datasets/nvidia/Nemotron-Personas-Korea"
            target="_blank"
            rel="noopener noreferrer"
            className="underline decoration-emerald-500/60 underline-offset-2 hover:text-emerald-600"
          >
            NVIDIA Nemotron-Personas-Korea
          </a>{" "}
          데이터셋(CC BY 4.0)을 기반으로 생성된 합성 페르소나입니다. 통계청·대법원·보건공단 등
          한국 공공데이터 분포를 반영한 1,000명 풀에서 맞춤 패널을 모집해, 신상품 컨셉·광고 카피·앱
          화면·정책 변경 등을 인터뷰합니다. 5분 입력 → 1~2분 인터뷰 → 발언록·인사이트·임원 보고서까지
          자동 생성.
        </p>
      </header>

      <section className="space-y-3">
        <h2 className="text-sm font-semibold uppercase tracking-wider text-zinc-500">
          시작하는 방법 (3단계)
        </h2>
        <ol className="grid gap-3 sm:grid-cols-3">
          <Step
            n={1}
            title="무엇을 물어볼까?"
            body="신상품 컨셉, 광고 카피, 앱 화면, 정책 변경 등 9가지 자극물 중 선택하고 검증할 질문을 적습니다."
          />
          <Step
            n={2}
            title="누구에게 물어볼까?"
            body="지역·연령·직업 등 조건을 정하면 1,000명 풀에서 원하는 인원의 패널이 자동 모집됩니다."
          />
          <Step
            n={3}
            title="실시간 vFGI 보기"
            body="진행자와 패널이 실시간으로 토론합니다. 끝나면 인사이트와 PDF 보고서를 받아보세요."
          />
        </ol>
      </section>

      <section className="grid gap-4 sm:grid-cols-2">
        <Link
          href="/studies/new"
          className="group rounded-2xl border-2 border-emerald-500 p-6 bg-emerald-50/50 dark:bg-emerald-950/20 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 transition"
        >
          <div className="text-sm uppercase tracking-wider text-emerald-700 dark:text-emerald-400">
            ▶ 시작
          </div>
          <div className="mt-2 text-xl font-semibold">새 vFGI 만들기</div>
          <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
            5분 안에 자극물·참여자·질문 가이드를 만들고 vFGI를 실행합니다.
          </p>
        </Link>
        <Link
          href="/studies"
          className="group rounded-2xl border border-zinc-200 dark:border-zinc-800 p-6 bg-white dark:bg-zinc-900 hover:border-emerald-500 transition"
        >
          <div className="text-sm uppercase tracking-wider text-zinc-500">기록</div>
          <div className="mt-2 text-xl font-semibold">지난 vFGI 보기</div>
          <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
            과거 vFGI의 발언록·인사이트, 두 안의 A/B 비교, PDF 보고서 다운로드.
          </p>
        </Link>
        <Link
          href="/personas"
          className="group rounded-2xl border border-zinc-200 dark:border-zinc-800 p-6 bg-white dark:bg-zinc-900 hover:border-emerald-500 transition"
        >
          <div className="text-sm uppercase tracking-wider text-zinc-500">참고</div>
          <div className="mt-2 text-xl font-semibold">참여자 풀 (1,000명)</div>
          <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
            어떤 가상 고객들이 등록되어 있는지 둘러봅니다. 검색·필터 가능.
          </p>
        </Link>
        <Link
          href="/library"
          className="group rounded-2xl border border-zinc-200 dark:border-zinc-800 p-6 bg-white dark:bg-zinc-900 hover:border-emerald-500 transition"
        >
          <div className="text-sm uppercase tracking-wider text-zinc-500">참고</div>
          <div className="mt-2 text-xl font-semibold">9종 자극물 템플릿</div>
          <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
            컨셉·카피·앱 화면·광고·정책·브랜드·채널·기능·가격 — 검증할 자극물 종류와 표준 인터뷰 가이드.
          </p>
        </Link>
      </section>

      <footer className="text-xs text-zinc-500 pt-8 border-t border-zinc-200 dark:border-zinc-800 space-y-1">
        <p>
          ⚠ 합성 페르소나 기반 시뮬레이션입니다. 의사결정 직전 실제 정성/정량 조사로 보정해 주세요.
        </p>
        <p>
          페르소나 데이터:{" "}
          <a
            href="https://huggingface.co/datasets/nvidia/Nemotron-Personas-Korea"
            target="_blank"
            rel="noopener noreferrer"
            className="underline hover:text-zinc-700 dark:hover:text-zinc-300"
          >
            NVIDIA Nemotron-Personas-Korea (CC BY 4.0)
          </a>
        </p>
      </footer>
    </main>
  );
}

function Step({ n, title, body }: { n: number; title: string; body: string }) {
  return (
    <li className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-4">
      <div className="text-emerald-600 font-bold text-lg">STEP {n}</div>
      <div className="mt-1 font-semibold">{title}</div>
      <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">{body}</p>
    </li>
  );
}
