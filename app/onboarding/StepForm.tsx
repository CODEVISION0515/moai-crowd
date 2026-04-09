"use client";

import { useActionState } from "react";
import type { ActionResult } from "./actions";

export default function StepForm({
  action,
  children,
  className = "",
}: {
  action: (prev: ActionResult, formData: FormData) => Promise<ActionResult>;
  children: React.ReactNode;
  className?: string;
}) {
  const [state, formAction, isPending] = useActionState(action, undefined);

  return (
    <form action={formAction} className={className}>
      {state?.error && (
        <div className="mb-4 rounded-xl bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
          {state.error}
        </div>
      )}
      {children}
      {isPending && (
        <div className="text-center text-sm text-slate-500 mt-2">処理中...</div>
      )}
    </form>
  );
}
