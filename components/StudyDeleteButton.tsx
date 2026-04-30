"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function StudyDeleteButton({
  studyId,
  studyTitle,
}: {
  studyId: string;
  studyTitle: string;
}) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  async function handleDelete(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    if (busy) return;
    const confirmed = window.confirm(
      `정말 삭제하시겠어요?\n\n"${studyTitle}"\n\n관련 자극물·가이드·실행 기록·발언록·인사이트가 모두 함께 삭제됩니다. 되돌릴 수 없습니다.`
    );
    if (!confirmed) return;
    setBusy(true);
    try {
      const res = await fetch(`/api/studies?id=${encodeURIComponent(studyId)}`, {
        method: "DELETE",
      });
      if (!res.ok) {
        const t = await res.text().catch(() => "");
        alert(`삭제 실패: ${res.status} ${t}`);
        setBusy(false);
        return;
      }
      router.refresh();
    } catch (err) {
      alert(`삭제 실패: ${(err as Error).message}`);
      setBusy(false);
    }
  }

  return (
    <button
      type="button"
      onClick={handleDelete}
      disabled={busy}
      title="이 vFGI 삭제"
      aria-label="이 vFGI 삭제"
      className="text-xs text-zinc-400 hover:text-rose-600 disabled:opacity-30 px-2 py-1 rounded-full hover:bg-rose-50 dark:hover:bg-rose-950/30"
    >
      {busy ? "삭제 중…" : "삭제"}
    </button>
  );
}
