import { createClient } from "@supabase/supabase-js";

import { env } from "../config/env.js";

let client;

/**
 * Anon-key client for server-side signUp / signInWithPassword (GoTrue).
 * Never use the service role key for these flows.
 */
export function getSupabaseAnonClient() {
  if (client) {
    return client;
  }

  const url = env.supabaseUrl;
  const key = env.supabaseAnonKey;

  if (!url || !key) {
    throw new Error("SUPABASE_URL and SUPABASE_ANON_KEY must be set for public auth");
  }

  client = createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  return client;
}
