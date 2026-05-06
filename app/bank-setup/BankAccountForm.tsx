"use client";

import { useActionState } from "react";
import { saveBankAccount, type BankFormState } from "./actions";
import { FieldError } from "@/components/FieldError";
import { FormToast } from "@/components/FormToast";
import { SubmitButton } from "@/components/SubmitButton";

type Initial = {
  bank_name: string | null;
  bank_branch_name: string | null;
  bank_branch_code: string | null;
  bank_account_type: string | null;
  bank_account_number: string | null;
  bank_account_holder: string | null;
};

export default function BankAccountForm({ initial }: { initial: Initial }) {
  const [state, action] = useActionState<BankFormState, FormData>(saveBankAccount, null);
  const errors = state?.fieldErrors;

  return (
    <form action={action} className="card space-y-5" noValidate>
      <FormToast state={state} />

      <div>
        <label htmlFor="bank_name" className="label">
          銀行名 <span className="text-red-500">*</span>
        </label>
        <input
          id="bank_name"
          name="bank_name"
          required
          defaultValue={initial.bank_name ?? ""}
          placeholder="例: みずほ銀行 / ゆうちょ銀行 / 沖縄銀行"
          className={`input ${errors?.bank_name ? "input-error" : ""}`}
          aria-invalid={errors?.bank_name ? "true" : undefined}
        />
        <FieldError errors={errors} name="bank_name" />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-[1fr_8rem] gap-3">
        <div>
          <label htmlFor="bank_branch_name" className="label">
            支店名 <span className="text-red-500">*</span>
          </label>
          <input
            id="bank_branch_name"
            name="bank_branch_name"
            required
            defaultValue={initial.bank_branch_name ?? ""}
            placeholder="例: 那覇支店"
            className={`input ${errors?.bank_branch_name ? "input-error" : ""}`}
            aria-invalid={errors?.bank_branch_name ? "true" : undefined}
          />
          <FieldError errors={errors} name="bank_branch_name" />
        </div>
        <div>
          <label htmlFor="bank_branch_code" className="label">支店コード</label>
          <input
            id="bank_branch_code"
            name="bank_branch_code"
            inputMode="numeric"
            pattern="\d{3}"
            maxLength={3}
            defaultValue={initial.bank_branch_code ?? ""}
            placeholder="251"
            className={`input ${errors?.bank_branch_code ? "input-error" : ""}`}
            aria-invalid={errors?.bank_branch_code ? "true" : undefined}
          />
          <FieldError errors={errors} name="bank_branch_code" />
        </div>
      </div>

      <div>
        <label htmlFor="bank_account_type" className="label">
          口座種別 <span className="text-red-500">*</span>
        </label>
        <select
          id="bank_account_type"
          name="bank_account_type"
          required
          defaultValue={initial.bank_account_type ?? "ordinary"}
          className={`input ${errors?.bank_account_type ? "input-error" : ""}`}
        >
          <option value="ordinary">普通</option>
          <option value="checking">当座</option>
          <option value="savings">貯蓄</option>
        </select>
        <FieldError errors={errors} name="bank_account_type" />
      </div>

      <div>
        <label htmlFor="bank_account_number" className="label">
          口座番号 <span className="text-red-500">*</span>
        </label>
        <input
          id="bank_account_number"
          name="bank_account_number"
          required
          inputMode="numeric"
          pattern="\d{4,8}"
          maxLength={8}
          defaultValue={initial.bank_account_number ?? ""}
          placeholder="1234567"
          className={`input ${errors?.bank_account_number ? "input-error" : ""}`}
          aria-invalid={errors?.bank_account_number ? "true" : undefined}
        />
        <p className="form-hint">半角数字 4〜8桁。ゆうちょ銀行は記号・番号を統一フォーマットで入力（参考: 一般金融機関用の店番＋口座番号）</p>
        <FieldError errors={errors} name="bank_account_number" />
      </div>

      <div>
        <label htmlFor="bank_account_holder" className="label">
          口座名義 (カタカナ) <span className="text-red-500">*</span>
        </label>
        <input
          id="bank_account_holder"
          name="bank_account_holder"
          required
          defaultValue={initial.bank_account_holder ?? ""}
          placeholder="ヤマダ タロウ"
          className={`input ${errors?.bank_account_holder ? "input-error" : ""}`}
          aria-invalid={errors?.bank_account_holder ? "true" : undefined}
        />
        <p className="form-hint">通帳・キャッシュカード記載通りに、半角または全角カタカナで入力してください</p>
        <FieldError errors={errors} name="bank_account_holder" />
      </div>

      <SubmitButton block pendingLabel="保存中…">
        {initial.bank_name ? "口座情報を更新する" : "口座情報を登録する"}
      </SubmitButton>
    </form>
  );
}
