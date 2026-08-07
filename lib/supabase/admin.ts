import "server-only";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";

// Usa a service role key: bypassa RLS e pode criar usuários de auth.
// NUNCA importar este arquivo de um Client Component.
export function createAdminClient() {
  return createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    }
  );
}
