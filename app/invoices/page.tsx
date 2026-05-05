import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { EmptyState } from "@/components/EmptyState";
import { formatCurrency } from "@/lib/utils";

export const dynamic = "force-dynamic";

type InvoiceRow = {
  id: string;
  invoice_number: string;
  subject: string;
  issued_at: string;
  due_date: string | null;
  total_jpy: number;
  status: string;
};

const INVOICE_STATUS: Record<string, { label: string; className: string }> = {
  draft: { label: "下書き", className: "bg-slate-100 text-slate-700 border-slate-200" },
  sent: { label: "送付済み", className: "bg-blue-50 text-blue-700 border-blue-200" },
  paid: { label: "✓ 入金済み", className: "bg-emerald-50 text-emerald-700 border-emerald-200" },
  overdue: { label: "期限超過", className: "bg-red-50 text-red-700 border-red-200" },
  canceled: { label: "キャンセル", className: "bg-slate-100 text-slate-500 border-slate-200" },
};

function statusBadge(status: string) {
  const cfg = INVOICE_STATUS[status] ?? {
    label: status,
    className: "bg-slate-100 text-slate-700 border-slate-200",
  };
  return (
    <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[11px] font-medium ${cfg.className}`}>
      {cfg.label}
    </span>
  );
}

export default async function InvoicesPage() {
  const sb = await createClient();
  const { data: { user } } = await sb.auth.getUser();
  if (!user) redirect("/login?redirect=/invoices");

  const [{ data: received }, { data: issued }] = await Promise.all([
    sb
      .from("invoices")
      .select("id, invoice_number, subject, issued_at, due_date, total_jpy, status")
      .eq("recipient_id", user.id)
      .order("issued_at", { ascending: false })
      .returns<InvoiceRow[]>(),
    sb
      .from("invoices")
      .select("id, invoice_number, subject, issued_at, due_date, total_jpy, status")
      .eq("issuer_id", user.id)
      .order("issued_at", { ascending: false })
      .returns<InvoiceRow[]>(),
  ]);

  return (
    <div className="container-app max-w-4xl py-6 md:py-10 space-y-8">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold">請求書</h1>
          <p className="mt-1 text-sm text-moai-muted">発行・受領した請求書の一覧</p>
        </div>
        <Link href="/invoices/new" className="btn-primary">
          + 請求書を発行
        </Link>
      </div>

      <section className="space-y-3">
        <h2 className="section-title">受け取った請求書</h2>
        <InvoiceTable invoices={received ?? []} role="received" />
      </section>

      <section className="space-y-3">
        <h2 className="section-title">発行した請求書</h2>
        <InvoiceTable invoices={issued ?? []} role="issued" />
      </section>
    </div>
  );
}

function InvoiceTable({
  invoices,
  role,
}: {
  invoices: InvoiceRow[];
  role: "received" | "issued";
}) {
  if (invoices.length === 0) {
    return (
      <EmptyState
        icon="🧾"
        title={role === "received" ? "受け取った請求書はまだありません" : "発行した請求書はまだありません"}
        description={
          role === "received"
            ? "取引相手が請求書を発行すると、ここに表示されます。"
            : "案件完了後にこのページから請求書を発行できます。"
        }
        action={role === "issued" ? { href: "/invoices/new", label: "+ 請求書を発行" } : undefined}
      />
    );
  }

  return (
    <>
      {/* デスクトップ: テーブル */}
      <div className="card p-0 overflow-hidden hidden md:block">
        <table className="w-full text-sm">
          <thead className="bg-slate-50">
            <tr className="text-left">
              <th className="p-3 font-semibold">番号</th>
              <th className="p-3 font-semibold">件名</th>
              <th className="p-3 font-semibold">発行日</th>
              <th className="p-3 font-semibold">期日</th>
              <th className="p-3 font-semibold text-right">合計</th>
              <th className="p-3 font-semibold">状態</th>
            </tr>
          </thead>
          <tbody>
            {invoices.map((inv) => (
              <tr key={inv.id} className="border-t border-slate-200 hover:bg-slate-50/50 transition-colors">
                <td className="p-3 font-mono text-xs">
                  <Link href={`/invoices/${inv.id}`} className="text-moai-primary hover:underline">
                    {inv.invoice_number}
                  </Link>
                </td>
                <td className="p-3">
                  <Link href={`/invoices/${inv.id}`} className="hover:text-moai-primary line-clamp-1">
                    {inv.subject}
                  </Link>
                </td>
                <td className="p-3 text-xs text-moai-muted">{inv.issued_at}</td>
                <td className="p-3 text-xs text-moai-muted">{inv.due_date ?? "-"}</td>
                <td className="p-3 text-right font-semibold tabular-nums">{formatCurrency(inv.total_jpy)}</td>
                <td className="p-3">{statusBadge(inv.status)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* モバイル: カード */}
      <ul className="space-y-2 md:hidden">
        {invoices.map((inv) => (
          <li key={inv.id}>
            <Link href={`/invoices/${inv.id}`} className="card-hover block">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <div className="font-mono text-[11px] text-moai-muted">{inv.invoice_number}</div>
                  <div className="mt-0.5 font-medium line-clamp-2">{inv.subject}</div>
                  <div className="mt-1.5 text-xs text-moai-muted">
                    発行 {inv.issued_at}
                    {inv.due_date && <> ・ 期日 {inv.due_date}</>}
                  </div>
                </div>
                <div className="text-right shrink-0">
                  <div className="font-bold tabular-nums">{formatCurrency(inv.total_jpy)}</div>
                  <div className="mt-1">{statusBadge(inv.status)}</div>
                </div>
              </div>
            </Link>
          </li>
        ))}
      </ul>
    </>
  );
}
