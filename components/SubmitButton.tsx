"use client";

import { useFormStatus } from "react-dom";
import type { ButtonHTMLAttributes, ReactNode } from "react";

type Variant = "primary" | "accent" | "outline" | "ghost";
type Size = "sm" | "md" | "lg";

const VARIANT_CLASS: Record<Variant, string> = {
  primary: "btn-primary",
  accent: "btn-accent",
  outline: "btn-outline",
  ghost: "btn-ghost",
};

const SIZE_CLASS: Record<Size, string> = {
  sm: "btn-sm",
  md: "",
  lg: "btn-lg",
};

type SubmitButtonProps = Omit<ButtonHTMLAttributes<HTMLButtonElement>, "type" | "disabled"> & {
  variant?: Variant;
  size?: Size;
  /** 送信中に表示するラベル（省略時は「送信中…」） */
  pendingLabel?: ReactNode;
  /** 通常時のラベル */
  children: ReactNode;
  /** 外部要因で無効化したい場合（例: 入力が空） */
  disabled?: boolean;
  /** ボタンを `w-full` で広げる */
  block?: boolean;
};

/**
 * Server Action 用の送信ボタン。
 * - `useFormStatus().pending` の間は自動で `disabled` + `aria-busy` + スピナー表示。
 * - 親フォームが ToastForm/通常 form どちらでも動作する。
 */
export function SubmitButton({
  variant = "primary",
  size = "md",
  pendingLabel,
  children,
  className = "",
  disabled,
  block = false,
  ...rest
}: SubmitButtonProps) {
  const { pending } = useFormStatus();
  const isDisabled = pending || !!disabled;
  const cls = [
    VARIANT_CLASS[variant],
    SIZE_CLASS[size],
    block ? "w-full" : "",
    "inline-flex items-center justify-center gap-2",
    className,
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <button
      {...rest}
      type="submit"
      disabled={isDisabled}
      aria-busy={pending}
      aria-disabled={isDisabled}
      className={cls}
    >
      {pending ? (
        <>
          <Spinner />
          {pendingLabel ?? "送信中…"}
        </>
      ) : (
        children
      )}
    </button>
  );
}

function Spinner() {
  return (
    <svg className="h-4 w-4 animate-spin" fill="none" viewBox="0 0 24 24" aria-hidden="true">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
    </svg>
  );
}
