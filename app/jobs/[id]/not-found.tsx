import Link from "next/link";

export default function JobNotFound() {
  return (
    <div className="container-app py-20 text-center">
      <div className="text-6xl mb-4">🔍</div>
      <h2 className="text-xl font-bold mb-2">案件が見つかりません</h2>
      <p className="text-sm text-slate-600 mb-6">この案件は削除されたか、URLが正しくありません。</p>
      <Link href="/jobs" className="btn-primary">案件一覧に戻る</Link>
    </div>
  );
}
