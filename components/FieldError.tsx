"use client";
import { useFieldError } from "@/components/ToastForm";

/**
 * フォーム項目のエラーメッセージ表示。
 * ToastForm配下で使う場合は name だけでOK（Contextから取得）。
 * ToastForm配下以外で使う場合は errors を明示的に渡す。
 */
export function FieldError({
  name,
  errors,
}: {
  name: string;
  errors?: Record<string, string>;
}) {
  const ctxMsg = useFieldError(name);
  const msg = errors?.[name] ?? ctxMsg;
  if (!msg) return null;
  return (
    <p id={`${name}-error`} className="mt-1 text-xs text-red-600" role="alert">
      {msg}
    </p>
  );
}
