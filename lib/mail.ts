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
