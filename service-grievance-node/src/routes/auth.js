import express from "express";

import { asyncHandler, HttpError, success } from "../lib/http.js";
import { getSupabaseAdmin } from "../lib/supabaseAdmin.js";
import { getSupabaseAnonClient } from "../lib/supabaseAnon.js";

const router = express.Router();

const anonClientOrThrow = () => {
  try {
    return getSupabaseAnonClient();
  } catch {
    throw new HttpError(
      503,
      "Auth signup/login not configured on server (set SUPABASE_URL and SUPABASE_ANON_KEY)"
    );
  }
};

const parseBody = (req) => {
  if (!req.body || typeof req.body !== "object" || Array.isArray(req.body)) {
    throw new HttpError(400, "JSON object body required.");
  }
  return req.body;
};

const requireEmailPassword = (body) => {
  const email = String(body.email || "").trim();
  const password = String(body.password || "");
  if (!email) {
    throw new HttpError(400, "email is required.");
  }
  if (!password) {
    throw new HttpError(400, "password is required.");
  }
  return { email, password };
};

const mapSession = (session) =>
  session
    ? {
        access_token: session.access_token,
        refresh_token: session.refresh_token,
        expires_in: session.expires_in,
        expires_at: session.expires_at,
        token_type: session.token_type,
      }
    : null;

const mapUser = (user) =>
  user
    ? {
        id: user.id,
        email: user.email ?? null,
        phone: user.phone ?? null,
        email_confirmed_at: user.email_confirmed_at ?? null,
      }
    : null;

const mapAuthPayload = (data, profile) => ({
  session: mapSession(data?.session),
  user: mapUser(data?.user),
  profile,
});

/**
 * Same row shape as GET /api/v1/me (service role; matches attachProfile select).
 * Returns null if user id missing, row not found, or admin client not configured.
 */
const fetchProfileForUserId = async (userId) => {
  if (!userId) {
    return null;
  }

  try {
    const supabase = getSupabaseAdmin();
    const { data: profile, error } = await supabase
      .from("profiles")
      .select("id, full_name, role, city_zone, created_at")
      .eq("id", userId)
      .maybeSingle();

    if (error) {
      console.warn("auth: profile lookup failed:", error.message);
      return null;
    }

    return profile;
  } catch (err) {
    if (String(err?.message || "").includes("SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY")) {
      return null;
    }
    throw err;
  }
};

router.post(
  "/signup",
  asyncHandler(async (req, res) => {
    const supabase = anonClientOrThrow();
    const body = parseBody(req);
    const { email, password } = requireEmailPassword(body);

    const fullName = body.full_name != null ? String(body.full_name).trim() : "";
    const cityZone = body.city_zone != null ? String(body.city_zone).trim() : "";

    const metadata = {};
    if (fullName) {
      metadata.full_name = fullName;
    }
    if (cityZone) {
      metadata.city_zone = cityZone;
    }

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      ...(Object.keys(metadata).length ? { options: { data: metadata } } : {}),
    });

    if (error) {
      throw new HttpError(400, error.message || "Signup failed.");
    }

    const profile = await fetchProfileForUserId(data?.user?.id);
    res.status(201).json(success(mapAuthPayload(data, profile)));
  })
);

router.post(
  "/login",
  asyncHandler(async (req, res) => {
    const supabase = anonClientOrThrow();
    const body = parseBody(req);
    const { email, password } = requireEmailPassword(body);

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      const msg = error.message || "Login failed.";
      const lower = msg.toLowerCase();
      const authFailure =
        lower.includes("invalid login credentials") ||
        lower.includes("invalid credentials") ||
        lower.includes("email not confirmed");
      throw new HttpError(authFailure ? 401 : 400, msg);
    }

    if (!data?.session) {
      throw new HttpError(
        401,
        "No session returned. Confirm your email or check project auth settings."
      );
    }

    const profile = await fetchProfileForUserId(data?.user?.id);
    res.status(200).json(success(mapAuthPayload(data, profile)));
  })
);

export default router;
