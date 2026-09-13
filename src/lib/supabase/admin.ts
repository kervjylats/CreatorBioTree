import "server-only";
/**
 * Purpose: Creates a Supabase client with the service-role key, bypassing
 *          Row-Level Security. Used server-side only for operations that
 *          need unrestricted access (e.g. admin routes, purchase recording).
 *          In mock mode (USE_MOCKS=true), returns the in-memory mock client.
 */
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
