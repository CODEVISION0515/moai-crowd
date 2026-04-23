import { redirect } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import LineLink from "@/components/LineLink";
import AvatarUpload from "@/components/AvatarUpload";
import { ToastForm } from "@/components/ToastForm";
import { FieldError } from "@/components/FieldError";
import { FieldInput } from "@/components/Field";
import ProfileCoach from "./ProfileCoach";
import {
  updateBasic, updateSocial, updateBusiness,
  addPortfolio, deletePortfolio,
  addWorkExp, deleteWorkExp,
  addEducation, deleteEducation,
  addCertification, deleteCertification,
} from "./actions";

export const dynamic = "force-dynamic";

export default async function ProfileEditPage() {
  const sb = await createClient();
  const { data: { user } } = await sb.auth.getUser();
  if (!user) redirect("/login");

  const [{ data: profile }, { data: portfolios }, { data: workExps }, { data: educations }, { data: certs }] = await Promise.all([
    sb.from("profiles").select("*").eq("id", user.id).single(),
    sb.from("portfolios").select("*").eq("user_id", user.id).order("sort_order").order("created_at", { ascending: false }),
    sb.from("work_experiences").select("*").eq("user_id", user.id).order("start_date", { ascending: false }),
    sb.from("educations").select("*").eq("user_id", user.id).order("start_date", { ascending: false }),
    sb.from("certifications").select("*").eq("user_id", user.id).order("issued_date", { ascending: false }),
  ]);

  return (
    <div className="mx-auto max-w-3xl px-4 py-10 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">プロフィール編集</h1>
        <Link href={`/profile/${profile?.handle}`} className="btn-outline">プロフィールを見る</Link>
      </div>

      {/* 完成度メーター */}
      <div className="card bg-gradient-to-br from-moai-primary/10 to-moai-accent/10">
        <div className="flex items-center justify-between mb-2">
          <h3 className="font-semibold">プロフィール完成度</h3>
          <span className="text-2xl font-bold text-moai-primary">{profile?.profile_completion ?? 0}%</span>
        </div>
        <div className="h-3 rounded-full bg-white overflow-hidden">
          <div className="h-full bg-gradient-to-r from-moai-primary to-moai-accent transition-all"
            style={{ width: `${profile?.profile_completion ?? 0}%` }} />
        </div>
        <p className="mt-2 text-xs text-slate-600">100%にすると「プロフィール達人」バッジ獲得 · 受注率が大幅UP</p>
      </div>

      <ProfileCoach />

      {/* アイコン */}
      <section className="card">
        <h2 className="font-semibold mb-4">アイコン画像</h2>
        <AvatarUpload userId={user.id} currentUrl={profile?.avatar_url ?? null} displayName={profile?.display_name ?? "?"} />
      </section>

      {/* 基本情報 */}
      <ToastForm action={updateBasic} className="card space-y-4" noValidate>
        <h2 className="font-semibold">基本情報</h2>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label htmlFor="display_name" className="label">表示名 <span className="text-red-500">*</span></label>
            <FieldInput
              id="display_name"
              name="display_name"
              required
              maxLength={50}
              defaultValue={profile?.display_name ?? ""}
            />
            <FieldError name="display_name" />
          </div>
          <div>
            <label htmlFor="handle" className="label">ハンドル <span className="text-red-500">*</span></label>
            <FieldInput
              id="handle"
              name="handle"
              required
              defaultValue={profile?.handle ?? ""}
            />
            <FieldError name="handle" />
            <p id="handle-hint" className="mt-1 text-xs text-moai-muted">英小文字・数字・_の3〜20文字</p>
          </div>
        </div>
        <div>
          <label className="label">キャッチコピー (1行)</label>
          <input name="tagline" defaultValue={profile?.tagline ?? ""} className="input" placeholder="例: 沖縄発のWeb職人。SaaS開発が得意です" />
        </div>
        <div>
          <label className="label">自己紹介 (Markdown可)</label>
          <textarea name="bio" rows={6} defaultValue={profile?.bio ?? ""} className="input" />
        </div>
        <div>
          <label className="label">スキル (カンマ区切り)</label>
          <input name="skills" defaultValue={profile?.skills?.join(", ") ?? ""} className="input" placeholder="React, Figma, SEO" />
        </div>
        <div className="grid grid-cols-3 gap-4">
          <div>
            <label className="label">時給 (円)</label>
            <input name="hourly_rate" type="number" defaultValue={profile?.hourly_rate_jpy ?? ""} className="input" />
          </div>
          <div>
            <label className="label">経験年数</label>
            <input name="years_experience" type="number" defaultValue={profile?.years_experience ?? ""} className="input" />
          </div>
          <div>
            <label className="label">拠点</label>
            <input name="location" defaultValue={profile?.location ?? ""} className="input" placeholder="沖縄県本部町" />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="label">言語 (カンマ区切り)</label>
            <input name="languages" defaultValue={profile?.languages?.join(", ") ?? ""} className="input" placeholder="日本語(ネイティブ), 英語(ビジネス)" />
          </div>
          <div>
            <label className="label">対応エリア</label>
            <input name="service_areas" defaultValue={profile?.service_areas?.join(", ") ?? ""} className="input" placeholder="沖縄県内, 全国オンライン" />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="label">稼働状態</label>
            <select name="availability" defaultValue={profile?.availability ?? "available"} className="input">
              <option value="available">🟢 受注可能</option>
              <option value="limited">🟡 一部受注可</option>
              <option value="busy">🟠 多忙</option>
              <option value="unavailable">⚫ 受注停止</option>
            </select>
          </div>
          <div>
            <label className="label">対応時間帯</label>
            <input name="work_hours" defaultValue={profile?.work_hours ?? ""} className="input" placeholder="平日9-18時 / 週末対応可" />
          </div>
        </div>

        {/* MOAI エコシステム関連 */}
        <div className="pt-4 border-t border-moai-border space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="github_username" className="label">GitHub ユーザー名</label>
              <input
                id="github_username"
                name="github_username"
                defaultValue={profile?.github_username ?? ""}
                className="input"
                placeholder="your-username"
              />
              <p className="mt-1 text-xs text-moai-muted">公開ポートフォリオでGitHub実績を表示</p>
            </div>
            <div>
              <label htmlFor="region" className="label">活動エリア</label>
              <select id="region" name="region" defaultValue={profile?.region ?? ""} className="input">
                <option value="">指定なし</option>
                <option value="okinawa">沖縄</option>
                <option value="fukuoka">福岡</option>
                <option value="other">その他</option>
              </select>
            </div>
          </div>
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              name="moai_badge_display"
              defaultChecked={profile?.moai_badge_display ?? true}
              className="h-4 w-4"
            />
            <span>プロフィールにMOAIバッジ（在校生／卒業生／講師）を表示する</span>
          </label>
          {(profile?.crowd_role === "student" || profile?.crowd_role === "alumni") && (
            <p className="text-xs text-moai-muted">
              現在のMOAIロール: <strong>{profile.crowd_role === "alumni" ? "🎓 卒業生" : "🌱 在校生"}</strong>
              {profile.cohort ? `（第${profile.cohort}期）` : ""}
              {profile.graduation_date ? ` / 卒業予定日: ${profile.graduation_date}` : ""}
              <span className="block mt-0.5">※ ロール・期・卒業日の変更は管理者にお問い合わせください。</span>
            </p>
          )}
        </div>

        <button className="btn-primary">基本情報を保存</button>
      </ToastForm>

      {/* 法人 / 個人 区分 */}
      <ToastForm action={updateBusiness} className="card space-y-4">
        <div>
          <h2 className="font-semibold flex items-center gap-2">
            <span aria-hidden="true">{profile?.account_type === "corporate" ? "🏢" : "👤"}</span>
            法人 / 個人の区分
          </h2>
          <p className="mt-1 text-xs text-moai-muted">
            後から変更できます。法人として請求書を発行する場合、会社名などの詳細情報も入力してください。
          </p>
        </div>

        <div className="grid grid-cols-2 gap-2">
          {[
            { v: "individual", icon: "👤", label: "個人", desc: "フリーランス・副業" },
            { v: "corporate", icon: "🏢", label: "法人", desc: "会社・団体として" },
          ].map((r) => (
            <label key={r.v} className="cursor-pointer">
              <input
                type="radio"
                name="account_type"
                value={r.v}
                defaultChecked={(profile?.account_type ?? "individual") === r.v}
                className="peer sr-only"
              />
              <div className="card-flat border-2 border-moai-border rounded-xl peer-checked:border-moai-primary peer-checked:bg-moai-primary/5 text-center p-4 transition-all hover:border-slate-300">
                <div className="text-2xl" aria-hidden="true">{r.icon}</div>
                <div className="mt-1 text-sm font-semibold">{r.label}</div>
                <div className="text-[10px] text-moai-muted mt-0.5">{r.desc}</div>
              </div>
            </label>
          ))}
        </div>

        <details open={profile?.account_type === "corporate"} className="border border-moai-border rounded-lg">
          <summary className="cursor-pointer px-3 py-2.5 text-sm font-medium text-moai-ink hover:bg-moai-cloud/40">
            法人情報 <span className="text-[10px] text-moai-muted">(任意・後から入力可能)</span>
          </summary>
          <div className="p-3 space-y-3 border-t border-moai-border">
            <div>
              <label className="label">会社名・屋号</label>
              <input
                name="company_name"
                defaultValue={profile?.company_name ?? ""}
                className="input"
                placeholder="例: 株式会社CODEVISION"
              />
            </div>
            <div>
              <label className="label">登記住所または本社所在地</label>
              <input
                name="company_address"
                defaultValue={profile?.company_address ?? ""}
                className="input"
                placeholder="沖縄県本部町..."
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="label">代表者名</label>
                <input
                  name="representative_name"
                  defaultValue={profile?.representative_name ?? ""}
                  className="input"
                  placeholder="山田 太郎"
                />
              </div>
              <div>
                <label className="label">
                  インボイス登録番号
                  <span className="text-[10px] text-moai-muted ml-1">(T+13桁)</span>
                </label>
                <input
                  name="invoice_registration_number"
                  defaultValue={profile?.invoice_registration_number ?? ""}
                  className="input"
                  placeholder="T1234567890123"
                  pattern="^T[0-9]{13}$"
                />
              </div>
            </div>
            <p className="text-[11px] text-moai-muted">
              ※ これらの情報は請求書発行時や発注者として法人名義で取引する際に使用されます。
            </p>
          </div>
        </details>

        <button className="btn-primary">法人/個人区分を保存</button>
      </ToastForm>

      {/* SNS */}
      <ToastForm action={updateSocial} className="card space-y-4">
        <h2 className="font-semibold">SNS・連絡手段</h2>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="label">X (旧Twitter)</label>
            <input name="twitter" defaultValue={profile?.twitter_handle ?? ""} className="input" placeholder="@yourhandle" />
          </div>
          <div>
            <label className="label">Instagram</label>
            <input name="instagram" defaultValue={profile?.instagram_handle ?? ""} className="input" placeholder="@yourhandle" />
          </div>
          <div>
            <label className="label">GitHub</label>
            <input name="github" defaultValue={profile?.github_handle ?? ""} className="input" placeholder="username" />
          </div>
          <div>
            <label className="label">LinkedIn</label>
            <input name="linkedin" type="url" defaultValue={profile?.linkedin_url ?? ""} className="input" />
          </div>
          <div>
            <label className="label">Behance</label>
            <input name="behance" type="url" defaultValue={profile?.behance_url ?? ""} className="input" />
          </div>
          <div>
            <label className="label">YouTube</label>
            <input name="youtube" type="url" defaultValue={profile?.youtube_url ?? ""} className="input" />
          </div>
          <div>
            <label className="label">TikTok</label>
            <input name="tiktok" defaultValue={profile?.tiktok_handle ?? ""} className="input" />
          </div>
          <div>
            <label className="label">Webサイト</label>
            <input name="website" type="url" defaultValue={profile?.website ?? ""} className="input" />
          </div>
        </div>
        <button className="btn-primary">SNSを保存</button>
      </ToastForm>

      {/* ポートフォリオ */}
      <section className="card">
        <h2 className="font-semibold mb-4">ポートフォリオ ({portfolios?.length ?? 0})</h2>
        <div className="space-y-3 mb-4">
          {portfolios?.map((p) => (
            <div key={p.id} className="border border-slate-200 rounded-lg p-3 flex gap-3">
              {p.image_url && (
                <div className="relative h-20 w-20 rounded overflow-hidden bg-moai-cloud shrink-0">
                  <Image src={p.image_url} alt={p.title ?? "ポートフォリオ画像"} fill sizes="80px" className="object-cover" />
                </div>
              )}
              <div className="flex-1 min-w-0">
                <div className="font-semibold">{p.title}</div>
                <div className="text-xs text-slate-500 line-clamp-2">{p.description}</div>
                {p.external_url && <a href={p.external_url} target="_blank" className="text-xs text-moai-primary hover:underline">{p.external_url}</a>}
              </div>
              <form action={deletePortfolio}>
                <input type="hidden" name="id" value={p.id} />
                <button className="text-xs text-red-500 hover:underline">削除</button>
              </form>
            </div>
          ))}
        </div>
        <details>
          <summary className="cursor-pointer text-sm text-moai-primary">+ 作品を追加</summary>
          <form action={addPortfolio} className="mt-3 space-y-3 border-t border-slate-200 pt-3">
            <input name="title" required className="input" placeholder="作品タイトル *" />
            <textarea name="description" rows={3} className="input" placeholder="説明" />
            <input name="image_url" type="url" className="input" placeholder="画像URL" />
            <input name="external_url" type="url" className="input" placeholder="作品URL (公開先)" />
            <input name="tags" className="input" placeholder="タグ (カンマ区切り)" />
            <div className="grid grid-cols-2 gap-3">
              <input name="client_name" className="input" placeholder="クライアント名" />
              <input name="completed_at" type="date" className="input" />
            </div>

            {/* MOAIスクール作品 */}
            <div className="rounded-lg border border-moai-primary/20 bg-moai-primary/[0.03] p-3 space-y-3">
              <label className="flex items-start gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  name="is_school_work"
                  className="mt-0.5 h-4 w-4 rounded border-slate-300 text-moai-primary focus:ring-moai-primary"
                />
                <div>
                  <div className="text-sm font-medium">🎓 MOAIスクールで制作した作品</div>
                  <div className="text-[11px] text-moai-muted mt-0.5">
                    チェックすると /school/gallery や期の卒業発表ページに掲載され、発注者の目にとまりやすくなります
                  </div>
                </div>
              </label>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="label text-[11px]">期</label>
                  <input name="cohort" type="number" min="1" className="input text-sm" placeholder="例: 1" />
                </div>
                <div>
                  <label className="label text-[11px]">課題・プロジェクト名</label>
                  <input
                    name="school_project_name"
                    className="input text-sm"
                    placeholder="例: 第1週目課題、卒業制作"
                  />
                </div>
              </div>
            </div>

            <button className="btn-primary">追加</button>
          </form>
        </details>
      </section>

      {/* 職歴 */}
      <section className="card">
        <h2 className="font-semibold mb-4">職歴</h2>
        <div className="space-y-3 mb-4">
          {workExps?.map((w) => (
            <div key={w.id} className="border-l-2 border-moai-primary pl-3">
              <div className="font-semibold">{w.title} @ {w.company}</div>
              <div className="text-xs text-slate-500">{w.start_date} 〜 {w.is_current ? "現在" : w.end_date}</div>
              {w.description && <p className="text-sm mt-1">{w.description}</p>}
              <form action={deleteWorkExp}>
                <input type="hidden" name="id" value={w.id} />
                <button className="text-xs text-red-500 hover:underline">削除</button>
              </form>
            </div>
          ))}
        </div>
        <details>
          <summary className="cursor-pointer text-sm text-moai-primary">+ 職歴を追加</summary>
          <form action={addWorkExp} className="mt-3 space-y-3 border-t border-slate-200 pt-3">
            <input name="company" required className="input" placeholder="会社名 *" />
            <input name="title" required className="input" placeholder="役職 *" />
            <textarea name="description" rows={3} className="input" placeholder="業務内容" />
            <div className="grid grid-cols-2 gap-3">
              <input name="start_date" type="date" required className="input" />
              <input name="end_date" type="date" className="input" />
            </div>
            <label className="text-sm flex items-center gap-2"><input name="is_current" type="checkbox" /> 現職</label>
            <button className="btn-primary">追加</button>
          </form>
        </details>
      </section>

      {/* 学歴 */}
      <section className="card">
        <h2 className="font-semibold mb-4">学歴</h2>
        <div className="space-y-3 mb-4">
          {educations?.map((e) => (
            <div key={e.id} className="border-l-2 border-moai-accent pl-3">
              <div className="font-semibold">{e.school}</div>
              <div className="text-xs text-slate-500">{e.degree} {e.field} · {e.start_date} 〜 {e.end_date}</div>
              <form action={deleteEducation}>
                <input type="hidden" name="id" value={e.id} />
                <button className="text-xs text-red-500 hover:underline">削除</button>
              </form>
            </div>
          ))}
        </div>
        <details>
          <summary className="cursor-pointer text-sm text-moai-primary">+ 学歴を追加</summary>
          <form action={addEducation} className="mt-3 space-y-3 border-t border-slate-200 pt-3">
            <input name="school" required className="input" placeholder="学校名 *" />
            <div className="grid grid-cols-2 gap-3">
              <input name="degree" className="input" placeholder="学位/学科" />
              <input name="field" className="input" placeholder="専攻" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <input name="start_date" type="date" className="input" />
              <input name="end_date" type="date" className="input" />
            </div>
            <button className="btn-primary">追加</button>
          </form>
        </details>
      </section>

      {/* 資格 */}
      <section className="card">
        <h2 className="font-semibold mb-4">資格・認定</h2>
        <div className="space-y-2 mb-4">
          {certs?.map((c) => (
            <div key={c.id} className="flex items-center justify-between text-sm">
              <div>
                <span className="font-semibold">{c.name}</span>
                {c.issuer && <span className="text-slate-500"> · {c.issuer}</span>}
                {c.issued_date && <span className="text-xs text-slate-400 ml-2">{c.issued_date}</span>}
              </div>
              <form action={deleteCertification}>
                <input type="hidden" name="id" value={c.id} />
                <button className="text-xs text-red-500 hover:underline">削除</button>
              </form>
            </div>
          ))}
        </div>
        <details>
          <summary className="cursor-pointer text-sm text-moai-primary">+ 資格を追加</summary>
          <form action={addCertification} className="mt-3 space-y-3 border-t border-slate-200 pt-3">
            <input name="name" required className="input" placeholder="資格名 *" />
            <input name="issuer" className="input" placeholder="発行団体" />
            <input name="issued_date" type="date" className="input" />
            <input name="credential_url" type="url" className="input" placeholder="認定URL" />
            <button className="btn-primary">追加</button>
          </form>
        </details>
      </section>

      {/* 振込先口座（Stripe Connect）は /bank-setup ページへ誘導 */}
      <section className="card">
        <div className="flex items-start gap-4">
          <div
            className="shrink-0 h-12 w-12 rounded-full bg-moai-cloud flex items-center justify-center text-2xl"
            aria-hidden="true"
          >
            🏦
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold">振込先口座（報酬の受け取り）</h3>
            {profile?.stripe_account_id ? (
              <p className="mt-1 text-sm text-moai-muted">
                登録済み。状態の確認・更新は専用ページから行えます。
              </p>
            ) : (
              <p className="mt-1 text-sm text-moai-muted">
                案件を受注して報酬を受け取るには、振込先口座の登録が必要です（約3〜5分）。
              </p>
            )}
            <Link href="/bank-setup" className="btn-outline btn-sm mt-3">
              {profile?.stripe_account_id ? "口座情報を確認する →" : "振込先口座を登録する →"}
            </Link>
          </div>
        </div>
      </section>
      <LineLink linked={!!profile?.line_user_id} />
    </div>
  );
}
