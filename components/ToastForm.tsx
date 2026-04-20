"use client";

import {
  createContext,
  useActionState,
  useContext,
  type ReactNode,
  type FormHTMLAttributes,
} from "react";
import type { ActionResult } from "@/lib/actions";
import { FormToast } from "@/components/FormToast";

type StatefulAction = (state: ActionResult, formData: FormData) => Promise<ActionResult>;

type FormStateContextValue = {
  state: ActionResult;
  fieldErrors?: Record<string, string>;
};

const FormStateContext = createContext<FormStateContextValue>({ state: null, fieldErrors: undefined });

/** 子コンポーネントからフォーム状態を参照するフック */
export function useFormState() {
  return useContext(FormStateContext);
}

/** 特定フィールドのエラーメッセージを取得 */
export function useFieldError(name: string): string | undefined {
  return useContext(FormStateContext).fieldErrors?.[name];
}

type ToastFormProps = Omit<FormHTMLAttributes<HTMLFormElement>, "action" | "children"> & {
  action: StatefulAction;
  children: ReactNode;
};

/**
 * Stateful Server Action をクライアント側でラップし、
 * error/success を自動でトースト表示するフォーム。
 *
 * Server Componentから利用可能。子のFieldError等はContextで状態にアクセス。
 */
export function ToastForm({ action, children, ...formProps }: ToastFormProps) {
  const [state, formAction] = useActionState<ActionResult, FormData>(action, null);
  const fieldErrors =
    state && typeof state === "object" && "fieldErrors" in state ? state.fieldErrors : undefined;

  return (
    <form action={formAction} {...formProps}>
      <FormToast state={state} />
      <FormStateContext.Provider value={{ state, fieldErrors }}>
        {children}
      </FormStateContext.Provider>
    </form>
  );
}
