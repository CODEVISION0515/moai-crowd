import { updateSession } from "@/lib/supabase/middleware";
import type { NextRequest } from "next/server";

export async function middleware(request: NextRequest) {
  return updateSession(request);
}

export const config = {
  // 静的アセット・Next.js メタデータルート (opengraph-image, icon, manifest等) は middleware をスキップ
  // これをしないと Edge 間で image/binary レスポンスの body が消える
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|opengraph-image|twitter-image|icon|apple-icon|manifest\\.webmanifest|robots\\.txt|sitemap\\.xml|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)",
  ],
};
