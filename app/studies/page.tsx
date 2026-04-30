import Link from "next/link";
import { db } from "@/db/client";
import { study } from "@/db/schema";
import { desc } from "drizzle-orm";

export const dynamic = "force-dynamic";

export default async function StudiesPage() {
  const rows = await db.select().from(study).orderBy(desc(study.createdAt)).limit(100);

  return (
    <main className="mx-auto max-w-6xl px-6 py-10 space-y-6">
      <header className="flex items-end justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">vFGI 목록</h1>
          <p className="text-sm text-zinc-500">총 {rows.length}건의 vFGI가 기록되어 있습니다</p>
        </div>
        <Link
          href="/studies/new"
          className="px-4 py-2 rounded-full bg-emerald-600 text-white text-sm font-medium"
        >
          + 새 vFGI
        </Link>
      </header>

      {rows.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-zinc-300 dark:border-zinc-700 p-10 text-center space-y-3">
          <p className="text-sm text-zinc-500">아직 진행된 vFGI가 없습니다.</p>
          <Link
            href="/studies/new"
            className="inline-block px-4 py-2 rounded-full bg-emerald-600 text-white text-sm font-medium"
          >
            첫 vFGI 만들기 →
          </Link>
        </div>
      ) : (
        <div className="grid gap-3">
          {rows.map((s) => (
            <Link
              key={s.id}
              href={`/studies/${s.id}`}
              className="block rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 px-5 py-4 hover:border-emerald-500"
            >
              <div className="flex items-center justify-between gap-3 flex-wrap">
                <div className="font-medium">{s.title}</div>
                <div className="flex items-center gap-2 text-xs">
                  <Status status={s.status} />
                  <span className="text-zinc-400">
                    {new Date(s.createdAt).toLocaleString("ko-KR")}
                  </span>
                </div>
              </div>
              <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400 line-clamp-2">
                {s.objective}
              </p>
              {s.tags && s.tags.length > 0 && (
                <div className="mt-2 flex gap-1.5 flex-wrap">
                  {s.tags.map((t) => (
                    <span
                      key={t}
                      className="px-2 py-0.5 rounded-full bg-zinc-100 dark:bg-zinc-800 text-xs"
                    >
                      {t}
                    </span>
                  ))}
                </div>
              )}
            </Link>
          ))}
        </div>
      )}
    </main>
  );
}

function Status({ status }: { status: string }) {
  const map: Record<string, string> = {
    draft: "bg-zinc-200 text-zinc-700",
    running: "bg-blue-100 text-blue-700",
    done: "bg-emerald-100 text-emerald-700",
    archived: "bg-zinc-100 text-zinc-500",
  };
  return (
    <span className={`px-2 py-0.5 rounded-full ${map[status] ?? map.draft}`}>
      {status}
    </span>
  );
}
