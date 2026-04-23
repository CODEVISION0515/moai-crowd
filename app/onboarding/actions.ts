"use server";

import { redirect } from "next/navigation";
import { createClient, createAdminClient } from "@/lib/supabase/server";
import { statefulFormAction, type ActionResult } from "@/lib/actions";
import { onboardingStep1Schema, onboardingStep2Schema } from "@/lib/validations";
import { sendMail, welcomeTemplate } from "@/lib/mail";

export type { ActionResult };

export const saveStep1 = statefulFormAction(onboardingStep1Schema, async ({ sb, user, data: d }) => {
  const handle = d.handle.toLowerCase().replace(/[^a-z0-9_]/g, "");

  const { data: existing } = await sb
    .from("profiles")
    .select("id")
    .eq("handle", handle)
    .neq("id", user.id)
    .maybeSingle();
  if (existing) return { error: "このハンドルは既に使われています" };

  // signup_intent を user_metadata から拾って profile に保存
  const userMetaIntent = (user.user_metadata as any)?.signup_intent as string | undefined;
  const validIntent = userMetaIntent === "client" || userMetaIntent === "worker" ? userMetaIntent : null;

  const { error } = await sb.from("profiles").update({
    display_name: d.display_name,
    handle,
    tagline: d.tagline,
    ...(validIntent ? { signup_intent: validIntent } : {}),
  }).eq("id", user.id);
  if (error) return { error: error.message };

  redirect("/onboarding?step=2");
});

export const saveStep2 = statefulFormAction(onboardingStep2Schema, async ({ sb, user, data: d }) => {
  const { error } = await sb.from("profiles").update({
    skills: d.skills,
    bio: d.bio,
    is_worker: d.role !== "client_only",
    is_client: d.role !== "worker_only",
    account_type: d.account_type,
    // 登録時にclient_only を選んだ＆法人 なら最初から発注者モードで開始する
    active_mode: d.role === "client_only" ? "client" : "worker",
  }).eq("id", user.id);
  if (error) return { error: error.message };

  redirect("/onboarding?step=3");
});

/**
 * Step 2 をスキップ。intent (client/worker/both) に応じて is_worker/is_client を設定するだけ。
 * スキル/自己紹介はあとからプロフィール編集で入力可能。
 */
export async function skipStep2(formData: FormData) {
  const sb = await createClient();
  const { data: { user } } = await sb.auth.getUser();
  if (!user) redirect("/login");
  const intent = String(formData.get("intent") ?? "");
  const role = intent === "client" ? "client_only" : intent === "worker" ? "worker_only" : "both";
  // account_type は形式だけ (hidden input) 受け取る。なければ individual
  const rawAccountType = String(formData.get("account_type") ?? "individual");
  const account_type = rawAccountType === "corporate" ? "corporate" : "individual";
  await sb.from("profiles").update({
    is_worker: role !== "client_only",
    is_client: role !== "worker_only",
    account_type,
    active_mode: role === "client_only" ? "client" : "worker",
  }).eq("id", user.id);
  redirect("/onboarding?step=3");
}

export async function finishOnboarding() {
  const sb = await createClient();
  const { data: { user } } = await sb.auth.getUser();
  if (!user) redirect("/login");

  // Welcome メール送信 (未送信の場合のみ)
  const { data: profile } = await sb
    .from("profiles")
    .select("display_name, signup_intent, welcome_email_sent_at")
    .eq("id", user.id)
    .maybeSingle();

  if (profile && !profile.welcome_email_sent_at && user.email) {
    try {
      const intent = (profile.signup_intent === "client" || profile.signup_intent === "worker")
        ? profile.signup_intent
        : null;
      const html = welcomeTemplate(profile.display_name ?? "", intent);
      await sendMail(user.email, "[MOAI Crowd] ようこそ！はじめての方向けガイド", html);
      // admin クライアントで RLS をバイパスして記録（通常のsbでも可だが確実性のため）
      const admin = createAdminClient();
      await admin
        .from("profiles")
        .update({ welcome_email_sent_at: new Date().toISOString() })
        .eq("id", user.id);
    } catch (e) {
      console.warn("[welcome-mail] failed:", e);
    }
  }

  redirect("/dashboard");
}
