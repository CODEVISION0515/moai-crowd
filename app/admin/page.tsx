import { createAdminClient } from "@/lib/supabase/server";
import { formatCurrency } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function AdminDashboard() {
  const admin = createAdminClient();
  const [
    { count: userCount },
    { count: jobCount },
    { count: contractCount },
    { count: openReports },
    { data: feeSum },
  ] = await Promise.all([
    admin.from("profiles").select("*", { count: "exact", head: true }),
    admin.from("jobs").select("*", { count: "exact", head: true }),
    admin.from("contracts").select("*", { count: "exact", head: true }),
    admin.from("reports").select("*", { count: "exact", head: true }).eq("status", "open"),
    admin.from("transactions").select("amount_jpy").eq("kind", "platform_fee"),
  ]);

  const totalFee = feeSum?.reduce((s, t: any) => s + t.amount_jpy, 0) ?? 0;

  const kpis = [
    { label: "総ユーザー数", value: userCount ?? 0 },
    { label: "総案件数", value: jobCount ?? 0 },
    { label: "総契約数", value: contractCount ?? 0 },
    { label: "手数料累計", value: formatCurrency(totalFee) },
    { label: "未処理の通報", value: openReports ?? 0, highlight: (openReports ?? 0) > 0 },
  ];

  return (
    <div className="grid md:grid-cols-3 lg:grid-cols-5 gap-4">
      {kpis.map((k) => (
        <div key={k.label} className={`card ${k.highlight ? "border-red-300 bg-red-50" : ""}`}>
          <div className="text-xs text-slate-500">{k.label}</div>
          <div className="mt-2 text-2xl font-bold">{k.value}</div>
        </div>
      ))}
    </div>
  );
}
