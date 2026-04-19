/**
 * Cross-worker staff: verifier, advocate, analyst.
 * Advocate and analyst share the same product permissions; verifier retains shift verification on earnings.
 */
export const STAFF_ROLES = new Set(["verifier", "advocate", "analyst"]);

/** Community moderation: advocate and analyst (identical access). */
export const COMMUNITY_MODERATOR_ROLES = new Set(["advocate", "analyst"]);

export const isStaff = (profile) => Boolean(profile?.role && STAFF_ROLES.has(profile.role));

export const isCommunityModerator = (profile) =>
  Boolean(profile?.role && COMMUNITY_MODERATOR_ROLES.has(profile.role));

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
