import type { Metadata } from "next";
import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import BankAccountForm from "./BankAccountForm";

export const metadata: Metadata = { title: "振込先口座の登録" };

export const dynamic = "force-dynamic";

const ACCOUNT_TYPE_LABEL: Record<string, string> = {
  ordinary: "普通",
  checking: "当座",
  savings: "貯蓄",
};

export default async function BankSetupPage({
  searchParams,
}: {
  searchParams: Promise<{ saved?: string }>;
}) {
  const sp = await searchParams;
  const justSaved = sp.saved === "1";

  const sb = await createClient();
  const { data: { user } } = await sb.auth.getUser();
  if (!user) redirect("/login?redirect=/bank-setup");

  const { data: profile } = await sb
    .from("profiles")
    .select("display_name, bank_name, bank_branch_name, bank_branch_code, bank_account_type, bank_account_number, bank_account_holder, bank_registered_at")
    .eq("id", user.id)
    .single();

  const isRegistered = !!(
    profile?.bank_name &&
    profile?.bank_branch_name &&
    profile?.bank_account_number &&
    profile?.bank_account_holder
  );

  return (
    <div className="container-app max-w-2xl py-6 md:py-10 space-y-8">
      {/* Header */}
      <header className="space-y-3">
        <div className="text-sm text-moai-muted">
          <Link href="/dashboard" className="hover:text-moai-primary">← ダッシュボード</Link>
        </div>
        <h1 className="text-2xl md:text-3xl font-bold">振込先口座の登録</h1>
        <p className="text-moai-muted text-sm md:text-base">
          受注した案件の報酬を、あなたの銀行口座へ振込むために必要です。
        </p>
      </header>

      {/* Status banner */}
      {justSaved && (
        <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-4 flex items-start gap-3 animate-fade-in">
          <span aria-hidden="true" className="text-xl">✓</span>
          <div className="flex-1">
            <div className="font-semibold text-emerald-900">口座情報を保存しました</div>
            <p className="mt-0.5 text-xs text-emerald-900/80 leading-relaxed">
              これで案件を受注できます。報酬は検収完了後、運営から月1〜2回まとめて振込いたします。
            </p>
          </div>
        </div>
      )}

      {/* Status card */}
      <section className={`card ${isRegistered ? "border-l-[3px] border-l-emerald-500 bg-emerald-50/30" : "border-l-[3px] border-l-amber-400 bg-amber-50/30"}`}>
        <div className="flex items-start gap-3">
          <span aria-hidden="true" className="text-2xl shrink-0">{isRegistered ? "🏦" : "🔔"}</span>
          <div className="flex-1 min-w-0">
            <div className="text-xs font-semibold text-moai-muted uppercase tracking-wider">ステータス</div>
            <div className={`text-base md:text-lg font-bold mt-0.5 ${isRegistered ? "text-emerald-900" : "text-amber-900"}`}>
              {isRegistered ? "登録済み" : "まだ登録されていません"}
            </div>
            <p className="mt-1 text-xs md:text-sm text-moai-muted leading-relaxed">
              {isRegistered
                ? "案件を受注できる状態です。情報を変更したい場合は下のフォームを更新してください。"
                : "案件を受注する前に、この設定を完了させましょう。"}
            </p>
          </div>
        </div>

        {/* Show registered info summary */}
        {isRegistered && (
          <dl className="mt-4 pt-4 border-t border-moai-border grid grid-cols-2 gap-3 text-sm">
            <Field label="銀行" value={profile.bank_name} />
            <Field
              label="支店"
              value={`${profile.bank_branch_name}${profile.bank_branch_code ? ` (${profile.bank_branch_code})` : ""}`}
            />
            <Field label="種別" value={ACCOUNT_TYPE_LABEL[profile.bank_account_type ?? ""] ?? profile.bank_account_type} />
            <Field
              label="口座番号"
              value={profile.bank_account_number ? `••••${profile.bank_account_number.slice(-4)}` : "-"}
            />
            <Field label="名義" value={profile.bank_account_holder} className="col-span-2" />
            {profile.bank_registered_at && (
              <Field
                label="最終更新"
                value={new Date(profile.bank_registered_at).toLocaleString("ja-JP", {
                  year: "numeric",
                  month: "short",
                  day: "numeric",
                  hour: "2-digit",
                  minute: "2-digit",
                })}
                className="col-span-2"
              />
            )}
          </dl>
        )}
      </section>

      {/* What you need */}
      <section className="card">
        <h2 className="font-bold mb-3 flex items-center gap-2">
          <span aria-hidden="true">📝</span>用意するもの
        </h2>
        <ul className="space-y-2.5 text-sm">
          <li className="flex items-start gap-3">
            <span className="shrink-0 h-6 w-6 rounded-full bg-moai-primary/10 text-moai-primary text-xs font-bold flex items-center justify-center">1</span>
            <div>
              <div className="font-medium">通帳 or キャッシュカード</div>
              <div className="text-xs text-moai-muted mt-0.5">銀行名・支店名・口座番号・名義の確認用</div>
            </div>
          </li>
          <li className="flex items-start gap-3">
            <span className="shrink-0 h-6 w-6 rounded-full bg-moai-primary/10 text-moai-primary text-xs font-bold flex items-center justify-center">2</span>
            <div>
              <div className="font-medium">支店コード（推奨）</div>
              <div className="text-xs text-moai-muted mt-0.5">3桁の数字。通帳・カード・ネットバンキング画面で確認可能</div>
            </div>
          </li>
        </ul>
        <p className="mt-3 text-[11px] text-moai-muted">⏱ 入力にかかる時間: 約2〜3分</p>
      </section>

      {/* Form */}
      <section>
        <h2 className="text-base md:text-lg font-bold mb-3">
          {isRegistered ? "口座情報を更新する" : "口座情報を入力"}
        </h2>
        <BankAccountForm
          initial={{
            bank_name: profile?.bank_name ?? null,
            bank_branch_name: profile?.bank_branch_name ?? null,
            bank_branch_code: profile?.bank_branch_code ?? null,
            bank_account_type: profile?.bank_account_type ?? null,
            bank_account_number: profile?.bank_account_number ?? null,
            bank_account_holder: profile?.bank_account_holder ?? null,
          }}
        />
      </section>

      {/* FAQ */}
      <section className="card bg-moai-cloud/40">
        <h2 className="font-bold mb-3 flex items-center gap-2">
          <span aria-hidden="true">❓</span>よくある質問
        </h2>
        <div className="space-y-3 text-sm">
          <details className="border-b border-moai-border pb-3">
            <summary className="cursor-pointer font-medium hover:text-moai-primary">
              いつ振込まれる？
            </summary>
            <p className="mt-2 text-moai-muted leading-relaxed">
              案件の納品 → 発注者の検収完了後、運営が月1〜2回まとめて振込手続きを行います。
              振込日は毎月15日・月末（営業日）を予定しています。
            </p>
          </details>
          <details className="border-b border-moai-border pb-3">
            <summary className="cursor-pointer font-medium hover:text-moai-primary">
              振込手数料は誰が負担？
            </summary>
            <p className="mt-2 text-moai-muted leading-relaxed">
              ローンチ期間（〜2026年10月）は CODEVISION が全額負担します。
              2026年11月以降は受注者から実費を控除する予定です（同行・他行で異なる、最大330円）。
            </p>
          </details>
          <details className="border-b border-moai-border pb-3">
            <summary className="cursor-pointer font-medium hover:text-moai-primary">
              口座情報は誰が見られる？
            </summary>
            <p className="mt-2 text-moai-muted leading-relaxed">
              本人と CODEVISION の振込担当者のみがアクセス可能です。発注者・他の受注者には公開されません。
              データベースは Supabase により暗号化され、Row-Level Security で保護されています。
            </p>
          </details>
          <details className="pb-1">
            <summary className="cursor-pointer font-medium hover:text-moai-primary">
              口座情報を変更したい
            </summary>
            <p className="mt-2 text-moai-muted leading-relaxed">
              このページのフォームでいつでも更新できます。次回の振込から新しい口座が使われます。
              すでに振込手続きが進んでいる場合は、運営にお問い合わせください。
            </p>
          </details>
        </div>
      </section>

      {/* Trust note */}
      <p className="text-center text-[11px] text-moai-muted leading-relaxed">
        🔒 口座情報は SSL/TLS で暗号化して送受信。Supabase 上でも暗号化保管されます。
      </p>
    </div>
  );
}

function Field({ label, value, className }: { label: string; value: string | null; className?: string }) {
  return (
    <div className={className}>
      <dt className="text-[11px] text-moai-muted uppercase tracking-wider">{label}</dt>
      <dd className="mt-0.5 font-medium text-moai-ink">{value ?? "-"}</dd>
    </div>
  );
}
