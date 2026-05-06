"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export type BankFormState = {
  error?: string;
  success?: string;
  fieldErrors?: Record<string, string>;
} | null;

const ACCOUNT_TYPES = ["ordinary", "checking", "savings"] as const;

export async function saveBankAccount(
  _prev: BankFormState,
  formData: FormData,
): Promise<BankFormState> {
  const sb = await createClient();
  const { data: { user } } = await sb.auth.getUser();
  if (!user) return { error: "ログインが必要です" };

  const bank_name = String(formData.get("bank_name") ?? "").trim();
  const bank_branch_name = String(formData.get("bank_branch_name") ?? "").trim();
  const bank_branch_code = String(formData.get("bank_branch_code") ?? "").trim();
  const bank_account_type = String(formData.get("bank_account_type") ?? "").trim();
  const bank_account_number = String(formData.get("bank_account_number") ?? "").trim();
  const bank_account_holder = String(formData.get("bank_account_holder") ?? "").trim();

  const fieldErrors: Record<string, string> = {};
  if (!bank_name) fieldErrors.bank_name = "銀行名は必須です";
  if (!bank_branch_name) fieldErrors.bank_branch_name = "支店名は必須です";
  if (bank_branch_code && !/^\d{3}$/.test(bank_branch_code)) {
    fieldErrors.bank_branch_code = "支店コードは半角数字3桁で入力してください";
  }
  if (!ACCOUNT_TYPES.includes(bank_account_type as typeof ACCOUNT_TYPES[number])) {
    fieldErrors.bank_account_type = "口座種別を選択してください";
  }
  if (!bank_account_number) {
    fieldErrors.bank_account_number = "口座番号は必須です";
  } else if (!/^\d{4,8}$/.test(bank_account_number)) {
    fieldErrors.bank_account_number = "口座番号は半角数字4〜8桁で入力してください";
  }
  if (!bank_account_holder) {
    fieldErrors.bank_account_holder = "口座名義は必須です";
  } else if (!/^[ァ-ヶー\s　A-Z0-9.\-()（）]+$/.test(bank_account_holder)) {
    fieldErrors.bank_account_holder = "口座名義は半角/全角カタカナで入力してください（例: ヤマダ タロウ）";
  }

  if (Object.keys(fieldErrors).length > 0) {
    return { error: "入力内容を確認してください", fieldErrors };
  }

  const { error } = await sb
    .from("profiles")
    .update({
      bank_name,
      bank_branch_name,
      bank_branch_code: bank_branch_code || null,
      bank_account_type,
      bank_account_number,
      bank_account_holder,
      bank_registered_at: new Date().toISOString(),
    })
    .eq("id", user.id);

  if (error) {
    console.error("[saveBankAccount] supabase update error:", error);
    return { error: `保存に失敗しました: ${error.message}` };
  }

  revalidatePath("/bank-setup");
  revalidatePath("/dashboard");
  redirect("/bank-setup?saved=1");
}
