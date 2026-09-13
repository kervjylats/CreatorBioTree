/** TODO: Add purpose docstring. */
import { createBrowserClient } from "@supabase/ssr";
import { USE_MOCKS } from "@/lib/mocks/useMocks";
import { createMockSupabaseClient } from "@/lib/mocks/mockSupabaseClient";

export function createClient() {
  if (USE_MOCKS) return createMockSupabaseClient();
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}
