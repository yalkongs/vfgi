import Link from "next/link";

export default function Nav() {
  return (
    <nav className="border-b border-zinc-200 dark:border-zinc-800 bg-white/80 dark:bg-zinc-950/80 backdrop-blur sticky top-0 z-10">
      <div className="mx-auto max-w-6xl px-6 py-3 flex items-center gap-6">
        <Link href="/" className="font-semibold tracking-tight">
          vFGI <span className="text-zinc-400 font-normal">· iM뱅크</span>
        </Link>
        <div className="flex gap-4 text-sm text-zinc-600 dark:text-zinc-300">
          <Link href="/studies/new" className="hover:text-zinc-900 dark:hover:text-zinc-100">
            새 vFGI
          </Link>
          <Link href="/studies" className="hover:text-zinc-900 dark:hover:text-zinc-100">
            vFGI 목록
          </Link>
          <Link href="/personas" className="hover:text-zinc-900 dark:hover:text-zinc-100">
            참여자 풀
          </Link>
          <Link href="/library" className="hover:text-zinc-900 dark:hover:text-zinc-100">
            템플릿
          </Link>
        </div>
        <Link
          href="/studies/new"
          className="ml-auto px-3 py-1.5 rounded-full bg-emerald-600 text-white text-xs font-medium hover:bg-emerald-700"
        >
          + 새 vFGI
        </Link>
      </div>
    </nav>
  );
}
