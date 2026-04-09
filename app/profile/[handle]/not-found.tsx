import Link from "next/link";

export default function ProfileNotFound() {
  return (
    <div className="container-app py-20 text-center">
      <div className="text-6xl mb-4">👤</div>
      <h2 className="text-xl font-bold mb-2">ユーザーが見つかりません</h2>
      <p className="text-sm text-slate-600 mb-6">このプロフィールは存在しないか、URLが正しくありません。</p>
      <Link href="/workers" className="btn-primary">受注者を探す</Link>
    </div>
  );
}
