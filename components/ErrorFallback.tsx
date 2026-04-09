"use client";

export default function ErrorFallback({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="container-app py-20 text-center">
      <div className="text-6xl mb-4">😵</div>
      <h2 className="text-xl font-bold mb-2">エラーが発生しました</h2>
      <p className="text-sm text-slate-600 mb-6 max-w-md mx-auto">
        {error.message || "予期しないエラーが発生しました。もう一度お試しください。"}
      </p>
      <button onClick={reset} className="btn-primary">
        再読み込み
      </button>
    </div>
  );
}
