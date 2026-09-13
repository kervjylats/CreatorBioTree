/** TODO: Add purpose docstring. */
import { createClient } from "@supabase/supabase-js";
import { USE_MOCKS } from "@/lib/mocks/useMocks";
import { createMockSupabaseClient } from "@/lib/mocks/mockSupabaseClient";

export function createServiceClient() {
  if (USE_MOCKS) return createMockSupabaseClient();

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

  return createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}
