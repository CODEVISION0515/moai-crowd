import type { Metadata } from "next";
import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { stripe } from "@/lib/stripe";
import ConnectStartButton from "./ConnectStartButton";

export const metadata: Metadata = { title: "振込先口座の登録" };

export const dynamic = "force-dynamic";

export default async function BankSetupPage({
  searchParams,
}: {
  searchParams: Promise<{ stripe?: string }>;
}) {
  const sp = await searchParams;
  const returnedFromStripe = sp.stripe === "return";

  const sb = await createClient();
  const { data: { user } } = await sb.auth.getUser();
  if (!user) redirect("/login?redirect=/bank-setup");

  const { data: profile } = await sb
    .from("profiles")
    .select("stripe_account_id, display_name")
    .eq("id", user.id)
    .single();

  // Stripe アカウント状態取得
  let status: "not_started" | "pending" | "completed" = "not_started";
  let connectChecks = {
    details_submitted: false,
    charges_enabled: false,
    payouts_enabled: false,
  };
  if (profile?.stripe_account_id) {
    try {
      const account = await stripe.accounts.retrieve(profile.stripe_account_id);
      connectChecks = {
        details_submitted: !!account.details_submitted,
        charges_enabled: !!account.charges_enabled,
        payouts_enabled: !!account.payouts_enabled,
      };
      if (
        connectChecks.details_submitted &&
        connectChecks.charges_enabled &&
        connectChecks.payouts_enabled
      ) {
        status = "completed";
      } else {
        status = "pending";
      }
    } catch {
      status = "not_started";
    }
  }

  return (
    <div className="container-app max-w-2xl py-6 md:py-10 space-y-8">
      {/* Header */}
      <header className="space-y-3">
        <div className="text-sm text-moai-muted">
          <Link href="/dashboard" className="hover:text-moai-primary">← ダッシュボード</Link>
        </div>
        <h1 className="text-2xl md:text-3xl font-bold">振込先口座の登録</h1>
        <p className="text-moai-muted text-sm md:text-base">
          受注した案件の報酬をあなたの銀行口座に自動送金するための設定です。
        </p>
      </header>

      {/* Status card (top) */}
      <StatusCard status={status} justReturned={returnedFromStripe} />

      {status === "pending" && <ConnectChecklist checks={connectChecks} />}

      {status === "completed" ? (
        <CompletedSection />
      ) : (
        <NotCompletedSection status={status} />
      )}

      {/* FAQ */}
      <section className="card bg-moai-cloud/40">
        <h2 className="font-bold mb-3 flex items-center gap-2">
          <span aria-hidden="true">❓</span>よくある質問
        </h2>
        <div className="space-y-3 text-sm">
          <details className="border-b border-moai-border pb-3">
            <summary className="cursor-pointer font-medium hover:text-moai-primary">
              なぜ口座登録が必要？
            </summary>
            <p className="mt-2 text-moai-muted leading-relaxed">
              あなたが受注した案件の報酬を自動で銀行口座に送金するためです。MOAIは決済パートナー「Stripe」を通じて、不正のない安全な送金を実現します。
            </p>
          </details>
          <details className="border-b border-moai-border pb-3">
            <summary className="cursor-pointer font-medium hover:text-moai-primary">
              本人確認書類は何が必要？
            </summary>
            <p className="mt-2 text-moai-muted leading-relaxed">
              運転免許証、マイナンバーカード、パスポートのいずれか1つ。スマホで撮影して、その場でアップロードできます。
            </p>
          </details>
          <details className="border-b border-moai-border pb-3">
            <summary className="cursor-pointer font-medium hover:text-moai-primary">
              MOAIに本人情報は渡る？
            </summary>
            <p className="mt-2 text-moai-muted leading-relaxed">
              渡りません。本人確認書類・銀行口座・生年月日などは、すべてStripe側で管理されます。MOAIは「登録完了したか」だけを把握します。
            </p>
          </details>
          <details className="border-b border-moai-border pb-3">
            <summary className="cursor-pointer font-medium hover:text-moai-primary">
              どのくらいで完了する？
            </summary>
            <p className="mt-2 text-moai-muted leading-relaxed">
              入力は約3〜5分。その後Stripeによる本人確認に数分〜数日かかります。承認されると自動で「完了」になります。
            </p>
          </details>
          <details>
            <summary className="cursor-pointer font-medium hover:text-moai-primary">
              困ったときは？
            </summary>
            <p className="mt-2 text-moai-muted leading-relaxed">
              このページの下部「困ったら相談」ボタンから、LINEやメールで運営スタッフにお気軽にご相談ください。
            </p>
          </details>
        </div>
      </section>

      {/* Support */}
      <section className="text-center">
        <p className="text-sm text-moai-muted mb-3">設定で迷ったら、遠慮なく相談してください。</p>
        <a
          href="mailto:contact@moai.okinawa?subject=口座登録のサポート"
          className="btn-outline btn-sm"
        >
          📧 サポートに相談する
        </a>
      </section>
    </div>
  );
}

// ── Status Card ─────────────────────────────────
function StatusCard({
  status,
  justReturned,
}: {
  status: "not_started" | "pending" | "completed";
  justReturned: boolean;
}) {
  if (status === "completed") {
    return (
      <div className="card border-2 border-emerald-200 bg-emerald-50/50">
        <div className="flex items-center gap-4">
          <div
            className="shrink-0 h-12 w-12 rounded-full bg-emerald-500 text-white flex items-center justify-center text-2xl"
            aria-hidden="true"
          >
            ✓
          </div>
          <div>
            <div className="text-[11px] font-semibold text-emerald-700 uppercase tracking-wider">
              ステータス
            </div>
            <h2 className="font-bold text-lg mt-0.5">登録完了 · 報酬を受け取れます</h2>
            <p className="mt-1 text-sm text-emerald-900">
              受注して承認されると、報酬が自動であなたの銀行口座に入金されます。
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (status === "pending") {
    return (
      <div className="card border-2 border-amber-200 bg-amber-50/50">
        <div className="flex items-center gap-4">
          <div
            className="shrink-0 h-12 w-12 rounded-full bg-amber-500 text-white flex items-center justify-center text-2xl"
            aria-hidden="true"
          >
            ⏳
          </div>
          <div>
            <div className="text-[11px] font-semibold text-amber-700 uppercase tracking-wider">
              ステータス
            </div>
            <h2 className="font-bold text-lg mt-0.5">
              {justReturned ? "登録内容を確認中です" : "途中まで登録済み"}
            </h2>
            <p className="mt-1 text-sm text-amber-900">
              あと少しで完了します。不足している情報を入力してください。
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="card border-2 border-moai-border">
      <div className="flex items-center gap-4">
        <div
          className="shrink-0 h-12 w-12 rounded-full bg-moai-cloud text-moai-muted flex items-center justify-center text-2xl"
          aria-hidden="true"
        >
          🏦
        </div>
        <div>
          <div className="text-[11px] font-semibold text-moai-muted uppercase tracking-wider">
            ステータス
          </div>
          <h2 className="font-bold text-lg mt-0.5">まだ登録されていません</h2>
          <p className="mt-1 text-sm text-moai-muted">
            案件を受注する前に、この設定を完了させましょう。
          </p>
        </div>
      </div>
    </div>
  );
}

// ── Connect checklist (pending only) ─────────────
function ConnectChecklist({
  checks,
}: {
  checks: { details_submitted: boolean; charges_enabled: boolean; payouts_enabled: boolean };
}) {
  const items = [
    {
      key: "details_submitted",
      ok: checks.details_submitted,
      label: "本人情報の入力",
      hint: "氏名・住所・生年月日・身分証画像",
    },
    {
      key: "charges_enabled",
      ok: checks.charges_enabled,
      label: "受領設定の有効化",
      hint: "Stripe 側の本人確認が完了するとオンになります",
    },
    {
      key: "payouts_enabled",
      ok: checks.payouts_enabled,
      label: "銀行口座への送金設定",
      hint: "口座情報が登録され、Stripe が承認するとオンになります",
    },
  ];
  return (
    <section className="card">
      <h2 className="font-semibold text-base mb-3 flex items-center gap-2">
        <span aria-hidden="true">📋</span>登録の進捗
      </h2>
      <ul className="space-y-2.5">
        {items.map((it) => (
          <li key={it.key} className="flex items-start gap-3">
            <span
              className={`shrink-0 inline-flex h-5 w-5 items-center justify-center rounded-full text-[11px] font-bold mt-0.5 ${
                it.ok ? "bg-emerald-500 text-white" : "bg-moai-cloud text-moai-muted"
              }`}
              aria-label={it.ok ? "完了" : "未完了"}
            >
              {it.ok ? "✓" : "·"}
            </span>
            <div className="flex-1 min-w-0">
              <div className={`text-sm font-medium ${it.ok ? "text-moai-ink" : "text-moai-muted"}`}>
                {it.label}
              </div>
              <div className="text-xs text-moai-muted mt-0.5">{it.hint}</div>
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}

// ── Not completed section (preparation + start) ─────────
function NotCompletedSection({
  status,
}: {
  status: "not_started" | "pending";
}) {
  return (
    <>
      {/* Preparation checklist */}
      <section className="card">
        <h2 className="font-bold text-lg mb-4 flex items-center gap-2">
          <span aria-hidden="true">📝</span>事前に用意するもの
        </h2>
        <ul className="space-y-3">
          <li className="flex items-start gap-3">
            <span className="shrink-0 h-6 w-6 rounded-full bg-moai-primary/10 text-moai-primary flex items-center justify-center text-sm font-bold">
              1
            </span>
            <div className="flex-1">
              <div className="font-medium">本人確認書類</div>
              <div className="text-xs text-moai-muted mt-0.5">
                運転免許証 / マイナンバーカード / パスポート のいずれか1つ（スマホで撮影可）
              </div>
            </div>
          </li>
          <li className="flex items-start gap-3">
            <span className="shrink-0 h-6 w-6 rounded-full bg-moai-primary/10 text-moai-primary flex items-center justify-center text-sm font-bold">
              2
            </span>
            <div className="flex-1">
              <div className="font-medium">銀行口座の情報</div>
              <div className="text-xs text-moai-muted mt-0.5">
                銀行名・支店名・口座番号・口座名義（通帳かネットバンキング画面で確認）
              </div>
            </div>
          </li>
          <li className="flex items-start gap-3">
            <span className="shrink-0 h-6 w-6 rounded-full bg-moai-primary/10 text-moai-primary flex items-center justify-center text-sm font-bold">
              3
            </span>
            <div className="flex-1">
              <div className="font-medium">住所・生年月日</div>
              <div className="text-xs text-moai-muted mt-0.5">
                本人確認書類と一致する情報
              </div>
            </div>
          </li>
        </ul>
        <p className="mt-4 pt-4 border-t border-moai-border text-xs text-moai-muted">
          ⏱ 入力にかかる時間：<strong className="text-moai-ink">約3〜5分</strong>
        </p>
      </section>

      {/* What will happen */}
      <section className="card bg-gradient-to-br from-moai-primary/5 to-transparent">
        <h2 className="font-bold mb-3 flex items-center gap-2">
          <span aria-hidden="true">🔐</span>このボタンを押すと
        </h2>
        <ol className="space-y-2 text-sm">
          <li className="flex items-start gap-2">
            <span className="shrink-0 text-moai-primary font-bold">→</span>
            <span>決済パートナー「Stripe」の安全な登録ページに移動します</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="shrink-0 text-moai-primary font-bold">→</span>
            <span>上の「事前に用意するもの」を入力します</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="shrink-0 text-moai-primary font-bold">→</span>
            <span>完了後、自動でこの画面に戻ってきます</span>
          </li>
        </ol>
        <p className="mt-3 text-xs text-moai-muted">
          ※ 本人情報はすべてStripe側で管理されます。MOAIには登録状況のみ共有されます。
        </p>
      </section>

      {/* CTA */}
      <ConnectStartButton isPending={status === "pending"} />
    </>
  );
}

// ── Completed section ─────────────────────────────
function CompletedSection() {
  return (
    <>
      <section className="card">
        <h2 className="font-bold text-lg mb-4 flex items-center gap-2">
          <span aria-hidden="true">🎯</span>次にやること
        </h2>
        <div className="space-y-3">
          <Link href="/jobs" className="card-hover flex items-start gap-3 p-3 border-none bg-moai-cloud/50">
            <span className="shrink-0 text-2xl">🔍</span>
            <div>
              <div className="font-semibold text-sm">案件を探す</div>
              <div className="text-xs text-moai-muted">あなたに合う案件に応募しましょう</div>
            </div>
          </Link>
          <Link href="/profile/edit" className="card-hover flex items-start gap-3 p-3 border-none bg-moai-cloud/50">
            <span className="shrink-0 text-2xl">✨</span>
            <div>
              <div className="font-semibold text-sm">プロフィールを完成させる</div>
              <div className="text-xs text-moai-muted">応募時のアピール力UP</div>
            </div>
          </Link>
          <Link href="/community" className="card-hover flex items-start gap-3 p-3 border-none bg-moai-cloud/50">
            <span className="shrink-0 text-2xl">🌱</span>
            <div>
              <div className="font-semibold text-sm">コミュニティで挨拶</div>
              <div className="text-xs text-moai-muted">仲間とゆんたくして、学びを広げよう</div>
            </div>
          </Link>
        </div>
      </section>
    </>
  );
}
