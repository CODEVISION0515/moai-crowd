import { ToastForm } from "@/components/ToastForm";
import { FieldError } from "@/components/FieldError";
import { FieldInput } from "@/components/Field";
import { createInvoice } from "./actions";

export default function NewInvoicePage() {
  return (
    <div className="mx-auto max-w-xl px-4 py-10">
      <h1 className="text-2xl font-bold mb-6">請求書を発行</h1>
      <ToastForm action={createInvoice} className="card space-y-4" noValidate>
        <div>
          <label htmlFor="recipient_handle" className="label">
            宛先ユーザー (ハンドル) <span className="text-red-500">*</span>
          </label>
          <FieldInput id="recipient_handle" name="recipient_handle" required placeholder="user_xxx" />
          <FieldError name="recipient_handle" />
        </div>
        <div>
          <label htmlFor="subject" className="label">
            件名 <span className="text-red-500">*</span>
          </label>
          <FieldInput id="subject" name="subject" required maxLength={200} placeholder="例: LP制作費用" />
          <FieldError name="subject" />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label htmlFor="amount" className="label">
              金額 (税抜) <span className="text-red-500">*</span>
            </label>
            <FieldInput id="amount" name="amount" type="number" required min="1" />
            <FieldError name="amount" />
          </div>
          <div>
            <label htmlFor="tax_rate" className="label">消費税率 (%)</label>
            <input id="tax_rate" name="tax_rate" type="number" defaultValue="10" className="input" />
          </div>
        </div>
        <div>
          <label htmlFor="due_date" className="label">支払期日</label>
          <input id="due_date" name="due_date" type="date" className="input" />
        </div>
        <div>
          <label htmlFor="notes" className="label">備考</label>
          <textarea id="notes" name="notes" rows={3} className="input" />
        </div>
        <button className="btn-primary w-full">発行する</button>
      </ToastForm>
    </div>
  );
}
