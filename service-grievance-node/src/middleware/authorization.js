/** Roles that may access any worker's data (within these routes). */
export const STAFF_ROLES = new Set(["verifier", "advocate"]);

export const isStaff = (profile) => Boolean(profile?.role && STAFF_ROLES.has(profile.role));

/**
 * After attachProfile — rejects if no public.profiles row.
 */
export function requireProfile(req, res, next) {
  if (!req.profile) {
    return res.status(403).json({
      success: false,
      data: null,
      error: "No profile for this account.",
    });
  }
  return next();
}
