import Link from "next/link";
import { Suspense } from "react";
import { createAdminClient } from "@/lib/supabase/server";
import { SkeletonLine } from "@/components/Skeleton";
import { EmptyState } from "@/components/EmptyState";
import { Avatar } from "@/components/Avatar";
import { formatCurrency, formatDateJP } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default function AdminDashboard() {
  return (
    <div className="space-y-6">
      <Suspense fallback={<KpisSkeleton />}>
        <Kpis />
      </Suspense>

      <div className="grid md:grid-cols-2 gap-4">
        <Suspense fallback={<FeedSkeleton title="最近のユーザー" />}>
          <RecentUsers />
        </Suspense>
        <Suspense fallback={<FeedSkeleton title="最近の案件" />}>
          <RecentJobs />
        </Suspense>
      </div>

      <Suspense fallback={<FeedSkeleton title="最近の取引" />}>
        <RecentTransactions />
      </Suspense>
    </div>
  );
}

// ── KPIs ────────────────────────────────────────────
async function Kpis() {
  const admin = createAdminClient();
  const [
    { count: userCount },
    { count: jobCount },
    { count: contractCount },
    { count: openReports },
    { count: transferFailed },
    { data: feeSum },
  ] = await Promise.all([
    admin.from("profiles").select("*", { count: "exact", head: true }),
    admin.from("jobs").select("*", { count: "exact", head: true }),
    admin.from("contracts").select("*", { count: "exact", head: true }),
    admin.from("reports").select("*", { count: "exact", head: true }).eq("status", "open"),
    admin.from("contracts").select("*", { count: "exact", head: true }).not("transfer_failed_at", "is", null),
    admin.from("transactions").select("amount_jpy").eq("kind", "platform_fee"),
  ]);

  const totalFee = feeSum?.reduce((s, t: any) => s + t.amount_jpy, 0) ?? 0;

  const kpis = [
    { label: "総ユーザー数", value: (userCount ?? 0).toLocaleString(), href: "/admin/users" },
    { label: "総案件数", value: (jobCount ?? 0).toLocaleString(), href: "/admin/jobs" },
    { label: "総契約数", value: (contractCount ?? 0).toLocaleString(), href: "/admin/contracts" },
    { label: "手数料累計", value: formatCurrency(totalFee), href: "/admin/transactions?kind=platform_fee" },
    { label: "未処理の通報", value: (openReports ?? 0).toLocaleString(), highlight: (openReports ?? 0) > 0, href: "/admin/reports" },
    { label: "⚠️ Transfer失敗", value: (transferFailed ?? 0).toLocaleString(), highlight: (transferFailed ?? 0) > 0, href: "/admin/contracts?issue=transfer_failed" },
  ];

  return (
    <div className="grid md:grid-cols-3 lg:grid-cols-6 gap-4">
      {kpis.map((k) => {
        const content = (
          <>
            <div className="text-xs text-slate-500">{k.label}</div>
            <div className="mt-2 text-2xl font-bold">{k.value}</div>
          </>
        );
        return k.href ? (
          <Link
            key={k.label}
            href={k.href}
            className={`card-hover ${k.highlight ? "border-red-300 bg-red-50" : ""}`}
          >
            {content}
          </Link>
        ) : (
          <div key={k.label} className={`card ${k.highlight ? "border-red-300 bg-red-50" : ""}`}>
            {content}
          </div>
        );
      })}
    </div>
  );
}

function KpisSkeleton() {
  return (
    <div className="grid md:grid-cols-3 lg:grid-cols-6 gap-4">
      {[0, 1, 2, 3, 4, 5].map((i) => (
        <div key={i} className="card space-y-2">
          <SkeletonLine className="h-3 w-24" />
          <SkeletonLine className="h-7 w-16" />
        </div>
      ))}
    </div>
  );
}

// ── Recent users ─────────────────────────────────────
async function RecentUsers() {
  const admin = createAdminClient();
  const { data: users } = await admin
    .from("profiles")
    .select("id, handle, display_name, avatar_url, created_at")
    .order("created_at", { ascending: false })
    .limit(6);

  return (
    <section>
      <SectionHeader title="最近の新規ユーザー" href="/admin/users" />
      {users && users.length > 0 ? (
        <ul className="card p-0 overflow-hidden divide-y divide-slate-200">
          {users.map((u) => (
            <li key={u.id}>
              <Link href={`/profile/${u.handle}`} className="flex items-center gap-3 p-3 hover:bg-moai-cloud transition-colors">
                <span className="h-8 w-8 rounded-full overflow-hidden bg-moai-cloud flex items-center justify-center text-xs font-semibold text-moai-muted shrink-0">
                  <Avatar src={u.avatar_url} name={u.display_name} size={32} />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="font-medium text-sm block truncate">{u.display_name}</span>
                  <span className="text-xs text-slate-500 block truncate">@{u.handle}</span>
                </span>
                <span className="text-xs text-moai-muted shrink-0">{formatDateJP(u.created_at)}</span>
              </Link>
            </li>
          ))}
        </ul>
      ) : (
        <EmptyState icon="👤" title="ユーザーはいません" />
      )}
    </section>
  );
}

// ── Recent jobs ─────────────────────────────────────
async function RecentJobs() {
  const admin = createAdminClient();
  const { data: jobs } = await admin
    .from("jobs")
    .select("id, title, category, status, created_at")
    .order("created_at", { ascending: false })
    .limit(6);

  return (
    <section>
      <SectionHeader title="最近の案件" href="/admin/jobs" />
      {jobs && jobs.length > 0 ? (
        <ul className="card p-0 overflow-hidden divide-y divide-slate-200">
          {jobs.map((j) => (
            <li key={j.id}>
              <Link href={`/jobs/${j.id}`} className="flex items-center gap-3 p-3 hover:bg-moai-cloud transition-colors">
                <span className="min-w-0 flex-1">
                  <span className="font-medium text-sm block truncate">{j.title}</span>
                  <span className="text-xs text-slate-500 flex items-center gap-1.5 mt-0.5">
                    <span className="badge text-[10px]">{j.category}</span>
                    <span className="badge text-[10px]">{j.status}</span>
                  </span>
                </span>
                <span className="text-xs text-moai-muted shrink-0">{formatDateJP(j.created_at)}</span>
              </Link>
            </li>
          ))}
        </ul>
      ) : (
        <EmptyState icon="📋" title="案件はありません" />
      )}
    </section>
  );
}

// ── Recent transactions ─────────────────────────────
async function RecentTransactions() {
  const admin = createAdminClient();
  const { data: txs } = await admin
    .from("transactions")
    .select("id, kind, amount_jpy, note, created_at, contracts(jobs(title))")
    .order("created_at", { ascending: false })
    .limit(8);

  return (
    <section>
      <SectionHeader title="最近の取引" href="/admin/transactions" />
      {txs && txs.length > 0 ? (
        <div className="card p-0 overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-slate-50">
              <tr className="text-left">
                <th scope="col" className="p-3">日時</th>
                <th scope="col" className="p-3">案件</th>
                <th scope="col" className="p-3">種別</th>
                <th scope="col" className="p-3 text-right">金額</th>
              </tr>
            </thead>
            <tbody>
              {txs.map((t: any) => (
                <tr key={t.id} className="border-t border-slate-200">
                  <td className="p-3 text-xs text-slate-500 whitespace-nowrap">{formatDateJP(t.created_at)}</td>
                  <td className="p-3 truncate max-w-xs">{t.contracts?.jobs?.title ?? "-"}</td>
                  <td className="p-3"><span className="badge text-[10px]">{t.kind}</span></td>
                  <td className="p-3 text-right font-semibold whitespace-nowrap">{formatCurrency(t.amount_jpy)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <EmptyState icon="💸" title="取引はありません" />
      )}
    </section>
  );
}

function SectionHeader({ title, href }: { title: string; href?: string }) {
  return (
    <div className="section-header mb-3">
      <h2 className="section-title">{title}</h2>
      {href && <Link href={href} className="section-link text-xs">すべて見る</Link>}
    </div>
  );
}

function FeedSkeleton({ title }: { title: string }) {
  return (
    <section>
      <SectionHeader title={title} />
      <div className="card p-0 overflow-hidden divide-y divide-slate-200">
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className="p-3 flex items-center gap-3">
            <div className="skeleton h-8 w-8 rounded-full" />
            <div className="flex-1 space-y-2">
              <SkeletonLine className="h-4 w-3/4" />
              <SkeletonLine className="h-3 w-1/3" />
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
