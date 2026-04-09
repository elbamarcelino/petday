import { createClient } from "@supabase/supabase-js";

/**
 * Cliente Supabase com service role — bypassa RLS.
 * Use apenas em contextos de servidor sem sessão de usuário (ex: cron, webhooks).
 * NUNCA exponha no client-side.
 */
export function createAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !serviceKey) {
    throw new Error(
      "NEXT_PUBLIC_SUPABASE_URL ou SUPABASE_SERVICE_ROLE_KEY não configurados."
    );
  }

  return createClient(url, serviceKey, {
    auth: { persistSession: false },
  });
}
