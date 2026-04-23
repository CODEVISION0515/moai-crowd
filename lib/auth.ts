import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

export async function requireUser() {
  const sb = await createClient();
  const { data: { user } } = await sb.auth.getUser();
  if (!user) redirect("/login");
  return { sb, user };
}

export async function requireAdmin() {
  const { sb, user } = await requireUser();
  const { data: profile } = await sb.from("profiles").select("role").eq("id", user.id).single();
  if (!profile || !["admin", "moderator"].includes(profile.role)) {
    redirect("/");
  }
  return { sb, user, role: profile.role };
}

/**
 * スクールメンバー = student / alumni / lecturer / community_manager / admin / moderator
 * 受講者限定エリア (/school/cohort/[id] など) のアクセス判定に使用。
 */
export const SCHOOL_CROWD_ROLES = ["student", "alumni", "lecturer", "community_manager"] as const;

export function isSchoolMemberProfile(profile: {
  role?: string | null;
  crowd_role?: string | null;
} | null): boolean {
  if (!profile) return false;
  if (profile.role === "admin" || profile.role === "moderator") return true;
  return SCHOOL_CROWD_ROLES.includes(profile.crowd_role as any);
}

export async function requireSchoolMember(opts?: { redirectTo?: string }) {
  const { sb, user } = await requireUser();
  const { data: profile } = await sb
    .from("profiles")
    .select("role, crowd_role")
    .eq("id", user.id)
    .maybeSingle();
  if (!isSchoolMemberProfile(profile)) {
    redirect(opts?.redirectTo ?? "/school?gate=members");
  }
  return { sb, user, profile };
}
