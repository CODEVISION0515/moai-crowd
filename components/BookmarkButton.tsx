"use client";

import { useTransition } from "react";
import { toggleBookmark } from "@/app/jobs/actions";

export default function BookmarkButton({
  jobId,
  isBookmarked,
}: {
  jobId: string;
  isBookmarked: boolean;
}) {
  const [isPending, startTransition] = useTransition();

  function handleClick(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    startTransition(() => {
      toggleBookmark(jobId);
    });
  }

  return (
    <button
      onClick={handleClick}
      disabled={isPending}
      className="p-1.5 rounded-lg hover:bg-slate-100 transition text-lg"
      title={isBookmarked ? "ブックマーク解除" : "ブックマークに追加"}
    >
      {isBookmarked ? "❤️" : "🤍"}
    </button>
  );
}
