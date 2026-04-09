import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import ConnectStatus from "@/components/ConnectStatus";
import LineLink from "@/components/LineLink";
import AvatarUpload from "@/components/AvatarUpload";
import ProfileCoach from "./ProfileCoach";

export const dynamic = "force-dynamic";

async function updateBasic(formData: FormData) {
  "use server";
  const sb = await createClient();
  const { data: { user } } = await sb.auth.getUser();
  if (!user) redirect("/login");
  await sb.from("profiles").update({
    display_name: String(formData.get("display_name") || ""),
    handle: String(formData.get("handle") || ""),
    tagline: String(formData.get("tagline") || "") || null,
    bio: String(formData.get("bio") || "") || null,
    skills: String(formData.get("skills") || "").split(",").map((s) => s.trim()).filter(Boolean),
    hourly_rate_jpy: Number(formData.get("hourly_rate") || 0) || null,
    location: String(formData.get("location") || "") || null,
    years_experience: Number(formData.get("years_experience") || 0) || null,
    languages: String(formData.get("languages") || "").split(",").map((s) => s.trim()).filter(Boolean),
    service_areas: String(formData.get("service_areas") || "").split(",").map((s) => s.trim()).filter(Boolean),
    availability: String(formData.get("availability") || "available"),
    work_hours: String(formData.get("work_hours") || "") || null,
  }).eq("id", user.id);
  revalidatePath("/profile/edit");
}

async function updateSocial(formData: FormData) {
  "use server";
  const sb = await createClient();
  const { data: { user } } = await sb.auth.getUser();
  if (!user) redirect("/login");
  await sb.from("profiles").update({
    twitter_handle: String(formData.get("twitter") || "") || null,
    instagram_handle: String(formData.get("instagram") || "") || null,
    github_handle: String(formData.get("github") || "") || null,
    linkedin_url: String(formData.get("linkedin") || "") || null,
    behance_url: String(formData.get("behance") || "") || null,
    youtube_url: String(formData.get("youtube") || "") || null,
    tiktok_handle: String(formData.get("tiktok") || "") || null,
    website: String(formData.get("website") || "") || null,
  }).eq("id", user.id);
  revalidatePath("/profile/edit");
}

async function addPortfolio(formData: FormData) {
  "use server";
  const sb = await createClient();
  const { data: { user } } = await sb.auth.getUser();
  if (!user) redirect("/login");
  await sb.from("portfolios").insert({
    user_id: user.id,
    title: String(formData.get("title") || ""),
    description: String(formData.get("description") || "") || null,
    image_url: String(formData.get("image_url") || "") || null,
    external_url: String(formData.get("external_url") || "") || null,
    tags: String(formData.get("tags") || "").split(",").map((s) => s.trim()).filter(Boolean),
    client_name: String(formData.get("client_name") || "") || null,
    completed_at: String(formData.get("completed_at") || "") || null,
  });
  revalidatePath("/profile/edit");
}

async function deletePortfolio(formData: FormData) {
  "use server";
  const sb = await createClient();
  await sb.from("portfolios").delete().eq("id", String(formData.get("id")));
  revalidatePath("/profile/edit");
}

async function addWorkExp(formData: FormData) {
  "use server";
  const sb = await createClient();
  const { data: { user } } = await sb.auth.getUser();
  if (!user) redirect("/login");
  await sb.from("work_experiences").insert({
    user_id: user.id,
    company: String(formData.get("company") || ""),
    title: String(formData.get("title") || ""),
    description: String(formData.get("description") || "") || null,
    start_date: String(formData.get("start_date") || ""),
    end_date: String(formData.get("end_date") || "") || null,
    is_current: formData.get("is_current") === "on",
  });
  revalidatePath("/profile/edit");
}

async function deleteWorkExp(formData: FormData) {
  "use server";
  const sb = await createClient();
  await sb.from("work_experiences").delete().eq("id", String(formData.get("id")));
  revalidatePath("/profile/edit");
}

async function addEducation(formData: FormData) {
  "use server";
  const sb = await createClient();
  const { data: { user } } = await sb.auth.getUser();
  if (!user) redirect("/login");
  await sb.from("educations").insert({
    user_id: user.id,
    school: String(formData.get("school") || ""),
    degree: String(formData.get("degree") || "") || null,
    field: String(formData.get("field") || "") || null,
    start_date: String(formData.get("start_date") || "") || null,
    end_date: String(formData.get("end_date") || "") || null,
  });
  revalidatePath("/profile/edit");
}

async function deleteEducation(formData: FormData) {
  "use server";
  const sb = await createClient();
  await sb.from("educations").delete().eq("id", String(formData.get("id")));
  revalidatePath("/profile/edit");
}

async function addCertification(formData: FormData) {
  "use server";
  const sb = await createClient();
  const { data: { user } } = await sb.auth.getUser();
  if (!user) redirect("/login");
  await sb.from("certifications").insert({
    user_id: user.id,
    name: String(formData.get("name") || ""),
    issuer: String(formData.get("issuer") || "") || null,
    issued_date: String(formData.get("issued_date") || "") || null,
    credential_url: String(formData.get("credential_url") || "") || null,
  });
  revalidatePath("/profile/edit");
}

async function deleteCertification(formData: FormData) {
  "use server";
  const sb = await createClient();
  await sb.from("certifications").delete().eq("id", String(formData.get("id")));
  revalidatePath("/profile/edit");
}

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
      <form action={updateBasic} className="card space-y-4">
        <h2 className="font-semibold">基本情報</h2>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="label">表示名 *</label>
            <input name="display_name" required defaultValue={profile?.display_name ?? ""} className="input" />
          </div>
          <div>
            <label className="label">ハンドル *</label>
            <input name="handle" required defaultValue={profile?.handle ?? ""} className="input" />
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
        <button className="btn-primary">基本情報を保存</button>
      </form>

      {/* SNS */}
      <form action={updateSocial} className="card space-y-4">
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
      </form>

      {/* ポートフォリオ */}
      <section className="card">
        <h2 className="font-semibold mb-4">ポートフォリオ ({portfolios?.length ?? 0})</h2>
        <div className="space-y-3 mb-4">
          {portfolios?.map((p) => (
            <div key={p.id} className="border border-slate-200 rounded-lg p-3 flex gap-3">
              {p.image_url && <img src={p.image_url} alt="" className="h-20 w-20 rounded object-cover" />}
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

      <ConnectStatus />
      <LineLink linked={!!profile?.line_user_id} />
    </div>
  );
}
