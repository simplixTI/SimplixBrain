import { createClient } from "@supabase/supabase-js";

import type { Database } from "./database.types";

let cached: ReturnType<typeof createClient<Database>> | null = null;

export function getSupabaseAdmin() {
  if (cached) return cached;

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !serviceKey) {
    throw new Error(
      "Supabase admin client requires NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY.",
    );
  }

  cached = createClient<Database>(url, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  return cached;
}

export type SupabaseAdminClient = ReturnType<typeof getSupabaseAdmin>;
