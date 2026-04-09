import Link from "next/link";

export default function ContractNotFound() {
  return (
    <div className="container-app py-20 text-center">
      <div className="text-6xl mb-4">📄</div>
      <h2 className="text-xl font-bold mb-2">契約が見つかりません</h2>
      <p className="text-sm text-slate-600 mb-6">この契約は存在しないか、アクセス権がありません。</p>
      <Link href="/dashboard" className="btn-primary">ダッシュボードに戻る</Link>
    </div>
  );
}
