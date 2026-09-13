/** TODO: Add purpose docstring. */
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { USE_MOCKS } from "@/lib/mocks/useMocks";
import { createMockSupabaseClient } from "@/lib/mocks/mockSupabaseClient";

export async function createClient() {
  if (USE_MOCKS) {
    // On Vercel the mock auth state lives in cookies, not globalThis.
    // Try to hydrate the mock client from the cookie so server-side
    // getUser() works after a client-side login.
    try {
      const cookieStore = await cookies();
      const uid = cookieStore.get("mock_auth_uid")?.value;
      const email = cookieStore.get("mock_auth_email")?.value;
      if (uid) {
        return createMockSupabaseClient({ id: uid, email: decodeURIComponent(email ?? "") });
      }
    } catch {
      // cookies() may throw in edge cases — fall through to plain mock
    }
    return createMockSupabaseClient();
  }

  const cookieStore = await cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) => {
              cookieStore.set(name, value, options);
            });
          } catch {
            // Server component — cookies can't be set here, handled by middleware
          }
        },
      },
    }
  );
}
