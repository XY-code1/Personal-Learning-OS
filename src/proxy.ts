import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

import { hasSupabasePublicEnv, isDevelopmentAuthBypassEnabled } from "@/lib/supabase/config";

const protectedPrefixes = ["/dashboard", "/inbox", "/notes", "/knowledge", "/topics", "/projects", "/tasks", "/experiments", "/reflections", "/timeline", "/search", "/ai", "/import-export", "/settings", "/workspace"];
const authPaths = ["/login", "/register", "/forgot-password"];

export async function proxy(request: NextRequest) {
  const pathname = request.nextUrl.pathname;
  const isProtected = protectedPrefixes.some((prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`));
  const isAuthPage = authPaths.includes(pathname);
  const bypassEnabled = isDevelopmentAuthBypassEnabled();

  // The development bypass only skips the redirect. Avoid an unnecessary
  // session round-trip here; protected pages still decide whether real user
  // data is available and RLS remains unchanged.
  if (isProtected && bypassEnabled) return NextResponse.next({ request });

  if (!hasSupabasePublicEnv()) {
    if (isProtected && !bypassEnabled) {
      const url = request.nextUrl.clone();
      url.pathname = "/login";
      url.searchParams.set("next", pathname);
      return NextResponse.redirect(url);
    }
    return NextResponse.next();
  }

  let response = NextResponse.next({ request });
  const supabase = createServerClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, {
    cookies: {
      getAll: () => request.cookies.getAll(),
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
        response = NextResponse.next({ request });
        cookiesToSet.forEach(({ name, value, options }) => response.cookies.set(name, value, options));
      },
    },
  });

  const { data: { user } } = await supabase.auth.getUser();

  if (isProtected && !user && !bypassEnabled) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    url.searchParams.set("next", pathname);
    return NextResponse.redirect(url);
  }

  if (isAuthPage && user) {
    const url = request.nextUrl.clone();
    url.pathname = "/workspace/dashboard";
    url.search = "";
    return NextResponse.redirect(url);
  }

  return response;
}

export const config = {
  matcher: ["/dashboard/:path*", "/inbox/:path*", "/notes/:path*", "/knowledge/:path*", "/topics/:path*", "/projects/:path*", "/tasks/:path*", "/experiments/:path*", "/reflections/:path*", "/timeline/:path*", "/search/:path*", "/ai/:path*", "/import-export/:path*", "/settings/:path*", "/workspace/:path*", "/login", "/register", "/forgot-password"],
};
