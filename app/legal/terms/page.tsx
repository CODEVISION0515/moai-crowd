export const metadata = { title: "利用規約 | MOAI Crowd" };

export default function TermsPage() {
  return (
    <div className="container-app max-w-3xl py-10 space-y-6">
      <h1 className="text-2xl font-bold">利用規約</h1>
      <p className="text-xs text-moai-muted">最終更新: 2026年4月21日 / 運営: 株式会社CODEVISION</p>

      <section className="prose prose-sm max-w-none space-y-4 text-sm leading-relaxed">
        <p>
          本規約は、株式会社CODEVISION（以下「当社」）が提供する
          クラウドソーシングサービス「MOAI Crowd」（以下「本サービス」）の利用条件を定めるものです。
          本サービスをご利用いただく場合、本規約に同意いただいたものとみなします。
        </p>

        <h2 className="text-lg font-semibold mt-6">第1条（適用）</h2>
        <p>本規約は、ユーザーと当社との間の本サービスの利用に関わる一切の関係に適用されます。</p>

        <h2 className="text-lg font-semibold mt-6">第2条（アカウント登録）</h2>
        <ul className="list-disc pl-5 space-y-1">
          <li>登録は満18歳以上の方に限ります。</li>
          <li>虚偽の情報による登録、他人のなりすましは禁止します。</li>
          <li>アカウント情報の管理はユーザーの責任で行ってください。</li>
        </ul>

        <h2 className="text-lg font-semibold mt-6">第3条（手数料）</h2>
        <ul className="list-disc pl-5 space-y-1">
          <li>受注者: 在校生0% / 卒業生5%生涯 / 一般15%</li>
          <li>発注者: ローンチ6ヶ月 0% / 2026年11月以降 4%</li>
          <li>手数料は取引確定時に自動で控除されます。</li>
        </ul>

        <h2 className="text-lg font-semibold mt-6">第4条（エスクロー決済）</h2>
        <p>
          発注者は案件受託時に契約金額を当社の決済パートナー（Stripe）を経由して前払いします。
          成果物承認後、受注者に送金されます。
        </p>

        <h2 className="text-lg font-semibold mt-6">第5条（禁止事項）</h2>
        <ul className="list-disc pl-5 space-y-1">
          <li>法令・公序良俗に違反する行為</li>
          <li>他のユーザーへのハラスメント・差別</li>
          <li>本サービス外での直接取引の勧誘（手数料回避行為）</li>
          <li>虚偽の成果物提出・なりすまし</li>
          <li>当社の事前承諾なき商用利用・データ収集</li>
        </ul>

        <h2 className="text-lg font-semibold mt-6">第6条（免責事項）</h2>
        <p>
          当社は、ユーザー間の取引の成立・履行・内容の品質について一切の責任を負いません。
          ただし、不正・詐欺等の疑いがある場合、当社は返金処理・アカウント停止等の措置を取ることができます。
        </p>

        <h2 className="text-lg font-semibold mt-6">第7条（サービスの変更・停止）</h2>
        <p>当社は、ユーザーへ事前に通知することなく本サービスの内容を変更または停止できます。</p>

        <h2 className="text-lg font-semibold mt-6">第8条（規約の変更）</h2>
        <p>
          当社は本規約を随時改定できます。重要な改定がある場合、メールまたはアプリ内通知でお知らせします。
        </p>

        <h2 className="text-lg font-semibold mt-6">第9条（準拠法・管轄）</h2>
        <p>本規約は日本法に準拠し、本サービスに関する紛争は那覇地方裁判所を第一審の専属的合意管轄裁判所とします。</p>

        <hr className="my-6" />

        <p className="text-xs text-moai-muted">
          本規約に関するお問い合わせ: contact@moai.okinawa
        </p>
      </section>
    </div>
  );
}
