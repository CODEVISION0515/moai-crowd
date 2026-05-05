import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

export async function updateSession(request: NextRequest) {
  let response = NextResponse.next({ request });

  // Edge ランタイムで env が未設定だと middleware が throw して
  // サイト全体が 500 (MIDDLEWARE_INVOCATION_FAILED) になる。
  // 認証は各ページの requireUser / redirect で改めて担保するため、
  // env が無ければセッション更新だけスキップして素通しする。
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !anonKey) {
    if (process.env.NODE_ENV !== "production") {
      console.warn(
        "[middleware] NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_ANON_KEY が未設定のため、セッション更新をスキップしました",
      );
    }
    return response;
  }

  try {
    const supabase = createServerClient(url, anonKey, {
      cookies: {
        getAll: () => request.cookies.getAll(),
        setAll: (cookiesToSet: { name: string; value: string; options?: any }[]) => {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          response = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options),
          );
        },
      },
    });

    const {
      data: { user },
    } = await supabase.auth.getUser();

    const protectedPaths = ["/dashboard", "/jobs/new", "/messages", "/profile/edit"];
    const needsAuth = protectedPaths.some((p) => request.nextUrl.pathname.startsWith(p));
    if (needsAuth && !user) {
      const loginUrl = request.nextUrl.clone();
      loginUrl.pathname = "/login";
      loginUrl.searchParams.set("redirect", request.nextUrl.pathname);
      return NextResponse.redirect(loginUrl);
    }

    return response;
  } catch (err) {
    // Supabase との通信失敗でサイト全体を落とさない。
    // 認証チェックはページ側で行うので、middleware は素通しに倒す。
    console.error("[middleware] Supabase session refresh failed; passing through", err);
    return response;
  }
}
