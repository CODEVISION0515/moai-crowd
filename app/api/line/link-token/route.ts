// LINE連携用ワンタイムトークン発行
import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST() {
  const sb = await createClient();
  const { data: { user } } = await sb.auth.getUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const token = "MOAI" + Math.random().toString(36).slice(2, 10).toUpperCase();
  await sb.from("line_link_tokens").insert({ token, user_id: user.id });
  return NextResponse.json({
    token,
    lineUrl: `https://line.me/R/ti/p/${process.env.LINE_OFFICIAL_ACCOUNT_ID || "@moai-crowd"}`,
  });
}
