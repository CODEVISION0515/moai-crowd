import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import ConnectStatus from "@/components/ConnectStatus";
import LineLink from "@/components/LineLink";

async function updateProfile(formData: FormData) {
  "use server";
  const sb = await createClient();
  const { data: { user } } = await sb.auth.getUser();
  if (!user) redirect("/login");

  const payload = {
    display_name: String(formData.get("display_name") || ""),
    handle: String(formData.get("handle") || ""),
    bio: String(formData.get("bio") || ""),
    skills: String(formData.get("skills") || "").split(",").map((s) => s.trim()).filter(Boolean),
    hourly_rate_jpy: Number(formData.get("hourly_rate") || 0) || null,
    location: String(formData.get("location") || "") || null,
    website: String(formData.get("website") || "") || null,
  };
  await sb.from("profiles").update(payload).eq("id", user.id);
  revalidatePath("/dashboard");
  redirect("/dashboard");
}

export default async function ProfileEditPage() {
  const sb = await createClient();
  const { data: { user } } = await sb.auth.getUser();
  if (!user) redirect("/login");
  const { data: profile } = await sb.from("profiles").select("*").eq("id", user.id).single();

  return (
    <div className="mx-auto max-w-xl px-4 py-10 space-y-6">
      <h1 className="text-2xl font-bold">プロフィール編集</h1>
      <ConnectStatus />
      <LineLink linked={!!profile?.line_user_id} />
      <form action={updateProfile} className="card space-y-4">
        <div>
          <label className="label">表示名</label>
          <input name="display_name" required defaultValue={profile?.display_name ?? ""} className="input" />
        </div>
        <div>
          <label className="label">ハンドル (URL用)</label>
          <input name="handle" required defaultValue={profile?.handle ?? ""} className="input" />
        </div>
        <div>
          <label className="label">自己紹介</label>
          <textarea name="bio" rows={6} defaultValue={profile?.bio ?? ""} className="input" />
        </div>
        <div>
          <label className="label">スキル (カンマ区切り)</label>
          <input name="skills" defaultValue={profile?.skills?.join(", ") ?? ""} className="input" />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="label">時給 (円)</label>
            <input name="hourly_rate" type="number" defaultValue={profile?.hourly_rate_jpy ?? ""} className="input" />
          </div>
          <div>
            <label className="label">拠点</label>
            <input name="location" defaultValue={profile?.location ?? ""} className="input" />
          </div>
        </div>
        <div>
          <label className="label">Webサイト</label>
          <input name="website" type="url" defaultValue={profile?.website ?? ""} className="input" />
        </div>
        <button className="btn-primary w-full">保存</button>
      </form>
    </div>
  );
}
