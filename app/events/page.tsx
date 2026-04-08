import Link from "next/link";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export default async function EventsPage() {
  const sb = await createClient();
  const { data: events } = await sb
    .from("events")
    .select("*, host:host_id(handle, display_name)")
    .gte("starts_at", new Date().toISOString())
    .order("starts_at", { ascending: true })
    .limit(50);

  return (
    <div className="mx-auto max-w-5xl px-4 py-10">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">イベント</h1>
        <Link href="/events/new" className="btn-primary">+ イベント作成</Link>
      </div>
      <div className="grid md:grid-cols-2 gap-4">
        {events?.map((e: any) => {
          const date = new Date(e.starts_at);
          return (
            <Link key={e.id} href={`/events/${e.id}`} className="card hover:shadow-md transition">
              <div className="flex gap-4">
                <div className="shrink-0 text-center">
                  <div className="text-xs text-slate-500">{date.toLocaleDateString("ja-JP", { month: "short" })}</div>
                  <div className="text-3xl font-bold text-moai-primary">{date.getDate()}</div>
                  <div className="text-xs">{date.toLocaleTimeString("ja-JP", { hour: "2-digit", minute: "2-digit" })}</div>
                </div>
                <div className="min-w-0 flex-1">
                  <h3 className="font-semibold line-clamp-2">{e.title}</h3>
                  <p className="mt-1 text-sm text-slate-600 line-clamp-2">{e.description}</p>
                  <div className="mt-2 text-xs text-slate-500">
                    {e.location ?? "オンライン"} · 参加 {e.attendee_count}{e.capacity ? `/${e.capacity}` : ""} · by {e.host?.display_name}
                  </div>
                </div>
              </div>
            </Link>
          );
        })}
        {(!events || events.length === 0) && (
          <p className="col-span-full text-center text-slate-500 py-10">予定されているイベントはありません</p>
        )}
      </div>
    </div>
  );
}
