import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { saveStep1, saveStep2, finishOnboarding } from "./actions";
import StepForm from "./StepForm";

export const dynamic = "force-dynamic";

const STEP_LABELS = ["基本情報", "プロフィール", "完了"];

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
    <div className="container-app py-10 max-w-xl pb-nav">
      {/* Progress */}
      <div className="mb-10">
        <div className="flex items-center justify-between mb-3">
          {STEP_LABELS.map((label, i) => {
            const stepNum = i + 1;
            const done = stepNum < currentStep;
            const active = stepNum === currentStep;
            return (
              <div key={label} className="flex items-center gap-2">
                <div className={`flex items-center justify-center h-7 w-7 rounded-full text-xs font-bold transition-colors ${
                  done ? "bg-moai-primary text-white" : active ? "bg-moai-primary text-white" : "bg-slate-100 text-moai-muted"
                }`}>
                  {done ? (
                    <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>
                  ) : stepNum}
                </div>
                <span className={`text-xs font-medium hidden sm:block ${active ? "text-moai-ink" : "text-moai-muted"}`}>{label}</span>
              </div>
            );
          })}
        </div>
        <div className="progress-bar">
          <div className="progress-bar-fill" style={{ width: `${(currentStep / 3) * 100}%` }} />
        </div>
      </div>

      {currentStep === 1 && (
        <StepForm action={saveStep1} className="card animate-slide-up space-y-5">
          <div>
            <h1 className="text-2xl font-bold">はじめまして、ようこそ</h1>
            <p className="mt-2 text-sm text-moai-muted">まずはあなたの基本情報を教えてください。</p>
          </div>
          <div>
            <label className="label">表示名 *</label>
            <input name="display_name" required defaultValue={profile?.display_name ?? ""} className="input" placeholder="例: 佐久川 ホタル" />
          </div>
          <div>
            <label className="label">ハンドル名 (URLになります) *</label>
            <div className="flex items-center gap-1.5 bg-moai-cloud rounded-lg px-3">
              <span className="text-sm text-moai-muted font-medium">@</span>
              <input name="handle" required defaultValue={profile?.handle ?? ""} className="input border-0 bg-transparent px-0 focus:ring-0" placeholder="hotaru" pattern="[a-z0-9_]{3,20}" />
            </div>
            <p className="text-[11px] text-moai-muted mt-1">英数字・アンダースコア、3〜20文字</p>
          </div>
          <div>
            <label className="label">キャッチコピー (1行・任意)</label>
            <input name="tagline" defaultValue={profile?.tagline ?? ""} className="input" placeholder="例: 沖縄発のWeb職人。AIが得意です" />
          </div>
          <button className="btn-accent btn-lg w-full">
            次へ
            <svg className="h-4 w-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5-5 5" /></svg>
          </button>
        </StepForm>
      )}

      {currentStep === 2 && (
        <StepForm action={saveStep2} className="card animate-slide-up space-y-5">
          <div>
            <h1 className="text-2xl font-bold">もう少し教えてください</h1>
            <p className="mt-2 text-sm text-moai-muted">スキルや得意分野を入力するとマッチング精度が上がります。</p>
          </div>
          <div>
            <label className="label">どちらの立場で利用しますか？</label>
            <div className="grid grid-cols-3 gap-2">
              {[
                { v: "both", icon: "🤝", label: "両方", desc: "発注も受注も" },
                { v: "worker_only", icon: "💪", label: "受注のみ", desc: "仕事を受ける" },
                { v: "client_only", icon: "💼", label: "発注のみ", desc: "仕事を頼む" },
              ].map((r) => (
                <label key={r.v} className="cursor-pointer">
                  <input type="radio" name="role" value={r.v} defaultChecked={r.v === "both"} className="peer sr-only" />
                  <div className="card-flat border-2 border-moai-border rounded-xl peer-checked:border-moai-primary peer-checked:bg-moai-primary/5 text-center p-4 transition-all hover:border-slate-300">
                    <div className="text-2xl">{r.icon}</div>
                    <div className="mt-1.5 text-xs font-semibold">{r.label}</div>
                    <div className="text-[10px] text-moai-muted mt-0.5">{r.desc}</div>
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
            <Link href="/onboarding?step=1" className="btn-outline btn-lg">戻る</Link>
            <button className="btn-accent btn-lg flex-1">
              次へ
              <svg className="h-4 w-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5-5 5" /></svg>
            </button>
          </div>
        </StepForm>
      )}

      {currentStep === 3 && (
        <div className="card animate-scale-in space-y-6 text-center">
          <div className="text-6xl animate-bounce-subtle">🎉</div>
          <div>
            <h1 className="text-2xl font-bold">準備完了です！</h1>
            <p className="mt-2 text-sm text-moai-muted">
              MOAI Crowdへようこそ。<br />
              「ようこそバッジ」と1,000クレジットを獲得しました。
            </p>
          </div>
          <div className="grid grid-cols-3 gap-3 text-left">
            {[
              { href: "/jobs", icon: "🔍", label: "案件を探す" },
              { href: "/jobs/new", icon: "📝", label: "案件を依頼" },
              { href: "/profile/edit", icon: "✨", label: "プロフィール充実" },
            ].map((a) => (
              <Link key={a.href} href={a.href} className="card-interactive text-center py-5 hover:border-moai-primary/30">
                <div className="text-3xl">{a.icon}</div>
                <div className="mt-2 text-xs font-semibold">{a.label}</div>
              </Link>
            ))}
          </div>
          <form action={finishOnboarding}>
            <button className="btn-accent btn-lg w-full">マイページへ</button>
          </form>
        </div>
      )}
    </div>
  );
}
