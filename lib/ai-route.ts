// AI APIルート共通ヘルパー
// 認証 → クレジット消費 → generateText → レスポンスの共通パターンを抽出
import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { generateText } from "@/lib/ai";
import { consumeCredits } from "@/lib/credits";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { User } from "@supabase/supabase-js";

interface AiRouteOptions {
  featureSlug: string;
  buildPrompt: (
    req: Request,
    sb: SupabaseClient,
    user: User,
  ) => Promise<{ system: string; user: string; maxTokens?: number }>;
  /** true の場合、レスポンステキストから JSON を抽出してパースする */
  parseJson?: boolean;
}

export function createAiRouteHandler(options: AiRouteOptions) {
  return async function handler(req: Request): Promise<NextResponse> {
    const sb = await createClient();
    const { data: { user } } = await sb.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "unauthorized" }, { status: 401 });
    }

    const credit = await consumeCredits(user.id, options.featureSlug);
    if (!credit.ok) {
      return NextResponse.json(
        { error: credit.error, required: credit.required },
        { status: 402 },
      );
    }

    let prompt: { system: string; user: string; maxTokens?: number };
    try {
      prompt = await options.buildPrompt(req, sb, user);
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "invalid request";
      return NextResponse.json({ error: msg }, { status: 400 });
    }

    try {
      const text = await generateText(
        prompt.system,
        prompt.user,
        prompt.maxTokens ?? 1024,
      );

      if (options.parseJson) {
        const match = text.match(/[\[{][\s\S]*[\]}]/);
        if (!match) {
          return NextResponse.json({ error: "AI response parse failed" }, { status: 500 });
        }
        const json = JSON.parse(match[0]);
        return NextResponse.json(json);
      }

      return NextResponse.json({ text });
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "generation failed";
      return NextResponse.json({ error: msg }, { status: 500 });
    }
  };
}
