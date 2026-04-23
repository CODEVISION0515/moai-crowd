import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { Avatar } from "@/components/Avatar";
import { MoaiBadge } from "@/components/MoaiBadge";
import AIDraftPanel from "./AIDraftPanel";
import NewJobForm from "./NewJobForm";

export default async function NewJobPage({
  searchParams,
}: {
  searchParams: Promise<{ assignee?: string }>;
}) {
  const sp = await searchParams;
  const assigneeHandle = sp.assignee?.trim() || null;

  const sb = await createClient();
  const [{ data: categories }, assigneeRes] = await Promise.all([
    sb.from("categories").select("slug, label").order("sort_order"),
    assigneeHandle
      ? sb
          .from("profiles")
          .select("id, handle, display_name, avatar_url, tagline, crowd_role, moai_badge_display, cohort")
          .eq("handle", assigneeHandle)
          .maybeSingle()
      : Promise.resolve({ data: null }),
  ]);

  const assignee: any = assigneeRes.data;

  return (
    <div className="mx-auto max-w-2xl px-4 py-10">
      <h1 className="text-2xl font-bold mb-6">案件を投稿する</h1>

      {/* Assignee ヒント (指名の場合) */}
      {assignee && (
        <div className="card mb-4 border-moai-primary/30 bg-moai-primary/[0.03]">
          <div className="flex items-start gap-3">
            <span className="h-10 w-10 rounded-full overflow-hidden bg-moai-cloud flex items-center justify-center text-sm font-semibold text-moai-muted shrink-0">
              <Avatar src={assignee.avatar_url} name={assignee.display_name} size={40} />
            </span>
            <div className="min-w-0 flex-1">
              <div className="text-[11px] font-semibold text-moai-primary uppercase tracking-wider">
                💼 この受注者に依頼したい
              </div>
              <div className="mt-0.5 font-semibold">{assignee.display_name}</div>
              <div className="flex items-center gap-2 flex-wrap text-xs text-moai-muted mt-0.5">
                <span>@{assignee.handle}</span>
                <MoaiBadge crowdRole={assignee.crowd_role} display={assignee.moai_badge_display} cohort={assignee.cohort} />
              </div>
              {assignee.tagline && <p className="mt-2 text-xs text-moai-muted line-clamp-2">{assignee.tagline}</p>}
              <p className="mt-2 text-[11px] text-moai-muted">
                案件を公開後、<strong className="text-moai-ink">{assignee.display_name}</strong> さんに通知が届きます。本人が応募してくれたら、承諾して契約締結できます。
              </p>
            </div>
          </div>
        </div>
      )}

      {!assignee && <AIDraftPanel />}

      <NewJobForm
        categories={categories ?? []}
        assigneeHandle={assigneeHandle}
        assigneeDisplayName={assignee?.display_name ?? null}
      />

      {!assignee && (
        <div className="mt-6 text-center text-xs text-moai-muted">
          <Link href="/workers" className="hover:text-moai-primary hover:underline">
            🎯 MOAI卒業生を探して直接依頼
          </Link>
        </div>
      )}
    </div>
  );
}
