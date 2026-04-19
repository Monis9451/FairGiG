import { createClient } from "@supabase/supabase-js";

import { env } from "../config/env.js";
import { HttpError } from "./http.js";

const supabaseKey = env.supabaseServiceRoleKey || env.supabaseAnonKey;

const supabaseClient =
  env.supabaseUrl && supabaseKey
    ? createClient(env.supabaseUrl, supabaseKey, {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      })
    : null;

export const getSupabaseClient = () => {
  if (!supabaseClient) {
    throw new HttpError(
      500,
      "Supabase client is not configured. Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY."
    );
  }

  return supabaseClient;
};
