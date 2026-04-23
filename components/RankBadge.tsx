import { RANK_META, type Rank } from "@/lib/ranks";

/**
 * ランクを小さなバッジとして表示。案件詳細の提案者欄、ユーザーカード、
 * プロフィール、ダッシュボードで使用。
 */
export function RankBadge({
  rank,
  size = "sm",
  showLabel = true,
}: {
  rank: Rank | null | undefined;
  size?: "xs" | "sm" | "md";
  showLabel?: boolean;
}) {
  if (!rank) return null;
  const meta = RANK_META[rank];
  if (!meta) return null;

  // レギュラーはバッジ非表示の選択肢もあるが、表記にあった方が段階感は出る
  const sizeClass =
    size === "xs"
      ? "text-[9px] px-1 py-[1px] gap-0.5"
      : size === "md"
        ? "text-xs px-2 py-0.5 gap-1"
        : "text-[10px] px-1.5 py-0.5 gap-0.5";

  return (
    <span
      className={`inline-flex items-center rounded-full border font-semibold ${meta.badgeClass} ${sizeClass}`}
      title={`${meta.label}: ${meta.description}`}
      aria-label={`ランク: ${meta.label}`}
    >
      <span aria-hidden="true">{meta.icon}</span>
      {showLabel && <span>{meta.label}</span>}
    </span>
  );
}
