import { Suspense } from "react";
import { createClient } from "@/lib/supabase/server";
import RecommendedJobs from "@/components/RecommendedJobs";
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

  return (
    <div className="container-app py-6 md:py-10 pb-nav space-y-6">
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

      <Suspense fallback={<CommunityHighlightsSkeleton />}>
        <CommunityHighlights userId={user.id} />
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
    </div>
  );
}
