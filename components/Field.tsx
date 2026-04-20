"use client";
import { type InputHTMLAttributes, type TextareaHTMLAttributes } from "react";
import { useFieldError } from "@/components/ToastForm";

/**
 * エラー時に input-error スタイル / aria-invalid を自動付与する input。
 * ToastForm配下で使う前提。name は必須。
 */
export function FieldInput(props: InputHTMLAttributes<HTMLInputElement> & { name: string }) {
  const err = useFieldError(props.name);
  const { className = "input", ...rest } = props;
  return (
    <input
      {...rest}
      className={`${className} ${err ? "input-error" : ""}`}
      aria-invalid={err ? "true" : undefined}
      aria-describedby={err ? `${props.name}-error` : rest["aria-describedby"]}
    />
  );
}

export function FieldTextarea(props: TextareaHTMLAttributes<HTMLTextAreaElement> & { name: string }) {
  const err = useFieldError(props.name);
  const { className = "input", ...rest } = props;
  return (
    <textarea
      {...rest}
      className={`${className} ${err ? "input-error" : ""}`}
      aria-invalid={err ? "true" : undefined}
      aria-describedby={err ? `${props.name}-error` : rest["aria-describedby"]}
    />
  );
}
