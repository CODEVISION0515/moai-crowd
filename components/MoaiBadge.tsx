import type { CrowdRole } from "@/types/database";

const LABELS: Record<CrowdRole, { label: string; icon: string; className: string; title: string } | null> = {
  student: {
    icon: "🌱",
    label: "MOAI在校生",
    title: "MOAIスクール在校生（Crowd手数料0%）",
    className: "bg-emerald-50 text-emerald-700 border border-emerald-200",
  },
  alumni: {
    icon: "🎓",
    label: "MOAI卒業生",
    title: "MOAIスクール卒業生（Crowd手数料5%生涯）",
    className: "bg-moai-primary/10 text-moai-primary border border-moai-primary/30",
  },
  lecturer: {
    icon: "🏛",
    label: "MOAI講師",
    title: "MOAI公式講師",
    className: "bg-amber-50 text-amber-700 border border-amber-200",
  },
  community_manager: {
    icon: "🛡",
    label: "CM",
    title: "MOAIコミュニティマネージャー",
    className: "bg-sky-50 text-sky-700 border border-sky-200",
  },
  client: null,
  general: null,
};

/**
 * MOAIエコシステム内のロールを示すバッジ。
 * moai_badge_display=false の場合は非表示。
 */
export function MoaiBadge({
  crowdRole,
  display = true,
  cohort,
}: {
  crowdRole: CrowdRole | null | undefined;
  display?: boolean;
  cohort?: number | null;
}) {
  if (!display || !crowdRole) return null;
  const meta = LABELS[crowdRole];
  if (!meta) return null;
  const label = cohort ? `${meta.label}・第${cohort}期` : meta.label;
  return (
    <span
      title={meta.title}
      className={`inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-md ${meta.className}`}
    >
      <span aria-hidden="true">{meta.icon}</span>
      {label}
    </span>
  );
}
