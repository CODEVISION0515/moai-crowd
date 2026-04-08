import Link from "next/link";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export default async function InvoicesPage() {
  const sb = await createClient();
  const { data: { user } } = await sb.auth.getUser();
  if (!user) return null;

  const { data: received } = await sb.from("invoices")
    .select("*")
    .eq("recipient_id", user.id)
    .order("issued_at", { ascending: false });

  const { data: issued } = await sb.from("invoices")
    .select("*")
    .eq("issuer_id", user.id)
    .order("issued_at", { ascending: false });

  return (
    <div className="mx-auto max-w-4xl px-4 py-10 space-y-10">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">請求書</h1>
        <Link href="/invoices/new" className="btn-primary">+ 請求書発行</Link>
      </div>

      <section>
        <h2 className="text-lg font-semibold mb-3">受け取った請求書</h2>
        <InvoiceTable invoices={received ?? []} />
      </section>
      <section>
        <h2 className="text-lg font-semibold mb-3">発行した請求書</h2>
        <InvoiceTable invoices={issued ?? []} />
      </section>
    </div>
  );
}

function InvoiceTable({ invoices }: { invoices: any[] }) {
  if (invoices.length === 0) return <p className="text-sm text-slate-500">なし</p>;
  return (
    <div className="card p-0 overflow-hidden">
      <table className="w-full text-sm">
        <thead className="bg-slate-50">
          <tr className="text-left">
            <th className="p-3">番号</th>
            <th className="p-3">件名</th>
            <th className="p-3">発行日</th>
            <th className="p-3">期日</th>
            <th className="p-3 text-right">合計</th>
            <th className="p-3">状態</th>
          </tr>
        </thead>
        <tbody>
          {invoices.map((inv) => (
            <tr key={inv.id} className="border-t border-slate-200">
              <td className="p-3 font-mono text-xs">
                <Link href={`/invoices/${inv.id}`} className="text-moai-primary hover:underline">{inv.invoice_number}</Link>
              </td>
              <td className="p-3">{inv.subject}</td>
              <td className="p-3">{inv.issued_at}</td>
              <td className="p-3">{inv.due_date ?? "-"}</td>
              <td className="p-3 text-right font-semibold">¥{inv.total_jpy.toLocaleString()}</td>
              <td className="p-3"><span className="badge">{inv.status}</span></td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
