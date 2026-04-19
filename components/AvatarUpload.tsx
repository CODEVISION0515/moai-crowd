"use client";
import { useState } from "react";
import Image from "next/image";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";

export default function AvatarUpload({
  userId, currentUrl, displayName,
}: { userId: string; currentUrl: string | null; displayName: string }) {
  const [url, setUrl] = useState<string | null>(currentUrl);
  const [uploading, setUploading] = useState(false);

  async function onChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      toast.error("ファイルサイズは5MB以下にしてください");
      return;
    }
    setUploading(true);
    const sb = createClient();
    const ext = file.name.split(".").pop();
    const path = `${userId}/${Date.now()}.${ext}`;
    const { error } = await sb.storage.from("avatars").upload(path, file, { upsert: true });
    if (error) {
      toast.error(`アップロード失敗: ${error.message}`);
      setUploading(false);
      return;
    }
    const { data: pub } = sb.storage.from("avatars").getPublicUrl(path);
    await sb.from("profiles").update({ avatar_url: pub.publicUrl }).eq("id", userId);
    setUrl(pub.publicUrl);
    setUploading(false);
    toast.success("アイコンを更新しました");
  }

  return (
    <div className="flex items-center gap-4">
      <div className="h-24 w-24 rounded-full overflow-hidden bg-moai-primary/10 flex items-center justify-center text-3xl font-bold text-moai-primary border-4 border-white shadow-lg">
        {url ? (
          <Image
            src={url}
            alt={`${displayName}のアイコン`}
            width={96}
            height={96}
            className="h-full w-full object-cover"
          />
        ) : (
          <span aria-hidden="true">{displayName?.[0] ?? "?"}</span>
        )}
      </div>
      <div>
        <label className="btn-outline cursor-pointer">
          {uploading ? "アップロード中…" : "画像を選ぶ"}
          <input
            type="file"
            accept="image/*"
            className="hidden"
            onChange={onChange}
            disabled={uploading}
            aria-label="アイコン画像をアップロード"
          />
        </label>
        <p className="text-xs text-slate-500 mt-1">推奨: 正方形 / 5MB以下</p>
      </div>
    </div>
  );
}
