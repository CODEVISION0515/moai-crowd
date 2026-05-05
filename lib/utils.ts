import { formatDistanceToNow } from "date-fns";
import { ja } from "date-fns/locale";

/** 日本語ローカルの日時フォーマット */
export function formatDateJP(dateStr: string): string {
  return new Date(dateStr).toLocaleString("ja-JP");
}

/** 短い日付 (4/9 14:30) */
export function formatDateShort(dateStr: string): string {
  return new Date(dateStr).toLocaleString("ja-JP", {
    month: "numeric",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

/** 相対時間 (3時間前) */
export function formatRelativeTime(dateStr: string): string {
  return formatDistanceToNow(new Date(dateStr), { addSuffix: true, locale: ja });
}

/** 通貨フォーマット: ¥1,000 */
export function formatCurrency(amount: number | null | undefined): string {
  if (amount == null) return "-";
  return `¥${amount.toLocaleString()}`;
}

/** 時刻のみ (14:30) */
export function formatTime(dateStr: string): string {
  return new Date(dateStr).toLocaleTimeString("ja-JP", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

// ── 契約ステータス ──────────────────────────────
// DB 上の `contracts.status` が取りうる値。
// 紛争 (disputed) と キャンセル (canceled) は分岐ルート。
export type ContractStatus =
  | "negotiating"
  | "funded"
  | "working"
  | "submitted"
  | "released"
  | "disputed"
  | "canceled";

/** 日本語のステータス表示名 */
export function contractStatusLabel(status: string): string {
  switch (status as ContractStatus) {
    case "negotiating":
      return "交渉中";
    case "funded":
      return "入金待ち";
    case "working":
      return "作業中";
    case "submitted":
      return "提出済み";
    case "released":
      return "支払い完了";
    case "disputed":
      return "紛争中";
    case "canceled":
      return "キャンセル";
    default:
      return status;
  }
}

/** ステータスバッジに当てる Tailwind クラス */
export function contractStatusColor(status: string): string {
  switch (status as ContractStatus) {
    case "negotiating":
      return "bg-slate-100 text-slate-700 border-slate-200";
    case "funded":
      return "bg-amber-50 text-amber-700 border-amber-200";
    case "working":
      return "bg-blue-50 text-blue-700 border-blue-200";
    case "submitted":
      return "bg-indigo-50 text-indigo-700 border-indigo-200";
    case "released":
      return "bg-emerald-50 text-emerald-700 border-emerald-200";
    case "disputed":
      return "bg-red-50 text-red-700 border-red-200";
    case "canceled":
      return "bg-slate-100 text-slate-500 border-slate-200";
    default:
      return "bg-slate-100 text-slate-700 border-slate-200";
  }
}

/**
 * 5 ステップの進捗。0=入金前, 1=入金済み, 2=作業中, 3=提出, 4=支払い完了。
 * disputed/canceled は -1（ステッパー外）。
 */
export function contractStatusStep(status: string, fundedAt: string | null): number {
  switch (status as ContractStatus) {
    case "negotiating":
      return 0;
    case "funded":
      return fundedAt ? 1 : 0;
    case "working":
      return 2;
    case "submitted":
      return 3;
    case "released":
      return 4;
    case "disputed":
    case "canceled":
      return -1;
    default:
      return 0;
  }
}
