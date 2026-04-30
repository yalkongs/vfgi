import { db } from "@/db/client";
import { persona } from "@/db/schema";
import { sql } from "drizzle-orm";

export const dynamic = "force-dynamic";

export default async function PersonasPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; province?: string; limit?: string }>;
}) {
  const sp = await searchParams;
  const q = sp.q?.trim() ?? "";
  const province = sp.province?.trim() ?? "";
  const limit = Math.min(Number(sp.limit ?? "60"), 200);

  const filters: ReturnType<typeof sql>[] = [];
  if (q) filters.push(sql`(${persona.occupation} ILIKE ${"%" + q + "%"} OR ${persona.name} ILIKE ${"%" + q + "%"})`);
  if (province) filters.push(sql`${persona.province} = ${province}`);

  const rows = await db
    .select()
    .from(persona)
    .where(filters.length > 0 ? sql`${sql.join(filters, sql` AND `)}` : undefined)
    .orderBy(sql`random()`)
    .limit(limit);

  const stats = await db
    .select({
      province: persona.province,
      cnt: sql<number>`count(*)::int`,
    })
    .from(persona)
    .groupBy(persona.province)
    .orderBy(sql`count(*) desc`);

  return (
    <main className="mx-auto max-w-6xl px-6 py-10 space-y-6">
      <header className="space-y-2">
        <h1 className="text-2xl font-semibold tracking-tight">참여자 풀 · vFGI</h1>
        <p className="text-sm text-zinc-600 dark:text-zinc-400">
          본 풀의 가상 고객 1,000명은{" "}
          <a
            href="https://huggingface.co/datasets/nvidia/Nemotron-Personas-Korea"
            target="_blank"
            rel="noopener noreferrer"
            className="underline decoration-emerald-500/60 underline-offset-2 hover:text-emerald-600"
          >
            NVIDIA Nemotron-Personas-Korea
          </a>{" "}
          데이터셋(CC BY 4.0)을 기반으로 생성되었습니다. 통계청 KOSIS·대법원·국민건강보험공단·농촌경제연구원
          등 한국 공공데이터 분포를 반영한 합성 페르소나이며, 실재 인물이 아닙니다. 인터뷰 시 조건에 맞춰
          자동 모집됩니다.
        </p>
      </header>

      <form className="flex gap-2 flex-wrap items-center" method="get">
        <input
          name="q"
          defaultValue={q}
          placeholder="직업·이름 검색"
          className="rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 px-3 py-2 text-sm w-64"
        />
        <select
          name="province"
          defaultValue={province}
          className="rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 px-3 py-2 text-sm"
        >
          <option value="">전체 시도</option>
          {stats.map((s) => (
            <option key={s.province} value={s.province}>
              {s.province} ({s.cnt})
            </option>
          ))}
        </select>
        <button
          type="submit"
          className="px-4 py-2 rounded-full bg-zinc-900 text-white dark:bg-white dark:text-zinc-900 text-sm"
        >
          필터
        </button>
      </form>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {rows.map((p) => (
          <div
            key={p.id}
            className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-4 text-sm"
          >
            <div className="flex items-center justify-between">
              <span className="font-medium">{p.name}</span>
              <span className="text-xs text-zinc-500">
                {p.sex} {p.age}세
              </span>
            </div>
            <div className="mt-1 text-xs text-zinc-600 dark:text-zinc-400">
              {p.province} {p.district} · {p.occupation}
            </div>
            <div className="mt-2 text-xs text-zinc-500 line-clamp-3">
              {((p.fields as Record<string, unknown>)?.persona as string) ?? ""}
            </div>
          </div>
        ))}
      </div>

      <p className="text-xs text-zinc-500">
        결과 {rows.length}명 표시. 더 많은 필터(연령·학력·가구 등)는 NewStudy 마법사 3단계에서 사용합니다.
      </p>
    </main>
  );
}
