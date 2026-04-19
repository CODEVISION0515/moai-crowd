"use client";

import { useActionState, type ReactNode, type FormHTMLAttributes } from "react";
import type { ActionResult } from "@/lib/actions";
import { FormToast } from "@/components/FormToast";

type StatefulAction = (state: ActionResult, formData: FormData) => Promise<ActionResult>;

type ToastFormProps = Omit<FormHTMLAttributes<HTMLFormElement>, "action" | "children"> & {
  action: StatefulAction;
  children: ReactNode | ((ctx: { state: ActionResult; fieldErrors?: Record<string, string> }) => ReactNode);
};

/**
 * Stateful Server Action をクライアント側でラップし、
 * error/success を自動でトースト表示するフォーム。
 *
 * children は通常の JSX か、state を受け取るレンダー関数を渡せる。
 */
export function ToastForm({ action, children, ...formProps }: ToastFormProps) {
  const [state, formAction] = useActionState<ActionResult, FormData>(action, null);
  const fieldErrors =
    state && typeof state === "object" && "fieldErrors" in state ? state.fieldErrors : undefined;

  return (
    <form action={formAction} {...formProps}>
      <FormToast state={state} />
      {typeof children === "function" ? children({ state, fieldErrors }) : children}
    </form>
  );
}
