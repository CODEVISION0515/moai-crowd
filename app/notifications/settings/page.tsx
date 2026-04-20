import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { ToastForm } from "@/components/ToastForm";
import { saveGlobalPrefs, savePerKindPrefs } from "./actions";
import type { NotificationKind } from "@/types/database";

export const dynamic = "force-dynamic";

type KindEntry = { kind: NotificationKind; label: string; description: string };

const GROUPS: { id: string; icon: string; label: string; kinds: KindEntry[] }[] = [
  {
    id: "contracts",
    icon: "💼",
    label: "案件・契約",
    kinds: [
      { kind: "proposal_received", label: "応募受信", description: "あなたの案件に新しい応募があった時" },
      { kind: "proposal_accepted", label: "応募承諾", description: "あなたの応募が承諾された時" },
      { kind: "proposal_rejected", label: "応募不採用", description: "あなたの応募が不採用になった時" },
      { kind: "deliverable_submitted", label: "成果物提出", description: "受注者が成果物を提出した時" },
      { kind: "deliverable_approved", label: "成果物承認", description: "成果物が承認された時" },
      { kind: "revision_requested", label: "修正依頼", description: "修正が依頼された時" },
      { kind: "contract_funded", label: "入金完了", description: "エスクロー入金が完了した時" },
      { kind: "review_received", label: "レビュー受信", description: "レビューを受け取った時" },
    ],
  },
  {
    id: "messages",
    icon: "💬",
    label: "メッセージ",
    kinds: [
      { kind: "message_received", label: "メッセージ受信", description: "新しいメッセージを受信した時" },
    ],
  },
  {
    id: "community",
    icon: "🌱",
    label: "コミュニティ",
    kinds: [
      { kind: "post_commented", label: "自分の投稿にコメント", description: "自分の投稿に誰かがコメントした時" },
      { kind: "post_liked", label: "自分の投稿にいいね", description: "自分の投稿にいいねが付いた時" },
      { kind: "comment_replied", label: "返信", description: "自分のコメントへ返信が付いた時" },
      { kind: "mentioned_in_comment", label: "@メンション (コメント)", description: "コメントで @あなた が呼ばれた時" },
      { kind: "mentioned_in_post", label: "@メンション (投稿)", description: "投稿本文で @あなた が呼ばれた時" },
      { kind: "post_answer_accepted", label: "ベストアンサー", description: "質問への回答がベストアンサーに選ばれた時" },
      { kind: "new_follower", label: "新しいフォロワー", description: "誰かがあなたをフォローした時" },
    ],
  },
  {
    id: "events",
    icon: "📅",
    label: "イベント",
    kinds: [
      { kind: "event_upcoming", label: "開催直前", description: "参加予定イベントの開催1日前" },
    ],
  },
];


export default async function NotificationSettingsPage() {
  const sb = await createClient();
  const { data: { user } } = await sb.auth.getUser();
  if (!user) redirect("/login");

  const [{ data: gp }, { data: prefs }, { data: profile }] = await Promise.all([
    sb.from("notification_global_prefs").select("*").eq("user_id", user.id).maybeSingle(),
    sb.from("notification_preferences").select("*").eq("user_id", user.id),
    sb.from("profiles").select("line_user_id").eq("id", user.id).single(),
  ]);

  const prefMap = new Map(
    (prefs ?? []).map((p: any) => [p.kind, p])
  );
  const lineLinked = !!profile?.line_user_id;

  // デフォルト値
  const masterEnabled = gp?.master_enabled ?? true;
  const emailGlobal = gp?.email_enabled ?? true;
  const lineGlobal = gp?.line_enabled ?? false;
  const quietEnabled = gp?.quiet_hours_enabled ?? false;
  const quietStart = (gp?.quiet_hours_start ?? "22:00:00").slice(0, 5);
  const quietEnd = (gp?.quiet_hours_end ?? "08:00:00").slice(0, 5);
  const digestFreq = gp?.digest_frequency ?? "immediate";

  return (
    <div className="mx-auto max-w-3xl px-4 py-10 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">通知設定</h1>
        <Link href="/notifications" className="text-sm text-moai-primary hover:underline">← 通知一覧</Link>
      </div>

      {/* ── 全体設定 ─────────────────────────── */}
      <ToastForm action={saveGlobalPrefs} className="card space-y-6">
        <h2 className="font-semibold text-lg">全体設定</h2>

        {/* マスタートグル */}
        <div className="rounded-lg border border-moai-border p-4 bg-moai-cloud/30">
          <label className="flex items-start gap-3 cursor-pointer">
            <input
              type="checkbox"
              name="master_enabled"
              defaultChecked={masterEnabled}
              className="mt-1 h-5 w-5 rounded border-slate-300 text-moai-primary focus:ring-moai-primary"
            />
            <div>
              <div className="font-medium">通知を有効にする</div>
              <div className="text-xs text-moai-muted mt-0.5">
                これをオフにするとすべての通知（アプリ内・メール・LINE）が停止します
              </div>
            </div>
          </label>
        </div>

        {/* チャネル設定 */}
        <div>
          <h3 className="section-title mb-3">チャネル</h3>
          <div className="space-y-2">
            <label className="flex items-center gap-3">
              <input
                type="checkbox"
                name="email_enabled"
                defaultChecked={emailGlobal}
                className="h-4 w-4 rounded border-slate-300 text-moai-primary focus:ring-moai-primary"
              />
              <span>📧 メール通知</span>
            </label>
            <label className="flex items-center gap-3">
              <input
                type="checkbox"
                name="line_enabled"
                defaultChecked={lineGlobal}
                disabled={!lineLinked}
                className="h-4 w-4 rounded border-slate-300 text-moai-primary focus:ring-moai-primary disabled:opacity-30"
              />
              <span>💚 LINE通知</span>
              {!lineLinked && (
                <Link href="/profile/edit" className="text-xs text-moai-primary hover:underline">
                  連携する →
                </Link>
              )}
            </label>
          </div>
        </div>

        {/* ダイジェスト */}
        <div>
          <h3 className="section-title mb-2">配信頻度</h3>
          <p className="text-xs text-moai-muted mb-2">メール/LINEの送信タイミング（アプリ内通知は常に即時）</p>
          <div className="space-y-2">
            {[
              { v: "immediate", label: "即時", desc: "発生するたびに送信" },
              { v: "daily_digest", label: "1日1回まとめ", desc: "毎朝前日分をまとめて" },
              { v: "weekly_digest", label: "週1回まとめ", desc: "月曜朝に1週間分をまとめて" },
              { v: "off", label: "メール/LINEはオフ", desc: "アプリ内通知のみ" },
            ].map((o) => (
              <label key={o.v} className="flex items-start gap-3 cursor-pointer">
                <input
                  type="radio"
                  name="digest_frequency"
                  value={o.v}
                  defaultChecked={digestFreq === o.v}
                  className="mt-1 h-4 w-4 border-slate-300 text-moai-primary focus:ring-moai-primary"
                />
                <div>
                  <div className="text-sm font-medium">{o.label}</div>
                  <div className="text-xs text-moai-muted">{o.desc}</div>
                </div>
              </label>
            ))}
          </div>
        </div>

        {/* クワイエットアワー */}
        <div>
          <h3 className="section-title mb-2">🌙 おやすみ時間</h3>
          <p className="text-xs text-moai-muted mb-3">この時間帯はメール/LINEをまとめて翌朝配信します（アプリ内通知には影響しません）</p>
          <label className="flex items-center gap-2 mb-3 cursor-pointer">
            <input
              type="checkbox"
              name="quiet_hours_enabled"
              defaultChecked={quietEnabled}
              className="h-4 w-4 rounded border-slate-300 text-moai-primary focus:ring-moai-primary"
            />
            <span className="text-sm">おやすみ時間を有効にする</span>
          </label>
          <div className="grid grid-cols-2 gap-3 max-w-xs">
            <div>
              <label htmlFor="quiet_hours_start" className="label">開始</label>
              <input
                id="quiet_hours_start"
                name="quiet_hours_start"
                type="time"
                defaultValue={quietStart}
                className="input"
              />
            </div>
            <div>
              <label htmlFor="quiet_hours_end" className="label">終了</label>
              <input
                id="quiet_hours_end"
                name="quiet_hours_end"
                type="time"
                defaultValue={quietEnd}
                className="input"
              />
            </div>
          </div>
        </div>

        <button className="btn-primary w-full sm:w-auto">全体設定を保存</button>
      </ToastForm>

      {/* ── 種別ごとの詳細 ──────────────────── */}
      <ToastForm action={savePerKindPrefs} className="card space-y-6">
        <div>
          <h2 className="font-semibold text-lg">種別ごとの詳細</h2>
          <p className="text-xs text-moai-muted mt-1">それぞれの通知を個別に ON/OFF できます</p>
        </div>

        {GROUPS.map((group) => (
          <section key={group.id}>
            <h3 className="section-title mb-3 flex items-center gap-2">
              <span aria-hidden="true">{group.icon}</span>
              {group.label}
            </h3>
            <div className="rounded-lg border border-moai-border overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-slate-50">
                  <tr className="text-left">
                    <th className="p-3">通知</th>
                    <th className="p-3 text-center w-16">アプリ内</th>
                    <th className="p-3 text-center w-16">📧</th>
                    <th className="p-3 text-center w-16">💚</th>
                  </tr>
                </thead>
                <tbody>
                  {group.kinds.map((nk) => {
                    const pref = prefMap.get(nk.kind) as any;
                    return (
                      <tr key={nk.kind} className="border-t border-slate-100">
                        <td className="p-3">
                          <div className="font-medium">{nk.label}</div>
                          <div className="text-xs text-moai-muted">{nk.description}</div>
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
          </section>
        ))}

        <button className="btn-primary w-full sm:w-auto">種別設定を保存</button>
      </ToastForm>

      <p className="text-xs text-moai-muted text-center">
        ※ ダイジェストの実配信スケジュール設定は別途管理者が有効化します
      </p>
    </div>
  );
}

