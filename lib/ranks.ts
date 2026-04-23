/**
 * ランク定数・ヘルパー
 * DB関数 compute_rank() のTSミラー。UIで「次のランクまであと…」計算に使用。
 */

export type Rank = "regular" | "bronze" | "silver" | "gold" | "platinum";

export const RANKS: Rank[] = ["regular", "bronze", "silver", "gold", "platinum"];

export const RANK_META: Record<
  Rank,
  {
    label: string;
    shortLabel: string;
    icon: string;
    color: string; // Tailwindのtext/border/bg組み合わせ
    badgeClass: string;
    description: string;
  }
> = {
  regular: {
    label: "レギュラー",
    shortLabel: "R",
    icon: "🌱",
    color: "text-slate-600",
    badgeClass: "bg-slate-100 text-slate-700 border-slate-200",
    description: "まずはプロフィール完成を目指そう",
  },
  bronze: {
    label: "ブロンズ",
    shortLabel: "B",
    icon: "🥉",
    color: "text-amber-700",
    badgeClass: "bg-amber-50 text-amber-800 border-amber-200",
    description: "プロフィール完成。実績を積もう",
  },
  silver: {
    label: "シルバー",
    shortLabel: "S",
    icon: "🥈",
    color: "text-slate-500",
    badgeClass: "bg-slate-50 text-slate-700 border-slate-300",
    description: "信頼できる受注者として認知",
  },
  gold: {
    label: "ゴールド",
    shortLabel: "G",
    icon: "🥇",
    color: "text-yellow-700",
    badgeClass: "bg-yellow-50 text-yellow-800 border-yellow-300",
    description: "トップクラスの受注者",
  },
  platinum: {
    label: "プラチナ",
    shortLabel: "P",
    icon: "💎",
    color: "text-cyan-700",
    badgeClass: "bg-gradient-to-br from-cyan-50 to-indigo-50 text-cyan-800 border-cyan-300",
    description: "エリート級の受注者",
  },
};

/** 次のランク（platinum の次は null） */
export function nextRank(current: Rank): Rank | null {
  const idx = RANKS.indexOf(current);
  if (idx < 0 || idx >= RANKS.length - 1) return null;
  return RANKS[idx + 1];
}

/** 昇格条件の素記述 */
export const RANK_REQUIREMENTS: Record<
  Exclude<Rank, "regular">,
  { profile: number; ratings: number; avg: number }
> = {
  bronze: { profile: 80, ratings: 0, avg: 0 },
  silver: { profile: 80, ratings: 3, avg: 4.0 },
  gold: { profile: 80, ratings: 10, avg: 4.5 },
  platinum: { profile: 80, ratings: 30, avg: 4.8 },
};

/** 次のランクまでの進捗率（0-100）と残り要件を返す */
export function progressToNextRank(
  current: Rank,
  stats: { profile_completion: number; rating_count: number; rating_avg: number },
): {
  next: Rank | null;
  progress: number; // 0..100
  missing: Array<{ label: string; current: number | string; required: number | string }>;
} {
  const nxt = nextRank(current);
  if (!nxt || nxt === "regular") return { next: null, progress: 100, missing: [] };

  const req = RANK_REQUIREMENTS[nxt as Exclude<Rank, "regular">];
  const missing: Array<{ label: string; current: number | string; required: number | string }> = [];

  let completed = 0;
  let total = 0;

  if (req.profile > 0) {
    total += 1;
    if (stats.profile_completion >= req.profile) completed += 1;
    else
      missing.push({
        label: "プロフィール完成度",
        current: `${stats.profile_completion}%`,
        required: `${req.profile}%`,
      });
  }
  if (req.ratings > 0) {
    total += 1;
    if (stats.rating_count >= req.ratings) completed += 1;
    else
      missing.push({ label: "評価数", current: stats.rating_count, required: req.ratings });
  }
  if (req.avg > 0) {
    total += 1;
    if (stats.rating_avg >= req.avg) completed += 1;
    else
      missing.push({
        label: "平均評価",
        current: stats.rating_avg.toFixed(1),
        required: req.avg.toFixed(1),
      });
  }

  const progress = total === 0 ? 100 : Math.round((completed / total) * 100);
  return { next: nxt, progress, missing };
}
