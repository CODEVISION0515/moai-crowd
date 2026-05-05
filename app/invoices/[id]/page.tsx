import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { formatCurrency } from "@/lib/utils";
import PrintButton from "./PrintButton";

export const dynamic = "force-dynamic";

const INVOICE_STATUS: Record<string, { label: string; className: string }> = {
  draft: { label: "下書き", className: "bg-slate-100 text-slate-700 border-slate-200" },
  sent: { label: "送付済み", className: "bg-blue-50 text-blue-700 border-blue-200" },
  paid: { label: "✓ 入金済み", className: "bg-emerald-50 text-emerald-700 border-emerald-200" },
  overdue: { label: "期限超過", className: "bg-red-50 text-red-700 border-red-200" },
  canceled: { label: "キャンセル", className: "bg-slate-100 text-slate-500 border-slate-200" },
};

export default async function InvoiceDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const sb = await createClient();
  const { data: { user } } = await sb.auth.getUser();
  if (!user) redirect(`/login?redirect=/invoices/${id}`);

  const { data: inv } = await sb
    .from("invoices")
    .select(
      "*, issuer:issuer_id(handle, display_name, invoice_name, invoice_address, invoice_registration_number), recipient:recipient_id(handle, display_name, invoice_name, invoice_address)",
    )
    .eq("id", id)
    .single();
  if (!inv) notFound();

  // 当事者以外はアクセス不可
  if (inv.issuer_id !== user.id && inv.recipient_id !== user.id) {
    notFound();
  }

  const { data: items } = await sb
    .from("invoice_items")
    .select("*")
    .eq("invoice_id", id)
    .order("sort_order");

  async function markPaid() {
    "use server";
    const sb2 = await createClient();
    const { data: { user: u } } = await sb2.auth.getUser();
    if (!u) return;
    // 発行者のみ操作可
    await sb2
      .from("invoices")
      .update({ status: "paid", paid_at: new Date().toISOString() })
      .eq("id", id)
      .eq("issuer_id", u.id);
    revalidatePath(`/invoices/${id}`);
  }

  const status = INVOICE_STATUS[inv.status] ?? {
    label: inv.status,
    className: "bg-slate-100 text-slate-700 border-slate-200",
  };

  return (
    <div className="container-app max-w-2xl py-6 md:py-10 print:max-w-full print:py-0">
      <div className="mb-4 flex justify-between gap-2 flex-wrap print:hidden">
        <Link href="/invoices" className="text-sm text-moai-primary hover:underline">
          ← 請求書一覧
        </Link>
        <div className="flex gap-2">
          {user.id === inv.issuer_id && inv.status === "sent" && (
            <form action={markPaid}>
              <button className="btn-outline btn-sm">入金済みにする</button>
            </form>
          )}
          <PrintButton />
        </div>
      </div>

      <div className="card print:border-0 print:shadow-none print:p-0">
        <div className="flex justify-between items-start gap-4 flex-wrap">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold">請求書</h1>
            <span
              className={`mt-2 inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium ${status.className} print:hidden`}
            >
              {status.label}
            </span>
          </div>
          <div className="text-right text-sm">
            <div className="font-mono">{inv.invoice_number}</div>
            <div className="text-slate-500">発行日: {inv.issued_at}</div>
            {inv.due_date && <div className="text-slate-500">支払期日: {inv.due_date}</div>}
          </div>
        </div>

        <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
          <div>
            <div className="text-xs text-slate-500">請求先</div>
            <div className="font-semibold">
              {inv.recipient?.invoice_name ?? inv.recipient?.display_name ?? "—"} 様
            </div>
            {inv.recipient?.invoice_address && (
              <div className="text-slate-600 text-xs mt-1 whitespace-pre-wrap">
                {inv.recipient.invoice_address}
              </div>
            )}
          </div>
          <div>
            <div className="text-xs text-slate-500">請求元</div>
            <div className="font-semibold">
              {inv.issuer?.invoice_name ?? inv.issuer?.display_name ?? "—"}
            </div>
            {inv.issuer?.invoice_address && (
              <div className="text-slate-600 text-xs mt-1 whitespace-pre-wrap">
                {inv.issuer.invoice_address}
              </div>
            )}
            {inv.issuer?.invoice_registration_number && (
              <div className="text-slate-600 text-xs mt-1">
                登録番号: {inv.issuer.invoice_registration_number}
              </div>
            )}
          </div>
        </div>

        <div className="mt-6">
          <div className="text-sm font-semibold">件名: {inv.subject}</div>
        </div>

        <div className="mt-4 overflow-x-auto">
          <table className="w-full text-sm min-w-[480px]">
            <thead className="border-b-2 border-slate-800">
              <tr>
                <th className="text-left p-2">内容</th>
                <th className="text-right p-2 w-16">数量</th>
                <th className="text-right p-2 w-24">単価</th>
                <th className="text-right p-2 w-28">金額</th>
              </tr>
            </thead>
            <tbody>
              {items?.map((it: any) => (
                <tr key={it.id} className="border-b border-slate-200">
                  <td className="p-2">{it.description}</td>
                  <td className="p-2 text-right tabular-nums">{it.quantity}</td>
                  <td className="p-2 text-right tabular-nums">{formatCurrency(it.unit_price_jpy)}</td>
                  <td className="p-2 text-right tabular-nums">{formatCurrency(it.subtotal_jpy)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="mt-4 flex justify-end">
          <table className="text-sm">
            <tbody>
              <tr>
                <td className="p-1 text-right pr-4">小計</td>
                <td className="p-1 text-right tabular-nums">{formatCurrency(inv.subtotal_jpy)}</td>
              </tr>
              <tr>
                <td className="p-1 text-right pr-4">消費税</td>
                <td className="p-1 text-right tabular-nums">{formatCurrency(inv.tax_jpy)}</td>
              </tr>
              {inv.withholding_tax_jpy > 0 && (
                <tr>
                  <td className="p-1 text-right pr-4">源泉徴収</td>
                  <td className="p-1 text-right tabular-nums text-red-600">
                    - {formatCurrency(inv.withholding_tax_jpy)}
                  </td>
                </tr>
              )}
              <tr className="border-t-2 border-slate-800 text-lg font-bold">
                <td className="p-2 text-right pr-4">合計</td>
                <td className="p-2 text-right tabular-nums">{formatCurrency(inv.total_jpy)}</td>
              </tr>
            </tbody>
          </table>
        </div>

        {inv.notes && (
          <div className="mt-6 text-sm whitespace-pre-wrap text-slate-600">
            <div className="text-xs text-slate-500 mb-1">備考</div>
            {inv.notes}
          </div>
        )}

        <div className="mt-8 text-center print:hidden">
          <span
            className={`inline-flex items-center rounded-full border px-3 py-1 text-sm font-medium ${status.className}`}
          >
            {status.label}
          </span>
        </div>
      </div>
    </div>
  );
}
