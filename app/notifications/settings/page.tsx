import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import type { NotificationKind } from "@/types/database";

export const dynamic = "force-dynamic";

const NOTIFICATION_KINDS: { kind: NotificationKind; label: string; description: string }[] = [
  { kind: "proposal_received", label: "応募受信", description: "あなたの案件に新しい応募があった時" },
  { kind: "proposal_accepted", label: "応募承諾", description: "あなたの応募が承諾された時" },
  { kind: "proposal_rejected", label: "応募不採用", description: "あなたの応募が不採用になった時" },
  { kind: "deliverable_submitted", label: "成果物提出", description: "受注者が成果物を提出した時" },
  { kind: "deliverable_approved", label: "成果物承認", description: "成果物が承認された時" },
  { kind: "revision_requested", label: "修正依頼", description: "修正が依頼された時" },
  { kind: "message_received", label: "メッセージ", description: "新しいメッセージを受信した時" },
  { kind: "contract_funded", label: "入金完了", description: "エスクロー入金が完了した時" },
  { kind: "review_received", label: "レビュー受信", description: "レビューを受け取った時" },
];

async function savePreferences(formData: FormData) {
  "use server";
  const sb = await createClient();
  const { data: { user } } = await sb.auth.getUser();
  if (!user) redirect("/login");

  for (const nk of NOTIFICATION_KINDS) {
    const email = formData.get(`${nk.kind}_email`) === "on";
    const line = formData.get(`${nk.kind}_line`) === "on";
    const inapp = formData.get(`${nk.kind}_inapp`) === "on";

    await sb.from("notification_preferences").upsert({
      user_id: user.id,
      kind: nk.kind,
      channel_email: email,
      channel_line: line,
      channel_inapp: inapp,
    }, { onConflict: "user_id,kind" });
  }

  revalidatePath("/notifications/settings");
}

export default async function NotificationSettingsPage() {
  const sb = await createClient();
  const { data: { user } } = await sb.auth.getUser();
  if (!user) redirect("/login");

  const { data: prefs } = await sb
    .from("notification_preferences")
    .select("*")
    .eq("user_id", user.id);

  const prefMap = new Map(
    (prefs ?? []).map((p: { kind: string; channel_email: boolean; channel_line: boolean; channel_inapp: boolean }) => [p.kind, p])
  );

  const { data: profile } = await sb
    .from("profiles")
    .select("line_user_id")
    .eq("id", user.id)
    .single();
  const lineLinked = !!profile?.line_user_id;

  return (
    <div className="mx-auto max-w-3xl px-4 py-10">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">通知設定</h1>
        <Link href="/notifications" className="text-sm text-moai-primary hover:underline">← 通知一覧</Link>
      </div>

      <form action={savePreferences} className="card">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left border-b border-slate-200">
                <th className="p-3">通知種別</th>
                <th className="p-3 text-center w-20">アプリ内</th>
                <th className="p-3 text-center w-20">メール</th>
                <th className="p-3 text-center w-20">
                  LINE
                  {!lineLinked && (
                    <div className="text-[10px] text-slate-400 font-normal">未連携</div>
                  )}
                </th>
              </tr>
            </thead>
            <tbody>
              {NOTIFICATION_KINDS.map((nk) => {
                const pref = prefMap.get(nk.kind) as { channel_email: boolean; channel_line: boolean; channel_inapp: boolean } | undefined;
                return (
                  <tr key={nk.kind} className="border-b border-slate-100">
                    <td className="p-3">
                      <div className="font-medium">{nk.label}</div>
                      <div className="text-xs text-slate-500">{nk.description}</div>
                    </td>
                    <td className="p-3 text-center">
                      <input
                        type="checkbox"
                        name={`${nk.kind}_inapp`}
                        defaultChecked={pref?.channel_inapp ?? true}
                        className="h-4 w-4 rounded border-slate-300 text-moai-primary focus:ring-moai-primary"
                      />
                    </td>
                    <td className="p-3 text-center">
                      <input
                        type="checkbox"
                        name={`${nk.kind}_email`}
                        defaultChecked={pref?.channel_email ?? true}
                        className="h-4 w-4 rounded border-slate-300 text-moai-primary focus:ring-moai-primary"
                      />
                    </td>
                    <td className="p-3 text-center">
                      <input
                        type="checkbox"
                        name={`${nk.kind}_line`}
                        defaultChecked={pref?.channel_line ?? false}
                        disabled={!lineLinked}
                        className="h-4 w-4 rounded border-slate-300 text-moai-primary focus:ring-moai-primary disabled:opacity-30"
                      />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        <div className="mt-4 flex items-center justify-between">
          {!lineLinked && (
            <Link href="/profile/edit" className="text-xs text-moai-primary hover:underline">
              LINE連携はプロフィール編集から →
            </Link>
          )}
          <button className="btn-primary ml-auto">設定を保存</button>
        </div>
      </form>
    </div>
  );
}
