import type { PostVisibility } from "@/types/database";

const META: Record<PostVisibility, { icon: string; label: string; className: string; title: string }> = {
  public: {
    icon: "🌐",
    label: "公開",
    title: "未登録ユーザーも含め誰でも閲覧可",
    className: "bg-slate-50 text-slate-600 border-slate-200",
  },
  members: {
    icon: "👥",
    label: "メンバー限定",
    title: "MOAI登録ユーザーのみ閲覧可",
    className: "bg-blue-50 text-blue-700 border-blue-200",
  },
  school: {
    icon: "🎓",
    label: "School限定",
    title: "在校生・卒業生・講師のみ閲覧可",
    className: "bg-moai-primary/10 text-moai-primary border-moai-primary/30",
  },
};

/**
 * 投稿の公開レベルを示すバッジ。
 * public は一般的なのでデフォルト非表示、members/school のみ表示したい場合は `hidePublic` を true に。
 */
export function VisibilityBadge({
  visibility,
  hidePublic = false,
  compact = false,
}: {
  visibility: PostVisibility | null | undefined;
  hidePublic?: boolean;
  compact?: boolean;
}) {
  if (!visibility) return null;
  if (hidePublic && visibility === "public") return null;
  const m = META[visibility];
  return (
    <span
      title={m.title}
      className={`inline-flex items-center gap-1 text-[10px] font-medium px-1.5 py-0.5 rounded border ${m.className}`}
    >
      <span aria-hidden="true">{m.icon}</span>
      {!compact && m.label}
    </span>
  );
}
