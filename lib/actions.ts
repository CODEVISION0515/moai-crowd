import { z } from "zod";
import type { User } from "@supabase/supabase-js";
import { requireUser } from "@/lib/auth";
import { parseFormData } from "@/lib/validations";

type Sb = Awaited<ReturnType<typeof requireUser>>["sb"];

export type ActionResult =
  | {
      error?: string;
      success?: string;
      fieldErrors?: Record<string, string>;
    }
  | null
  | void;

export type FormActionContext<T> = {
  sb: Sb;
  user: User;
  data: T;
};

/**
 * Server Action 共通ラッパー: requireUser → parseFormData → handler。
 * パース失敗時は何も返さず終了 (既存の挙動と同じ)。
 */
export function formAction<S extends z.ZodType<unknown, z.ZodTypeDef, unknown>, R>(
  schema: S,
  handler: (ctx: FormActionContext<z.infer<S>>) => Promise<R>,
) {
  return async (formData: FormData): Promise<R | void> => {
    const { sb, user } = await requireUser();
    const parsed = parseFormData(schema, formData);
    if (!parsed.success) return;
    return handler({ sb, user, data: parsed.data as z.infer<S> });
  };
}

/**
 * useActionState 用の Stateful 版。パース失敗時は { error } を返す。
 */
export function statefulFormAction<S extends z.ZodType<unknown, z.ZodTypeDef, unknown>>(
  schema: S,
  handler: (ctx: FormActionContext<z.infer<S>>) => Promise<ActionResult>,
) {
  return async (_prev: ActionResult, formData: FormData): Promise<ActionResult> => {
    const { sb, user } = await requireUser();
    const parsed = parseFormData(schema, formData);
    if (!parsed.success) {
      return { error: parsed.error, fieldErrors: parsed.fieldErrors };
    }
    return handler({ sb, user, data: parsed.data as z.infer<S> });
  };
}
