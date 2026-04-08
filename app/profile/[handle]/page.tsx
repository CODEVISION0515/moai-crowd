import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export default async function ProfilePage({ params }: { params: Promise<{ handle: string }> }) {
  const { handle } = await params;
  const supabase = await createClient();

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("handle", handle)
    .single();

  if (!profile) notFound();

  const { data: reviews } = await supabase
    .from("reviews")
    .select("*, reviewer:reviewer_id(display_name, handle)")
    .eq("reviewee_id", profile.id)
    .order("created_at", { ascending: false });

  return (
    <div className="mx-auto max-w-3xl px-4 py-10">
      <div className="card">
        <div className="flex items-center gap-4">
          <div className="h-20 w-20 rounded-full bg-moai-primary/10 flex items-center justify-center text-2xl font-bold text-moai-primary">
            {profile.display_name?.[0] ?? "?"}
          </div>
          <div>
            <h1 className="text-2xl font-bold">{profile.display_name}</h1>
            <div className="text-sm text-slate-500">@{profile.handle}</div>
            <div className="mt-1 text-sm">
              ★ {Number(profile.rating_avg).toFixed(1)} ({profile.rating_count}件のレビュー)
            </div>
          </div>
        </div>
        {profile.bio && <p className="mt-4 whitespace-pre-wrap text-sm">{profile.bio}</p>}
        {profile.skills?.length > 0 && (
          <div className="mt-4 flex flex-wrap gap-2">
            {profile.skills.map((s: string) => <span key={s} className="badge">{s}</span>)}
          </div>
        )}
        <div className="mt-4 grid grid-cols-2 gap-4 text-sm text-slate-600">
          {profile.hourly_rate_jpy && <div>時給: ¥{profile.hourly_rate_jpy.toLocaleString()}</div>}
          {profile.location && <div>拠点: {profile.location}</div>}
        </div>
      </div>

      <h2 className="mt-10 text-lg font-semibold mb-3">レビュー</h2>
      <div className="space-y-3">
        {reviews?.map((r: any) => (
          <div key={r.id} className="card">
            <div className="flex justify-between items-center">
              <div className="font-semibold">{r.reviewer?.display_name}</div>
              <div className="text-sm">{"★".repeat(r.rating)}</div>
            </div>
            {r.comment && <p className="mt-2 text-sm">{r.comment}</p>}
          </div>
        ))}
        {(!reviews || reviews.length === 0) && <p className="text-sm text-slate-500">まだレビューがありません</p>}
      </div>
    </div>
  );
}
