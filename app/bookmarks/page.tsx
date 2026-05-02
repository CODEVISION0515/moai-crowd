import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import BookmarkButton from "@/components/BookmarkButton";
import { EmptyState } from "@/components/EmptyState";
import { formatCurrency } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function BookmarksPage() {
  const sb = await createClient();
  const { data: { user } } = await sb.auth.getUser();
  if (!user) redirect("/login?redirect=/bookmarks");

  const { data: bookmarks } = await sb
    .from("bookmarks")
    .select("job_id, created_at, jobs(id, title, category, budget_min_jpy, budget_max_jpy, proposal_count, status, profiles:client_id(display_name))")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  return (
    <div className="container-app max-w-4xl py-6 md:py-10">
      <h1 className="text-2xl md:text-3xl font-bold mb-6">保存した案件</h1>

      {bookmarks && bookmarks.length > 0 ? (
        <div className="space-y-3">
          {bookmarks.map((b: Record<string, unknown>) => {
            const job = b.jobs as Record<string, unknown> | null;
            if (!job) return null;
            const client = job.profiles as Record<string, unknown> | null;
            return (
              <div key={job.id as string} className="card flex items-start gap-3">
                <Link href={`/jobs/${job.id}`} className="flex-1 min-w-0 hover:text-moai-primary transition">
                  <div className="flex items-center gap-2">
                    <span className="badge">{job.category as string}</span>
                    {job.status !== "open" && <span className="badge badge-slate">{job.status as string}</span>}
                  </div>
                  <h3 className="mt-2 font-semibold">{job.title as string}</h3>
                  <div className="mt-1 text-sm text-slate-500">
                    {formatCurrency(job.budget_min_jpy as number)} 〜 {formatCurrency(job.budget_max_jpy as number)}
                    {" · "}by {(client?.display_name as string) ?? "-"}
                    {" · "}応募 {job.proposal_count as number}件
                  </div>
                </Link>
                <BookmarkButton jobId={job.id as string} isBookmarked={true} />
              </div>
            );
          })}
        </div>
      ) : (
        <EmptyState
          icon="🔖"
          title="まだ保存した案件がありません"
          description="気になる案件はブックマークしておきましょう"
          action={{ href: "/jobs", label: "案件を探す" }}
        />
      )}
    </div>
  );
}
