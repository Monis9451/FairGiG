import { createClient } from "@supabase/supabase-js";

let client;

/**
 * Service-role client for server-side auth.getUser(token) and profile queries.
 * Never use this in browser code.
 */
export function getSupabaseAdmin() {
  if (client) {
    return client;
  }

  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !key) {
    throw new Error("SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set for auth");
  }

  client = createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  return client;
}
