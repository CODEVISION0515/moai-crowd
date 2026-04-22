import type { MetadataRoute } from "next";
import { createClient } from "@/lib/supabase/server";

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || "https://moai-crowd.vercel.app";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date();

  // 静的ページ
  const staticPages: MetadataRoute.Sitemap = [
    { url: `${APP_URL}/`, lastModified: now, changeFrequency: "daily", priority: 1.0 },
    { url: `${APP_URL}/signup`, lastModified: now, changeFrequency: "monthly", priority: 0.9 },
    { url: `${APP_URL}/login`, lastModified: now, changeFrequency: "monthly", priority: 0.5 },
    { url: `${APP_URL}/jobs`, lastModified: now, changeFrequency: "daily", priority: 0.9 },
    { url: `${APP_URL}/workers`, lastModified: now, changeFrequency: "daily", priority: 0.8 },
    { url: `${APP_URL}/community`, lastModified: now, changeFrequency: "hourly", priority: 0.8 },
    { url: `${APP_URL}/events`, lastModified: now, changeFrequency: "daily", priority: 0.6 },
    { url: `${APP_URL}/leaderboard`, lastModified: now, changeFrequency: "daily", priority: 0.5 },
    { url: `${APP_URL}/legal/terms`, lastModified: now, changeFrequency: "yearly", priority: 0.3 },
    { url: `${APP_URL}/legal/privacy`, lastModified: now, changeFrequency: "yearly", priority: 0.3 },
  ];

  try {
    const sb = await createClient();

    // 公開中の案件 (最新1000件)
    const { data: jobs } = await sb
      .from("jobs")
      .select("id, updated_at")
      .eq("status", "open")
      .order("updated_at", { ascending: false })
      .limit(1000);

    // 公開プロフィール (最新1000件)
    const { data: profiles } = await sb
      .from("profiles")
      .select("handle, updated_at, created_at")
      .eq("is_suspended", false)
      .not("handle", "is", null)
      .order("updated_at", { ascending: false })
      .limit(1000);

    // コミュニティ投稿 (最新500件)
    const { data: posts } = await sb
      .from("posts")
      .select("id, updated_at")
      .order("updated_at", { ascending: false })
      .limit(500);

    const jobPages: MetadataRoute.Sitemap = (jobs ?? []).map((j: any) => ({
      url: `${APP_URL}/jobs/${j.id}`,
      lastModified: new Date(j.updated_at),
      changeFrequency: "weekly",
      priority: 0.7,
    }));

    const profilePages: MetadataRoute.Sitemap = (profiles ?? []).map((p: any) => ({
      url: `${APP_URL}/profile/${p.handle}`,
      lastModified: new Date(p.updated_at ?? p.created_at),
      changeFrequency: "weekly",
      priority: 0.6,
    }));

    const postPages: MetadataRoute.Sitemap = (posts ?? []).map((p: any) => ({
      url: `${APP_URL}/community/${p.id}`,
      lastModified: new Date(p.updated_at),
      changeFrequency: "weekly",
      priority: 0.5,
    }));

    return [...staticPages, ...jobPages, ...profilePages, ...postPages];
  } catch {
    return staticPages;
  }
}
