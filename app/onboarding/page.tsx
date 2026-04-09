import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { saveStep1, saveStep2, finishOnboarding } from "./actions";

export const dynamic = "force-dynamic";

export default async function OnboardingPage({
  searchParams,
}: { searchParams: Promise<{ step?: string }> }) {
  const { step } = await searchParams;
  const currentStep = Number(step ?? "1");
  const sb = await createClient();
  const { data: { user } } = await sb.auth.getUser();
  if (!user) redirect("/login");
  const { data: profile } = await sb.from("profiles").select("*").eq("id", user.id).single();

  return (
    <div className="container-app py-10 max-w-xl">
      {/* Progress */}
      <div className="mb-8">
        <div className="flex items-center justify-between text-xs text-slate-500 mb-2">
          <span>ステップ {currentStep} / 3</span>
          <span>{Math.round((currentStep / 3) * 100)}%</span>
        </div>
        <div className="h-2 rounded-full bg-slate-100 overflow-hidden">
          <div className="h-full bg-gradient-to-r from-moai-primary to-moai-accent transition-all"
            style={{ width: `${(currentStep / 3) * 100}%` }} />
        </div>
      </div>

      {currentStep === 1 && (
        <form action={saveStep1} className="card animate-slide-up space-y-5">
          <div>
            <h1 className="text-2xl font-bold">はじめまして、ようこそ 👋</h1>
            <p className="mt-2 text-sm text-slate-600">まずはあなたの基本情報を教えてください。</p>
          </div>
          <div>
            <label className="label">表示名 *</label>
            <input name="display_name" required defaultValue={profile?.display_name ?? ""} className="input" placeholder="例: 佐久川 ホタル" />
          </div>
          <div>
            <label className="label">ハンドル名 (URLになります) *</label>
            <div className="flex items-center gap-1">
              <span className="text-sm text-slate-400">@</span>
              <input name="handle" required defaultValue={profile?.handle ?? ""} className="input" placeholder="hotaru" pattern="[a-z0-9_]{3,20}" />
            </div>
          </div>
          <div>
            <label className="label">キャッチコピー (1行・任意)</label>
            <input name="tagline" defaultValue={profile?.tagline ?? ""} className="input" placeholder="例: 沖縄発のWeb職人。AIが得意です" />
          </div>
          <button className="btn-primary btn-lg w-full">次へ →</button>
        </form>
      )}

      {currentStep === 2 && (
        <form action={saveStep2} className="card animate-slide-up space-y-5">
          <div>
            <h1 className="text-2xl font-bold">あなたについて教えてください 💬</h1>
            <p className="mt-2 text-sm text-slate-600">スキルや得意分野を入力するとマッチング精度が上がります。</p>
          </div>
          <div>
            <label className="label">どちらの立場で利用しますか？</label>
            <div className="grid grid-cols-3 gap-2">
              {[
                { v: "both", icon: "🤝", label: "両方" },
                { v: "worker_only", icon: "💪", label: "受注のみ" },
                { v: "client_only", icon: "💼", label: "発注のみ" },
              ].map((r) => (
                <label key={r.v} className="cursor-pointer">
                  <input type="radio" name="role" value={r.v} defaultChecked={r.v === "both"} className="peer sr-only" />
                  <div className="card-flat border-2 border-slate-200 peer-checked:border-moai-primary peer-checked:bg-moai-primary/5 text-center p-3">
                    <div className="text-2xl">{r.icon}</div>
                    <div className="mt-1 text-xs font-medium">{r.label}</div>
                  </div>
                </label>
              ))}
            </div>
          </div>
          <div>
            <label className="label">スキル (カンマ区切り)</label>
            <input name="skills" defaultValue={profile?.skills?.join(", ") ?? ""} className="input" placeholder="React, Figma, SEO, ライティング" />
          </div>
          <div>
            <label className="label">自己紹介 (任意)</label>
            <textarea name="bio" rows={5} defaultValue={profile?.bio ?? ""} className="input" placeholder="あなたの強み・経験・好きなことを書いてみましょう" />
          </div>
          <div className="flex gap-2">
            <Link href="/onboarding?step=1" className="btn-outline">戻る</Link>
            <button className="btn-primary btn-lg flex-1">次へ →</button>
          </div>
        </form>
      )}

      {currentStep === 3 && (
        <div className="card animate-slide-up space-y-6 text-center">
          <div className="text-6xl">🎉</div>
          <div>
            <h1 className="text-2xl font-bold">準備完了です！</h1>
            <p className="mt-2 text-sm text-slate-600">
              MOAI Crowdへようこそ。<br />
              あなたの登録で「ようこそバッジ」を獲得しました。
            </p>
          </div>
          <div className="grid grid-cols-3 gap-3 text-left">
            <Link href="/jobs" className="card-hover text-center py-4">
              <div className="text-3xl">🔍</div>
              <div className="mt-2 text-xs font-semibold">案件を探す</div>
            </Link>
            <Link href="/jobs/new" className="card-hover text-center py-4">
              <div className="text-3xl">📝</div>
              <div className="mt-2 text-xs font-semibold">案件を依頼</div>
            </Link>
            <Link href="/profile/edit" className="card-hover text-center py-4">
              <div className="text-3xl">✨</div>
              <div className="mt-2 text-xs font-semibold">プロフィール充実</div>
            </Link>
          </div>
          <form action={finishOnboarding}>
            <button className="btn-primary btn-lg w-full">マイページへ →</button>
          </form>
        </div>
      )}
    </div>
  );
}
