export const metadata = { title: "特定商取引法に基づく表記 | MOAI Crowd" };

export default function TokushohoPage() {
  return (
    <div className="container-app max-w-3xl py-10 space-y-6">
      <h1 className="text-2xl font-bold">特定商取引法に基づく表記</h1>
      <p className="text-xs text-moai-muted">最終更新: 2026年5月6日</p>

      <div className="card overflow-hidden p-0">
        <table className="w-full text-sm">
          <tbody className="divide-y divide-moai-border">
            <Row label="販売事業者名" value="株式会社CODEVISION" />
            <Row label="代表者名" value="佐久川 凌" />
            <Row
              label="所在地"
              value={
                <>
                  〒905-0214 沖縄県国頭郡本部町
                  <br />
                  <span className="text-xs text-moai-muted">※詳細住所はご請求があった場合に遅滞なく開示いたします</span>
                </>
              }
            />
            <Row
              label="連絡先"
              value={
                <>
                  メール: codevision.okinawa@gmail.com
                  <br />
                  <span className="text-xs text-moai-muted">※電話番号はご請求があった場合に遅滞なく開示いたします（受付時間 平日 10:00–18:00）</span>
                </>
              }
            />
            <Row
              label="販売価格"
              value={
                <>
                  各案件ページに表示される金額（税込）
                  <br />
                  <span className="text-xs text-moai-muted">案件ごとに発注者が設定。応募・契約時に確定</span>
                </>
              }
            />
            <Row
              label="サービス利用料（手数料）"
              value={
                <ul className="list-disc pl-5 space-y-1">
                  <li>受注者: MOAIスクール在校生 0% / 卒業生 5%（生涯適用） / 一般 15%</li>
                  <li>発注者: ローンチ期間（〜2026年10月） 0% / 2026年11月〜 4%</li>
                  <li>キャンペーン手数料モード: 5% / 7% / 10%（運営判断で適用）</li>
                </ul>
              }
            />
            <Row
              label="商品代金以外の必要料金"
              value={
                <ul className="list-disc pl-5 space-y-1">
                  <li>消費税（表示価格に含む）</li>
                  <li>振込手数料（受注者の銀行口座への送金時、Stripe 規定に基づき差し引き）</li>
                  <li>インターネット接続料金・通信料はユーザー負担</li>
                </ul>
              }
            />
            <Row
              label="支払方法"
              value={
                <ul className="list-disc pl-5 space-y-1">
                  <li>クレジットカード決済（Visa / Mastercard / JCB / American Express / Diners）</li>
                  <li>決済代行: Stripe Payments Japan, K.K.</li>
                  <li>エスクロー決済: 入金後 Stripe にて一時保管、検収完了後に受注者へ送金</li>
                </ul>
              }
            />
            <Row
              label="支払時期"
              value={
                <ul className="list-disc pl-5 space-y-1">
                  <li>発注者: 案件契約成立時に与信、納品検収完了時に確定課金</li>
                  <li>受注者: 検収完了後、Stripe Connect により登録銀行口座へ送金（通常 1〜3営業日）</li>
                </ul>
              }
            />
            <Row
              label="サービス引渡時期"
              value={
                <>
                  各案件で発注者と受注者が合意した納期に従い、受注者が成果物を納品します。
                  <br />
                  <span className="text-xs text-moai-muted">プラットフォーム側のアカウント有効化はクレジットカード決済完了後 即時</span>
                </>
              }
            />
            <Row
              label="返品・キャンセル"
              value={
                <ul className="list-disc pl-5 space-y-1">
                  <li>役務提供開始前: 発注者・受注者の合意により無償キャンセル可能（手数料返還）</li>
                  <li>役務提供開始後: 双方協議のうえ、進捗に応じた金額で精算</li>
                  <li>納品物の品質に重大な不備がある場合: 修正対応または返金（個別審査）</li>
                  <li>サービス利用料は原則として返金不可（成立後の取引手数料）</li>
                </ul>
              }
            />
            <Row
              label="動作環境"
              value={
                <ul className="list-disc pl-5 space-y-1">
                  <li>ブラウザ: 最新版の Chrome / Safari / Firefox / Edge</li>
                  <li>OS: 各ブラウザの推奨環境</li>
                  <li>JavaScript および Cookie が有効であること</li>
                </ul>
              }
            />
          </tbody>
        </table>
      </div>

      <div className="text-xs text-moai-muted leading-relaxed">
        <p>
          本表記は特定商取引に関する法律 第11条 に基づき記載しています。
          詳細な利用条件は <a href="/legal/terms" className="text-moai-primary underline">利用規約</a> および
          {" "}<a href="/legal/privacy" className="text-moai-primary underline">プライバシーポリシー</a> をご確認ください。
        </p>
      </div>
    </div>
  );
}

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <tr className="grid grid-cols-1 md:grid-cols-[10rem_minmax(0,1fr)]">
      <th className="bg-moai-cloud/40 text-left text-xs font-semibold text-moai-muted uppercase tracking-wider p-3 md:p-4 align-top">
        {label}
      </th>
      <td className="text-sm text-moai-ink p-3 md:p-4 leading-relaxed">{value}</td>
    </tr>
  );
}
