import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { createClient } from "@/lib/supabase/server";
import { Avatar } from "@/components/Avatar";
import { MoaiBadge } from "@/components/MoaiBadge";
import { EmptyState } from "@/components/EmptyState";
import { formatDateJP } from "@/lib/utils";

export const metadata: Metadata = {
  title: "受講生インタビュー｜MOAIスクール",
  description: "MOAIスクール受講生の学びの軌跡と、受講前後の変化をインタビュー形式で紹介します。",
};

export const dynamic = "force-dynamic";

export default async function InterviewsListPage() {
  const sb = await createClient();
  const { data: interviews } = await sb
    .from("interviews")
    .select(
      "id, slug, title, summary, hero_image_url, published_at, view_count, cohort_id, cohorts:cohort_id(name), subject:subject_user_id(handle, display_name, avatar_url, crowd_role, moai_badge_display)"
    )
    .eq("is_published", true)
    .order("published_at", { ascending: false })
    .limit(30);

  return (
    <div className="container-app max-w-5xl py-10 space-y-8">
      <header className="space-y-3">
        <div className="text-sm text-moai-muted">
          <Link href="/school" className="hover:text-moai-primary">🎓 MOAIスクール</Link>
          {" / "}
          <span>受講生インタビュー</span>
        </div>
        <h1 className="text-3xl md:text-4xl font-bold">受講生の声</h1>
        <p className="text-moai-muted max-w-2xl">
          MOAIスクールで学んだ受講生たちの、学びの軌跡と受講前後のリアルな変化をお届けします。
        </p>
      </header>

      {interviews && interviews.length > 0 ? (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {interviews.map((i: any) => (
            <Link key={i.id} href={`/school/interviews/${i.slug}`} className="card hover:shadow-md transition-shadow group block">
              {i.hero_image_url && (
                <div className="relative h-44 -m-5 mb-3 bg-moai-cloud rounded-t-xl overflow-hidden">
                  <Image
                    src={i.hero_image_url}
                    alt={i.title}
                    fill
                    sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw"
                    className="object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                </div>
              )}
              {i.cohorts && (
                <div className="text-[10px] font-semibold text-moai-primary uppercase tracking-wider mb-1">
                  {i.cohorts.name}
                </div>
              )}
              <h2 className="font-bold text-base line-clamp-2 group-hover:text-moai-primary transition-colors">
                {i.title}
              </h2>
              {i.summary && (
                <p className="mt-2 text-xs text-moai-muted line-clamp-3 leading-relaxed">
                  {i.summary}
                </p>
              )}

              {i.subject && (
                <div className="mt-3 pt-3 border-t border-moai-border/50 flex items-center gap-2">
                  <span className="h-7 w-7 rounded-full overflow-hidden bg-moai-cloud flex items-center justify-center text-xs font-semibold text-moai-muted shrink-0">
                    <Avatar src={i.subject.avatar_url} name={i.subject.display_name} size={28} />
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="text-xs font-medium truncate">{i.subject.display_name}</div>
                    <div className="text-[10px] text-moai-muted">
                      <MoaiBadge crowdRole={i.subject.crowd_role} display={i.subject.moai_badge_display} />
                    </div>
                  </div>
                </div>
              )}

              <div className="mt-3 flex items-center justify-between text-[10px] text-moai-muted">
                {i.published_at && <span>{formatDateJP(i.published_at)}</span>}
                <span>👁 {i.view_count ?? 0}</span>
              </div>
            </Link>
          ))}
        </div>
      ) : (
        <EmptyState
          icon="🎙"
          title="インタビュー記事はまだありません"
          description="第1期の受講が始まると、学びの軌跡をインタビュー形式でお届けします"
        />
      )}
    </div>
  );
}
