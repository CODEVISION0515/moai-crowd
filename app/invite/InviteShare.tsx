"use client";
import { useState } from "react";

export default function InviteShare({ url, code }: { url: string; code: string }) {
  const [copied, setCopied] = useState(false);

  async function copy() {
    try {
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(url);
      } else {
        // フォールバック（HTTP / 古い環境）
        const ta = document.createElement("textarea");
        ta.value = url;
        ta.style.position = "fixed";
        ta.style.opacity = "0";
        document.body.appendChild(ta);
        ta.select();
        document.execCommand("copy");
        document.body.removeChild(ta);
      }
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // noop
    }
  }

  const shareText = `MOAI Crowd で一緒に働きませんか？私の紹介URLから登録すると500クレジット獲得できます 🎁\n${url}`;
  const xUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}`;
  const lineUrl = `https://line.me/R/msg/text/?${encodeURIComponent(shareText)}`;

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <input readOnly value={url} className="input flex-1 text-sm font-mono" onFocus={(e) => e.target.select()} />
        <button onClick={copy} className="btn-primary btn-sm whitespace-nowrap">
          {copied ? "✓ コピー済" : "コピー"}
        </button>
      </div>
      <div className="text-xs text-slate-500">
        紹介コード: <span className="font-mono font-semibold">{code}</span>
      </div>
      <div className="flex gap-2">
        <a href={xUrl} target="_blank" rel="noopener noreferrer" className="btn-outline btn-sm flex-1 text-center">
          𝕏 でシェア
        </a>
        <a href={lineUrl} target="_blank" rel="noopener noreferrer" className="btn-outline btn-sm flex-1 text-center">
          LINE でシェア
        </a>
      </div>
    </div>
  );
}
