import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export const dynamic = "force-dynamic";

export default async function EventDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const sb = await createClient();
  const { data: { user } } = await sb.auth.getUser();

  const { data: event } = await sb.from("events")
    .select("*, host:host_id(handle, display_name, avatar_url)")
    .eq("id", id).single();
  if (!event) notFound();

  const { data: attendees } = await sb.from("event_attendees")
    .select("status, user:user_id(handle, display_name, avatar_url, level)")
    .eq("event_id", id).eq("status", "going");

  const { data: myRsvp } = user
    ? await sb.from("event_attendees").select("status").eq("event_id", id).eq("user_id", user.id).maybeSingle()
    : { data: null };

  async function rsvp(formData: FormData) {
    "use server";
    const sb2 = await createClient();
    const { data: { user: u } } = await sb2.auth.getUser();
    if (!u) redirect("/login");
    const status = String(formData.get("status"));
    await sb2.from("event_attendees").upsert({ event_id: id, user_id: u.id, status });
    if (status === "going") {
      await sb2.rpc("award_xp", { p_user_id: u.id, p_reason: "event_attended", p_amount: 15, p_meta: null });
    }
    revalidatePath(`/events/${id}`);
  }

  return (
    <div className="container-app max-w-3xl py-6 md:py-10">
      <Link href="/events" className="text-sm text-moai-primary hover:underline">← イベント一覧</Link>
      <div className="card mt-4">
        <h1 className="text-2xl font-bold">{event.title}</h1>
        <div className="mt-3 text-sm text-slate-600 space-y-1">
          <div>📅 {new Date(event.starts_at).toLocaleString("ja-JP")}{event.ends_at && ` 〜 ${new Date(event.ends_at).toLocaleString("ja-JP", { hour: "2-digit", minute: "2-digit" })}`}</div>
          {event.location && <div>📍 {event.location}</div>}
          {event.meeting_url && <div>🔗 <a href={event.meeting_url} target="_blank" rel="noopener noreferrer" className="text-moai-primary hover:underline">{event.meeting_url}</a></div>}
          <div>主催: {event.host?.display_name}</div>
          <div>参加予定: {event.attendee_count}{event.capacity ? ` / ${event.capacity}` : ""}名</div>
        </div>
        <div className="mt-5 whitespace-pre-wrap text-sm leading-relaxed">{event.description}</div>

        {user && (
          <div className="mt-6 flex gap-2">
            <form action={rsvp}>
              <input type="hidden" name="status" value="going" />
              <button className={myRsvp?.status === "going" ? "btn-primary" : "btn-outline"}>参加する</button>
            </form>
            <form action={rsvp}>
              <input type="hidden" name="status" value="maybe" />
              <button className={myRsvp?.status === "maybe" ? "btn-primary" : "btn-outline"}>興味あり</button>
            </form>
            {myRsvp && (
              <form action={rsvp}>
                <input type="hidden" name="status" value="canceled" />
                <button className="btn-outline">キャンセル</button>
              </form>
            )}
          </div>
        )}
      </div>

      <h2 className="mt-8 text-lg font-semibold">参加者 ({attendees?.length ?? 0})</h2>
      <div className="mt-3 grid grid-cols-2 md:grid-cols-4 gap-3">
        {attendees?.map((a: any) => (
          <Link key={a.user?.handle} href={`/profile/${a.user?.handle}`} className="card text-center hover:shadow-md">
            <div className="mx-auto h-12 w-12 rounded-full bg-moai-primary/10 flex items-center justify-center font-bold text-moai-primary">
              {a.user?.display_name?.[0] ?? "?"}
            </div>
            <div className="mt-2 text-sm font-semibold truncate">{a.user?.display_name}</div>
            <div className="text-xs text-slate-500">Lv.{a.user?.level ?? 1}</div>
          </Link>
        ))}
      </div>
    </div>
  );
}
