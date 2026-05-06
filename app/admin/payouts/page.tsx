import Link from "next/link";
import { createAdminClient } from "@/lib/supabase/server";
import { formatCurrency, formatDateJP } from "@/lib/utils";
import { EmptyState } from "@/components/EmptyState";
import { markPayoutComplete } from "./actions";
import CsvDownloadButton from "./CsvDownloadButton";

/* eslint-disable @typescript-eslint/no-explicit-any */

export const dynamic = "force-dynamic";

const ACCOUNT_TYPE_LABEL: Record<string, string> = {
  ordinary: "普通",
  checking: "当座",
  savings: "貯蓄",
};

type Tab = "pending" | "done";

export default async function AdminPayoutsPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string }>;
}) {
  const sp = await searchParams;
  const tab: Tab = sp.tab === "done" ? "done" : "pending";

  const admin = createAdminClient();

  // 振込待ち = released かつ paid_out_at NULL
  // 振込済 = paid_out_at NOT NULL
  let query = admin
    .from("contracts")
    .select(`
      id, amount_jpy, worker_payout_jpy, platform_fee_jpy, status,
      released_at, paid_out_at, paid_out_note,
      job:job_id(id, title),
      worker:worker_id(
        id, handle, display_name,
        bank_name, bank_branch_name, bank_branch_code,
        bank_account_type, bank_account_number, bank_account_holder
      )
    `)
    .eq("status", "released")
    .order("released_at", { ascending: false });

  query = tab === "pending" ? query.is("paid_out_at", null) : query.not("paid_out_at", "is", null);

  const { data: contracts, error } = await query.limit(200);
  if (error) console.error("[admin/payouts] fetch error", error);

  const list = (contracts ?? []) as any[];
  const totalAmount = list.reduce((sum, c) => sum + (c.worker_payout_jpy ?? 0), 0);

  // タブ件数（カウントは別クエリ）
  const [{ count: pendingCount }, { count: doneCount }] = await Promise.all([
    admin.from("contracts").select("*", { count: "exact", head: true }).eq("status", "released").is("paid_out_at", null),
    admin.from("contracts").select("*", { count: "exact", head: true }).eq("status", "released").not("paid_out_at", "is", null),
  ]);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-bold flex items-center gap-2">
          <span aria-hidden="true">💸</span>振込管理
        </h2>
        <p className="mt-1 text-xs text-moai-muted leading-relaxed">
          検収完了 (released) かつ未振込の案件一覧。CSV ダウンロードして銀行アプリで一括振込し、振込完了後にここで「振込済」をクリック。
        </p>
      </div>

      {/* Tabs */}
      <div className="border-b border-moai-border flex gap-1">
        <TabLink href="/admin/payouts?tab=pending" active={tab === "pending"} count={pendingCount ?? 0}>
          振込待ち
        </TabLink>
        <TabLink href="/admin/payouts?tab=done" active={tab === "done"} count={doneCount ?? 0}>
          振込済
        </TabLink>
      </div>

      {/* Summary */}
      {tab === "pending" && list.length > 0 && (
        <div className="card border-l-[3px] border-l-amber-400 bg-amber-50/30">
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div>
              <div className="text-xs text-moai-muted">未振込合計</div>
              <div className="text-2xl font-bold text-moai-ink mt-0.5">{formatCurrency(totalAmount)}</div>
              <div className="text-xs text-moai-muted mt-0.5">{list.length} 件</div>
            </div>
            <CsvDownloadButton rows={list.map((c) => csvRow(c))} filename={`payouts_${new Date().toISOString().slice(0, 10)}.csv`} />
          </div>
        </div>
      )}

      {/* List */}
      {list.length === 0 ? (
        <EmptyState
          icon={tab === "pending" ? "✓" : "📭"}
          title={tab === "pending" ? "振込待ちはありません" : "振込済記録なし"}
          description={tab === "pending" ? "検収完了かつ未振込の案件がここに並びます。" : "「振込済」タブには履歴が表示されます。"}
        />
      ) : (
        <div className="space-y-3">
          {list.map((c) => (
            <PayoutRow key={c.id} contract={c} tab={tab} />
          ))}
        </div>
      )}
    </div>
  );
}

function TabLink({
  href,
  active,
  count,
  children,
}: {
  href: string;
  active: boolean;
  count: number;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      aria-current={active ? "page" : undefined}
      className={`px-4 py-2.5 text-sm font-medium border-b-2 -mb-px transition-colors ${
        active ? "border-moai-primary text-moai-primary" : "border-transparent text-moai-muted hover:text-moai-ink"
      }`}
    >
      {children}
      <span
        className={`ml-1.5 text-[10px] px-1.5 py-0.5 rounded-full ${
          active ? "bg-moai-primary/10 text-moai-primary" : "bg-moai-cloud text-moai-muted"
        }`}
      >
        {count}
      </span>
    </Link>
  );
}

function PayoutRow({ contract: c, tab }: { contract: any; tab: Tab }) {
  const w = c.worker;
  const bankIncomplete = !(w?.bank_name && w?.bank_account_number && w?.bank_account_holder);

  return (
    <article className="card">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs text-moai-muted">契約ID</span>
            <code className="text-[11px] font-mono text-moai-muted">{c.id.slice(0, 8)}</code>
            <Link href={`/admin/contracts/${c.id}`} className="text-xs text-moai-primary hover:underline">詳細 →</Link>
          </div>
          <h3 className="mt-1 font-semibold text-sm md:text-base leading-snug">
            {c.job?.title ?? "(削除済み案件)"}
          </h3>
          <div className="mt-2 flex items-center gap-3 text-xs text-moai-muted flex-wrap">
            <span>受注者: <Link href={`/profile/${w?.handle}`} className="text-moai-ink font-medium hover:text-moai-primary">{w?.display_name ?? "-"}</Link></span>
            <span>検収日: {c.released_at ? formatDateJP(c.released_at) : "-"}</span>
            {tab === "done" && c.paid_out_at && (
              <span className="text-emerald-700">振込日: {formatDateJP(c.paid_out_at)}</span>
            )}
          </div>
        </div>
        <div className="text-right shrink-0">
          <div className="text-xs text-moai-muted">受注者支払額</div>
          <div className="text-lg font-bold text-moai-ink">{formatCurrency(c.worker_payout_jpy ?? 0)}</div>
          <div className="text-[10px] text-moai-muted mt-0.5">手数料 {formatCurrency(c.platform_fee_jpy ?? 0)}</div>
        </div>
      </div>

      {/* Bank info */}
      <div className={`mt-4 pt-4 border-t border-moai-border ${bankIncomplete ? "bg-red-50/30 -mx-5 -mb-5 px-5 pb-5 rounded-b-lg" : ""}`}>
        {bankIncomplete ? (
          <div className="text-xs text-red-600 leading-relaxed">
            ⚠ 受注者の振込先口座が未登録です。本人に <code>/bank-setup</code> での登録を依頼してください。
          </div>
        ) : (
          <dl className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
            <Field label="銀行" value={w.bank_name} />
            <Field label="支店" value={`${w.bank_branch_name}${w.bank_branch_code ? ` (${w.bank_branch_code})` : ""}`} />
            <Field label="種別" value={ACCOUNT_TYPE_LABEL[w.bank_account_type ?? ""] ?? w.bank_account_type} />
            <Field label="口座番号" value={w.bank_account_number} mono />
            <Field label="名義" value={w.bank_account_holder} className="md:col-span-4" />
          </dl>
        )}
      </div>

      {/* Action */}
      {tab === "pending" && !bankIncomplete && (
        <form action={markPayoutComplete} className="mt-4 flex items-end gap-2 flex-wrap">
          <input type="hidden" name="contract_id" value={c.id} />
          <div className="flex-1 min-w-[200px]">
            <label htmlFor={`note-${c.id}`} className="label">振込メモ (任意)</label>
            <input
              id={`note-${c.id}`}
              name="note"
              type="text"
              placeholder="例: 2026/05/15 振込分"
              className="input"
            />
          </div>
          <button type="submit" className="btn-success btn-sm">
            ✓ 振込済にする
          </button>
        </form>
      )}

      {tab === "done" && c.paid_out_note && (
        <div className="mt-3 text-xs text-moai-muted bg-moai-cloud/40 rounded p-2">
          <span className="font-semibold">メモ:</span> {c.paid_out_note}
        </div>
      )}
    </article>
  );
}

function Field({
  label,
  value,
  mono,
  className,
}: {
  label: string;
  value: string | null;
  mono?: boolean;
  className?: string;
}) {
  return (
    <div className={className}>
      <dt className="text-[10px] text-moai-muted uppercase tracking-wider">{label}</dt>
      <dd className={`mt-0.5 font-medium text-moai-ink ${mono ? "font-mono" : ""}`}>{value ?? "-"}</dd>
    </div>
  );
}

function csvRow(c: any): Record<string, string | number> {
  const w = c.worker ?? {};
  return {
    contract_id: c.id,
    job_title: c.job?.title ?? "",
    worker_name: w.display_name ?? "",
    worker_handle: w.handle ?? "",
    bank_name: w.bank_name ?? "",
    bank_branch_name: w.bank_branch_name ?? "",
    bank_branch_code: w.bank_branch_code ?? "",
    bank_account_type: ACCOUNT_TYPE_LABEL[w.bank_account_type ?? ""] ?? w.bank_account_type ?? "",
    bank_account_number: w.bank_account_number ?? "",
    bank_account_holder: w.bank_account_holder ?? "",
    amount_jpy: c.worker_payout_jpy ?? 0,
    released_at: c.released_at ? new Date(c.released_at).toISOString().slice(0, 10) : "",
  };
}
