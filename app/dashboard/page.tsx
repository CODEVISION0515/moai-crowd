import { Suspense } from "react";
import { createClient } from "@/lib/supabase/server";
import RecommendedJobs from "@/components/RecommendedJobs";
import DashboardSidebar from "./DashboardSidebar";
import DashboardRightPanel from "./DashboardRightPanel";
import {
  GreetingCard,
  GreetingCardSkeleton,
  GettingStarted,
  GettingStartedSkeleton,
  CohortBanner,
  BankSetupBanner,
  StatsAndActions,
  StatsAndActionsSkeleton,
  ActiveContractsSection,
  MyJobsSection,
  MyProposalsSection,
  CommunityHighlights,
  CommunityHighlightsSkeleton,
  SectionListSkeleton,
} from "./sections";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: profile } = await supabase
    .from("profiles")
    .select("active_mode")
    .eq("id", user.id)
    .maybeSingle();
  const activeMode = (profile?.active_mode ?? "worker") as "worker" | "client";

  return (
    <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 py-6 md:py-8 pb-nav">
      <div className="grid grid-cols-1 lg:grid-cols-[14rem_minmax(0,1fr)_18rem] gap-6">
        {/* Left sidebar (desktop only) */}
        <DashboardSidebar activeMode={activeMode} />

        {/* Main content */}
        <main className="min-w-0 space-y-6">
          <Suspense fallback={<GreetingCardSkeleton />}>
            <GreetingCard userId={user.id} />
          </Suspense>

          <Suspense fallback={null}>
            <BankSetupBanner userId={user.id} />
          </Suspense>

          <Suspense fallback={null}>
            <CohortBanner userId={user.id} />
          </Suspense>

          <Suspense fallback={<GettingStartedSkeleton />}>
            <GettingStarted userId={user.id} />
          </Suspense>

          <Suspense fallback={<StatsAndActionsSkeleton />}>
            <StatsAndActions userId={user.id} />
          </Suspense>

          <RecommendedJobs />

          <Suspense fallback={<SectionListSkeleton title="進行中の契約" />}>
            <ActiveContractsSection userId={user.id} />
          </Suspense>

          <div className="grid md:grid-cols-2 gap-6">
            <Suspense fallback={<SectionListSkeleton title="投稿した案件" />}>
              <MyJobsSection userId={user.id} />
            </Suspense>
            <Suspense fallback={<SectionListSkeleton title="応募した案件" />}>
              <MyProposalsSection userId={user.id} />
            </Suspense>
          </div>

          {/* CommunityHighlights: モバイル/タブレット用 (PCは右パネルに表示) */}
          <div className="lg:hidden">
            <Suspense fallback={<CommunityHighlightsSkeleton />}>
              <CommunityHighlights userId={user.id} />
            </Suspense>
          </div>
        </main>

        {/* Right panel (desktop only) */}
        <DashboardRightPanel userId={user.id} activeMode={activeMode} />
      </div>
    </div>
  );
}
