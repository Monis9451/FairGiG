import { getSupabaseAdmin } from "../lib/supabaseAdmin.js";

const bearer = (req) => {
  const raw = req.headers.authorization;
  if (!raw || typeof raw !== "string") {
    return null;
  }
  const [scheme, token] = raw.split(/\s+/);
  if (!scheme || scheme.toLowerCase() !== "bearer" || !token) {
    return null;
  }
  return token.trim();
};

/**
 * Validates Supabase access JWT using the service client (same as frontend token).
 */
export async function requireAuth(req, res, next) {
  const token = bearer(req);
  if (!token) {
    return res.status(401).json({
      success: false,
      data: null,
      error: "Missing Authorization: Bearer <access_token>",
    });
  }

  try {
    const supabase = getSupabaseAdmin();
    const {
      data: { user },
      error,
    } = await supabase.auth.getUser(token);

    if (error || !user) {
      return res.status(401).json({
        success: false,
        data: null,
        error: error?.message || "Invalid or expired token",
      });
    }

    req.authUser = user;
    return next();
  } catch (err) {
    if (err.message?.includes("SUPABASE_")) {
      return res.status(503).json({
        success: false,
        data: null,
        error: "Auth not configured on server (check Supabase env vars)",
      });
    }
    return next(err);
  }
}

/**
 * Loads public.profiles row for the authenticated user (profiles.id = auth.users.id).
 */
export async function attachProfile(req, res, next) {
  if (!req.authUser?.id) {
    return res.status(500).json({
      success: false,
      data: null,
      error: "attachProfile used without requireAuth",
    });
  }

  try {
    const supabase = getSupabaseAdmin();
    const { data: profile, error } = await supabase
      .from("profiles")
      .select("id, full_name, role, city_zone, created_at")
      .eq("id", req.authUser.id)
      .maybeSingle();

    if (error) {
      return res.status(500).json({
        success: false,
        data: null,
        error: error.message,
      });
    }

    req.profile = profile;
    return next();
  } catch (err) {
    return next(err);
  }
}

/** Allowed roles must match DB check on profiles.role */
export function requireRole(...allowed) {
  const set = new Set(allowed);
  return (req, res, next) => {
    if (!req.profile) {
      return res.status(403).json({
        success: false,
        data: null,
        error:
          "No profile row — create one for this user (trigger or signup hook)",
      });
    }
    if (!set.has(req.profile.role)) {
      return res.status(403).json({
        success: false,
        data: null,
        error: `Required role: ${[...set].join(" | ")}`,
      });
    }
    return next();
  };
}
