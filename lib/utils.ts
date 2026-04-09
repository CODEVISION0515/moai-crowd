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
