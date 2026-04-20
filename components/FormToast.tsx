"use client";

import { useEffect, useRef } from "react";
import { toast } from "sonner";

export type ActionState = {
  error?: string;
  success?: string;
  fieldErrors?: Record<string, string>;
} | null | undefined | void;

/**
 * Server Action の返り値 (ActionState) を監視し、
 * error/success を sonner トーストに変換するクライアントコンポーネント。
 *
 * 使い方:
 *   const [state, action] = useActionState(myAction, null);
 *   <form action={action}>
 *     <FormToast state={state} />
 *     ...
 *   </form>
 */
export function FormToast({ state }: { state: ActionState }) {
  const lastShownRef = useRef<unknown>(null);

  useEffect(() => {
    if (!state || state === lastShownRef.current) return;
    lastShownRef.current = state;
    if ("error" in state && state.error) toast.error(state.error);
    if ("success" in state && state.success) toast.success(state.success);
  }, [state]);

  return null;
}
