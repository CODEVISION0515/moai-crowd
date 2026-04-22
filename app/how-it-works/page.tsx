import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "使い方・決済の仕組み",
  description: "MOAI Crowdの使い方と、エスクロー決済の仕組みを図解で解説。発注者のカード決済から受注者の銀行振込まで、取引の流れがわかります。",
};

export default function HowItWorksPage() {
  return (
    <div className="container-app max-w-4xl py-10 space-y-16">
      <header className="text-center">
        <h1 className="text-3xl md:text-4xl font-bold tracking-tight">使い方・決済の仕組み</h1>
        <p className="mt-3 text-moai-muted">
          エスクロー決済で安全に取引。発注者も受注者も安心して使える仕組みです。
        </p>
      </header>

      {/* ── 決済フロー全体図 ── */}
      <section>
        <h2 className="text-2xl font-bold text-center mb-8">💰 決済の流れ</h2>
        <div className="card">
          <ol className="space-y-6">
            <FlowStep
              step={1}
              title="発注者がクレジットカードで支払い"
              description="案件受託時に、Stripeのセキュアな決済画面で契約金額を前払いします。銀行振込ではなくカード決済のみ。"
              actor="発注者"
              icon="💳"
            />
            <FlowStep
              step={2}
              title="MOAI Crowd がエスクローで保管"
              description="支払われたお金は、一旦MOAI Crowdの決済口座（Stripe）で第三者預託されます。この時点ではまだ受注者には届きません。"
              actor="プラットフォーム"
              icon="🔒"
            />
            <FlowStep
              step={3}
              title="受注者が作業 → 成果物を提出"
              description="チャットで進捗を共有しながら進めます。完成したら「成果物を提出」で送信。"
              actor="受注者"
              icon="📦"
            />
            <FlowStep
              step={4}
              title="発注者が成果物を確認・承認"
              description="問題なければ「承認して支払う」をクリック。修正が必要なら「修正依頼」で追加対応を求められます。"
              actor="発注者"
              icon="✅"
            />
            <FlowStep
              step={5}
              title="受注者の銀行口座に自動送金"
              description="承認と同時に、MOAI手数料を差し引いた金額が自動でStripe → あなたの銀行口座に入金されます（通常1〜7営業日）。"
              actor="受注者"
              icon="🏦"
              highlight
            />
          </ol>
        </div>
      </section>

      {/* ── 受注者向け：口座登録 ── */}
      <section>
        <h2 className="text-2xl font-bold text-center mb-8">🎯 受注者: はじめに銀行口座の登録が必要</h2>
        <div className="grid md:grid-cols-2 gap-4">
          <div className="card">
            <div className="text-2xl mb-2" aria-hidden="true">📝</div>
            <h3 className="font-semibold mb-2">登録する内容</h3>
            <ul className="text-sm text-moai-muted space-y-1.5 list-disc ml-5">
              <li>氏名・住所・生年月日</li>
              <li>本人確認書類（運転免許証 or マイナンバーカード等）</li>
              <li>振込先の銀行口座番号</li>
            </ul>
            <p className="mt-3 text-xs text-moai-muted">
              ※ Stripe（決済パートナー）が管理する正規の手続きです。MOAI Crowdはこれらの情報を保持しません。
            </p>
          </div>
          <div className="card">
            <div className="text-2xl mb-2" aria-hidden="true">⏱</div>
            <h3 className="font-semibold mb-2">所要時間と手順</h3>
            <ol className="text-sm text-moai-muted space-y-1.5 list-decimal ml-5">
              <li>プロフィール編集画面を開く</li>
              <li>「受注者登録を始める」をクリック</li>
              <li>Stripeの案内に従って入力（3〜5分）</li>
              <li>本人確認書類を撮影してアップロード</li>
              <li>完了 → 受注可能になります</li>
            </ol>
            <Link
              href="/profile/edit"
              className="btn-accent btn-sm mt-4"
            >
              今すぐ登録する →
            </Link>
          </div>
        </div>
      </section>

      {/* ── 手数料の具体例 ── */}
      <section>
        <h2 className="text-2xl font-bold text-center mb-8">💴 手数料のリアルな計算例</h2>
        <div className="grid md:grid-cols-2 gap-4">
          <FeeExample
            title="例① 契約額 10万円 (MOAI在校生が受注)"
            rows={[
              { label: "発注者が払う (手数料0%)", value: "100,000円", strong: true },
              { label: "MOAI Crowd 手数料 (受注者側0% / 在校生特典)", value: "0円" },
              { label: "受注者の受取額", value: "100,000円", highlight: true },
            ]}
          />
          <FeeExample
            title="例② 契約額 10万円 (MOAI卒業生が受注)"
            rows={[
              { label: "発注者が払う (ローンチ期間中0%)", value: "100,000円", strong: true },
              { label: "MOAI Crowd 手数料 (受注者側5%)", value: "-5,000円" },
              { label: "受注者の受取額", value: "95,000円", highlight: true },
            ]}
          />
          <FeeExample
            title="例③ 契約額 10万円 (一般受注者・ローンチ期間中)"
            rows={[
              { label: "発注者が払う (ローンチ期間中0%)", value: "100,000円", strong: true },
              { label: "MOAI Crowd 手数料 (受注者側15%)", value: "-15,000円" },
              { label: "受注者の受取額", value: "85,000円", highlight: true },
            ]}
          />
          <FeeExample
            title="例④ 契約額 10万円 (標準期・一般受注者)"
            rows={[
              { label: "発注者が払う (標準期4%上乗せ)", value: "104,000円", strong: true },
              { label: "MOAI Crowd 手数料 (受注者側15%)", value: "-15,000円" },
              { label: "受注者の受取額", value: "85,000円", highlight: true },
            ]}
          />
        </div>
        <p className="text-xs text-moai-muted text-center mt-4">
          ※ 実際には消費税・源泉徴収等が別途計算されます。請求書発行機能で自動対応。
        </p>
      </section>

      {/* ── 安心のための仕組み ── */}
      <section>
        <h2 className="text-2xl font-bold text-center mb-8">🛡 安心のための仕組み</h2>
        <div className="grid md:grid-cols-3 gap-4">
          <SafetyCard
            icon="🔒"
            title="エスクロー決済"
            text="成果物を承認するまで、お金は受注者に届きません。発注者は安心して前払いできます。"
          />
          <SafetyCard
            icon="🔁"
            title="修正依頼・返金"
            text="満足できない場合は修正を依頼できます。どうしても解決しない場合は管理者が返金対応します。"
          />
          <SafetyCard
            icon="🏛"
            title="Stripe が決済を管理"
            text="世界最大級の決済プラットフォーム Stripe が取引を担保。カード情報はMOAI Crowdに保存されません。"
          />
        </div>
      </section>

      {/* ── CTA ── */}
      <section className="card bg-gradient-to-br from-moai-primary to-moai-primary-900 text-white text-center">
        <h2 className="text-2xl font-bold">さっそく始めてみよう</h2>
        <p className="mt-2 opacity-90">登録は30秒・クレジットカード不要・1,000クレジット進呈</p>
        <div className="mt-6 flex gap-3 justify-center flex-wrap">
          <Link href="/signup?intent=client" className="btn btn-lg bg-white text-moai-primary-900 font-semibold">
            💼 発注者として登録
          </Link>
          <Link href="/signup?intent=worker" className="btn btn-lg bg-moai-primary-800 text-white border border-white/20 font-semibold">
            🎯 受注者として登録
          </Link>
        </div>
      </section>
    </div>
  );
}

function FlowStep({
  step,
  title,
  description,
  actor,
  icon,
  highlight,
}: {
  step: number;
  title: string;
  description: string;
  actor: "発注者" | "受注者" | "プラットフォーム";
  icon: string;
  highlight?: boolean;
}) {
  const actorColor = actor === "発注者"
    ? "bg-blue-50 text-blue-700 border-blue-200"
    : actor === "受注者"
    ? "bg-emerald-50 text-emerald-700 border-emerald-200"
    : "bg-slate-50 text-slate-700 border-slate-200";
  return (
    <li className={`flex items-start gap-4 p-4 rounded-lg ${highlight ? "bg-moai-primary/[0.04] border border-moai-primary/20" : ""}`}>
      <div className="shrink-0 flex flex-col items-center gap-2">
        <span className="flex items-center justify-center h-10 w-10 rounded-full bg-moai-primary text-white font-bold text-sm">
          {step}
        </span>
        <span className="text-3xl" aria-hidden="true">{icon}</span>
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <h3 className="font-semibold text-base">{title}</h3>
          <span className={`text-[10px] font-semibold px-2 py-0.5 rounded border ${actorColor}`}>{actor}</span>
        </div>
        <p className="mt-1.5 text-sm text-moai-muted leading-relaxed">{description}</p>
      </div>
    </li>
  );
}

function FeeExample({ title, rows }: { title: string; rows: { label: string; value: string; strong?: boolean; highlight?: boolean }[] }) {
  return (
    <div className="card">
      <h3 className="font-semibold text-sm mb-3">{title}</h3>
      <dl className="space-y-2 text-sm">
        {rows.map((r, i) => (
          <div
            key={i}
            className={`flex items-center justify-between gap-3 ${
              r.highlight ? "pt-2 border-t border-moai-border font-bold text-moai-primary" : ""
            }`}
          >
            <dt className="text-moai-muted text-xs">{r.label}</dt>
            <dd className={r.strong ? "font-semibold" : ""}>{r.value}</dd>
          </div>
        ))}
      </dl>
    </div>
  );
}

function SafetyCard({ icon, title, text }: { icon: string; title: string; text: string }) {
  return (
    <div className="card">
      <div className="text-2xl mb-2" aria-hidden="true">{icon}</div>
      <h3 className="font-semibold text-base">{title}</h3>
      <p className="mt-2 text-sm text-moai-muted leading-relaxed">{text}</p>
    </div>
  );
}
