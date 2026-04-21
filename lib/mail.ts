import { Resend } from "resend";

const apiKey = process.env.RESEND_API_KEY;
export const resend = apiKey ? new Resend(apiKey) : null;
export const MAIL_FROM = process.env.MAIL_FROM || "MOAI Crowd <noreply@moai.okinawa>";
export const APP_URL = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

export async function sendMail(to: string, subject: string, html: string) {
  if (!resend) {
    console.warn("[mail] RESEND_API_KEY未設定。送信をスキップ:", subject, "→", to);
    return;
  }
  await resend.emails.send({ from: MAIL_FROM, to, subject, html });
}

export function notificationTemplate(title: string, body: string | null, link: string | null) {
  const url = link ? `${APP_URL}${link}` : APP_URL;
  return `
    <div style="font-family: system-ui, sans-serif; max-width: 560px; margin: 0 auto; padding: 24px;">
      <div style="background: linear-gradient(135deg, #0f766e, #134e4a); color: white; padding: 20px; border-radius: 12px 12px 0 0;">
        <h1 style="margin: 0; font-size: 20px;">MOAI Crowd</h1>
      </div>
      <div style="background: white; border: 1px solid #e2e8f0; border-top: none; padding: 24px; border-radius: 0 0 12px 12px;">
        <h2 style="margin: 0 0 12px; font-size: 18px; color: #0f172a;">${escapeHtml(title)}</h2>
        ${body ? `<p style="color: #475569; line-height: 1.6;">${escapeHtml(body)}</p>` : ""}
        <div style="margin-top: 24px;">
          <a href="${url}" style="display: inline-block; background: #0f766e; color: white; text-decoration: none; padding: 12px 24px; border-radius: 8px; font-weight: 600;">詳細を見る</a>
        </div>
        <p style="margin-top: 32px; font-size: 12px; color: #94a3b8;">
          このメールはMOAI Crowdの通知設定により送信されています。<br />
          通知設定の変更は <a href="${APP_URL}/profile/edit" style="color: #0f766e;">プロフィール編集</a> から。
        </p>
      </div>
    </div>
  `;
}

function escapeHtml(s: string) {
  return s.replace(/[&<>"']/g, (c) => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;",
  }[c]!));
}

/**
 * 初めての方向けガイドメール。サインアップ後 onboarding 完了時などに送る。
 */
export function welcomeTemplate(displayName: string, intent: "client" | "worker" | null) {
  const ctaHref = intent === "client" ? "/jobs/new" : intent === "worker" ? "/jobs" : "/dashboard";
  const ctaLabel =
    intent === "client" ? "さっそく案件を投稿" : intent === "worker" ? "案件を探す" : "ダッシュボードへ";
  const bulletsByIntent: Record<"client" | "worker" | "both", string[]> = {
    client: [
      "🤖 AIで案件の下書きを30秒で生成",
      "💰 ローンチ6ヶ月は<strong>発注者手数料0%</strong>",
      "🎓 MOAI卒業生が受注するので安心",
      "🛡 エスクロー決済で納品確認後に支払い",
    ],
    worker: [
      "📋 AI・Web・デザインなど多彩な案件",
      "💸 手数料 <strong>5〜15%</strong>（業界最安級）",
      "🎓 卒業生は生涯<strong>5%固定</strong>",
      "✨ AIで応募文の下書きを自動生成",
    ],
    both: [
      "🤝 発注者にも受注者にもなれる",
      "💰 ローンチ6ヶ月は発注者手数料0%",
      "🤖 AIアシストで作業時間短縮",
      "🌱 コミュニティで学び合える",
    ],
  };
  const bullets = bulletsByIntent[intent ?? "both"];

  return `
    <div style="font-family: system-ui, sans-serif; max-width: 560px; margin: 0 auto; padding: 24px;">
      <div style="background: linear-gradient(135deg, #0f766e, #134e4a); color: white; padding: 32px 24px; border-radius: 12px 12px 0 0; text-align: center;">
        <h1 style="margin: 0 0 8px; font-size: 24px;">ようこそ、MOAI Crowd へ！</h1>
        <p style="margin: 0; opacity: 0.9; font-size: 14px;">業界最安手数料のAI特化クラウドソーシング</p>
      </div>
      <div style="background: white; border: 1px solid #e2e8f0; border-top: none; padding: 28px 24px; border-radius: 0 0 12px 12px;">
        <p style="margin: 0 0 16px; color: #0f172a; font-size: 16px;">${escapeHtml(displayName)}さん、登録ありがとうございます 🎉</p>
        <p style="margin: 0 0 20px; color: #475569; line-height: 1.7; font-size: 14px;">
          一歩踏み出す、AIの仕事を、沖縄から。<br />
          MOAI Crowd はあなたの活動を全力でサポートします。
        </p>

        <div style="background: #f0fdfa; border: 1px solid #ccfbf1; border-radius: 8px; padding: 16px 18px; margin: 20px 0;">
          <div style="font-size: 13px; font-weight: 600; color: #0f766e; margin-bottom: 10px;">✨ あなたが使える機能</div>
          <ul style="margin: 0; padding-left: 18px; color: #475569; font-size: 13px; line-height: 1.9;">
            ${bullets.map((b) => `<li>${b}</li>`).join("")}
          </ul>
        </div>

        <div style="text-align: center; margin: 28px 0 20px;">
          <a href="${APP_URL}${ctaHref}" style="display: inline-block; background: #0f766e; color: white; text-decoration: none; padding: 14px 28px; border-radius: 8px; font-weight: 600; font-size: 14px;">${ctaLabel}</a>
        </div>

        <div style="border-top: 1px solid #e2e8f0; padding-top: 20px; margin-top: 20px; font-size: 12px; color: #94a3b8; line-height: 1.7;">
          <strong style="color: #475569;">次の一歩として推奨：</strong><br />
          ① プロフィール写真を設定 → <a href="${APP_URL}/profile/edit" style="color: #0f766e;">プロフィール編集</a><br />
          ② コミュニティで自己紹介投稿 → <a href="${APP_URL}/community/new" style="color: #0f766e;">最初の投稿</a><br />
          ③ 通知設定を確認 → <a href="${APP_URL}/notifications/settings" style="color: #0f766e;">通知設定</a>
        </div>

        <p style="margin: 24px 0 0; font-size: 11px; color: #94a3b8; text-align: center;">
          本メールは登録完了通知として自動送信されています。<br />
          ご質問は contact@moai.okinawa までどうぞ。<br />
          運営: 株式会社CODEVISION
        </p>
      </div>
    </div>
  `;
}
