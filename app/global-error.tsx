"use client";

/**
 * グローバルエラー境界。
 * 通常のページの error boundary ([slug]/error.tsx) ではキャッチされない、
 * layout / template での例外（Supabase 接続失敗など）を最終的に受け止める。
 *
 * - 真っ白画面を避けてユーザーに状況を伝える
 * - エラー digest を表示して問い合わせ時に伝えやすく
 * - 「再読み込み」「ホームへ」の動線を提供
 */
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="ja">
      <body className="min-h-screen flex items-center justify-center bg-slate-50 p-6">
        <div className="max-w-md w-full bg-white rounded-2xl shadow-sm border border-slate-200 p-8 text-center">
          <div className="text-5xl mb-4" aria-hidden="true">
            😵
          </div>
          <h1 className="text-xl font-bold text-slate-900">
            エラーが発生しました
          </h1>
          <p className="mt-3 text-sm text-slate-600 leading-relaxed">
            申し訳ありません。一時的な問題で画面が表示できませんでした。
            時間をおいて再度お試しください。
          </p>
          {error.digest && (
            <p className="mt-3 text-[11px] text-slate-400 font-mono break-all">
              ID: {error.digest}
            </p>
          )}
          <div className="mt-6 flex flex-col sm:flex-row gap-2 justify-center">
            <button
              type="button"
              onClick={() => reset()}
              className="inline-flex items-center justify-center rounded-md bg-slate-900 text-white px-4 py-2 text-sm font-medium hover:bg-slate-800 transition-colors"
            >
              再読み込み
            </button>
            <a
              href="/"
              className="inline-flex items-center justify-center rounded-md border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors"
            >
              ホームへ
            </a>
          </div>
        </div>
      </body>
    </html>
  );
}
