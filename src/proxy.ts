/** Edge middleware — wildcard subdomain rewrite + auth/admin guards for the dashboard and admin routes. */
import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { USE_MOCKS } from "@/lib/mocks/useMocks";

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const host = request.headers.get('host') || '';

  // --- 1. WILDCARD SUBDOMAIN REWRITE LOGIC ---
  const rootDomain = process.env.NEXT_PUBLIC_ROOT_DOMAIN ?? "creatorpwa.app";
  const subdomainMatch = host.match(new RegExp(`^(.*?)\\.${rootDomain.replace(/\./g, '\\.')}`, "i"));
  const subdomainUsername = subdomainMatch ? subdomainMatch[1] : null;

  if (subdomainUsername && !pathname.startsWith('/dashboard') && !pathname.startsWith('/api') && !pathname.startsWith('/_next')) {
    const url = request.nextUrl.clone();
    url.pathname = `/${subdomainUsername}${pathname}`;
    return NextResponse.rewrite(url);
  }

  // --- 2. MOCK MODE AUTH GUARD ---
  // Mock mode requires an existing session cookie (set during login/onboarding).
  // No auto-provisioning — login/onboarding must be exercised from scratch.
  if (USE_MOCKS) {
    if (pathname.startsWith("/dashboard") || pathname.startsWith("/admin")) {
      const mockUid = request.cookies.get("mock_auth_uid")?.value;
      const mockEmail = request.cookies.get("mock_auth_email")?.value;

      if (!mockUid) {
        const loginUrl = new URL("/login", request.url);
        loginUrl.searchParams.set("next", pathname);
        return NextResponse.redirect(loginUrl);
      }

      const response = NextResponse.next({ request });
      // Persist the session for subsequent requests.
      response.cookies.set("mock_auth_uid", mockUid, { path: "/", maxAge: 3600 });
      response.cookies.set("mock_auth_email", mockEmail ?? "", { path: "/", maxAge: 3600 });

      if (pathname.startsWith("/admin")) {
        let isAdmin = false;
        try {
          const { getTable } = await import("@/lib/mocks/mockDataStore");
          const adminAccounts = getTable<{ user_id: string }>("admin_accounts");
          isAdmin = adminAccounts.some((a) => a.user_id === mockUid);
        } catch { /* fall through */ }
        if (!isAdmin) {
          return NextResponse.redirect(new URL("/dashboard", request.url));
        }
      }
      return response;
    }
    return NextResponse.next({ request: { headers: request.headers } });
  }

  // --- 3. REAL AUTH PROTECTION FOR DASHBOARD ---
  let response = NextResponse.next({
    request: { headers: request.headers },
  });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          response = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  const { data: { user } } = await supabase.auth.getUser();

  if (pathname.startsWith("/dashboard") || pathname.startsWith("/admin")) {
    if (!user) {
      const loginUrl = new URL("/login", request.url);
      loginUrl.searchParams.set("next", pathname);
      return NextResponse.redirect(loginUrl);
    }

    if (pathname.startsWith("/admin")) {
      const { data: creator } = await supabase
        .from("creators")
        .select("role")
        .eq("id", user.id)
        .maybeSingle();
      if (creator?.role !== "admin") {
        return NextResponse.redirect(new URL("/dashboard", request.url));
      }
    }
  }

  return response;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|api/|auth/|offline|sw\\.js|manifest\\.json|dashboard-manifest\\.json|icons/).*)",
  ],
};
