export const metadata = { title: "プライバシーポリシー | MOAI Crowd" };

export default function PrivacyPage() {
  return (
    <div className="container-app max-w-3xl py-10 space-y-6">
      <h1 className="text-2xl font-bold">プライバシーポリシー</h1>
      <p className="text-xs text-moai-muted">最終更新: 2026年4月21日 / 運営: CODEVISION株式会社</p>

      <section className="prose prose-sm max-w-none space-y-4 text-sm leading-relaxed">
        <p>
          CODEVISION株式会社（以下「当社」）は、「MOAI Crowd」（以下「本サービス」）における
          個人情報の取り扱いについて、以下のとおり定めます。
        </p>

        <h2 className="text-lg font-semibold mt-6">1. 取得する情報</h2>
        <ul className="list-disc pl-5 space-y-1">
          <li>アカウント情報: メールアドレス、表示名、ハンドル、パスワードハッシュ</li>
          <li>プロフィール情報: 自己紹介、スキル、経歴、連絡先（任意）</li>
          <li>取引情報: 案件・応募・契約・メッセージ履歴</li>
          <li>決済情報: 決済IDのみ（カード情報はStripeが保持、当社は保持しません）</li>
          <li>利用ログ: IPアドレス、ブラウザ情報、アクセス日時</li>
        </ul>

        <h2 className="text-lg font-semibold mt-6">2. 利用目的</h2>
        <ul className="list-disc pl-5 space-y-1">
          <li>本サービスの提供・運営</li>
          <li>ユーザーサポート・問い合わせ対応</li>
          <li>不正利用の防止</li>
          <li>サービス改善のための分析</li>
          <li>重要なお知らせ・マーケティング連絡（オプトアウト可）</li>
        </ul>

        <h2 className="text-lg font-semibold mt-6">3. 第三者提供</h2>
        <p>以下の場合を除き、本人の同意なく第三者に個人情報を提供しません:</p>
        <ul className="list-disc pl-5 space-y-1">
          <li>法令に基づく場合</li>
          <li>人の生命・身体の保護のため緊急に必要な場合</li>
          <li>サービス提供に必要な業務委託先への提供（Supabase・Stripe・Resend等）</li>
        </ul>

        <h2 className="text-lg font-semibold mt-6">4. 利用する外部サービス</h2>
        <ul className="list-disc pl-5 space-y-1">
          <li>Supabase（認証・データベース）</li>
          <li>Stripe（決済処理）</li>
          <li>Resend（メール配信）</li>
          <li>LINE Messaging API（LINE通知、連携ユーザーのみ）</li>
          <li>Vercel（ホスティング）</li>
        </ul>

        <h2 className="text-lg font-semibold mt-6">5. Cookie</h2>
        <p>
          本サービスは、認証維持・利便性向上のためCookieを利用します。
          ブラウザ設定でCookieを無効化できますが、その場合一部機能が利用できなくなります。
        </p>

        <h2 className="text-lg font-semibold mt-6">6. ユーザーの権利</h2>
        <p>ユーザーは当社に対し、個人情報の開示・訂正・削除・利用停止を請求できます。<br />
          請求は contact@moai.okinawa までご連絡ください。</p>

        <h2 className="text-lg font-semibold mt-6">7. セキュリティ</h2>
        <p>当社は、個人情報の漏洩・滅失・毀損を防ぐため、必要かつ適切な安全管理措置を講じます。</p>

        <h2 className="text-lg font-semibold mt-6">8. 改定</h2>
        <p>本ポリシーは随時改定される場合があります。重要な変更がある場合、ユーザーに通知します。</p>

        <hr className="my-6" />

        <div className="text-xs text-moai-muted">
          お問い合わせ先: CODEVISION株式会社 個人情報保護管理者<br />
          E-mail: contact@moai.okinawa
        </div>
      </section>
    </div>
  );
}
