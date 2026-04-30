import { db } from "@/db/client";
import { templateStimulus } from "@/db/schema";
import { asc } from "drizzle-orm";

export const dynamic = "force-dynamic";

export default async function LibraryPage() {
  const rows = await db
    .select()
    .from(templateStimulus)
    .orderBy(asc(templateStimulus.kind));

  return (
    <main className="mx-auto max-w-5xl px-6 py-10 space-y-6">
      <header>
        <h1 className="text-2xl font-semibold tracking-tight">자극물 템플릿 (9종)</h1>
        <p className="text-sm text-zinc-500">
          무엇을 검증할 수 있는지 9종류로 정리해 두었습니다. 새 인터뷰를 만들 때 AI가 이 템플릿을 시작점으로 질문 가이드를 생성합니다.
        </p>
      </header>
      <div className="grid gap-3 sm:grid-cols-2">
        {rows.map((t) => (
          <article
            key={t.id}
            className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-4"
          >
            <div className="flex items-center justify-between">
              <h2 className="font-medium">{t.title}</h2>
              <span className="text-xs px-2 py-0.5 rounded-full bg-zinc-100 dark:bg-zinc-800">
                {t.kind}
              </span>
            </div>
            <pre className="mt-3 text-xs whitespace-pre-wrap text-zinc-600 dark:text-zinc-400 max-h-60 overflow-y-auto">
              {t.body}
            </pre>
          </article>
        ))}
      </div>
    </main>
  );
}
