import express from "express";

import { requireRole } from "../middleware/auth.js";
import {
  HttpError,
  asyncHandler,
  normalizeTagsOutput,
  parseTagsInput,
  success,
} from "../lib/http.js";
import { getSupabaseClient } from "../lib/supabase.js";

const router = express.Router();

const VALID_STATUS = new Set(["pending", "visible", "hidden", "removed"]);

const ensureRequiredString = (value, fieldName) => {
  const parsed = String(value || "").trim();
  if (!parsed) {
    throw new HttpError(400, `${fieldName} is required.`);
  }
  return parsed;
};

const mapFeedPost = (row) => ({
  id: row.id,
  title: row.title,
  body: row.body,
  platform: row.platform,
  category: row.category,
  tags: normalizeTagsOutput(row.tags),
  status: row.status,
  created_at: row.created_at,
});

/** Advocate / moderation view includes author (internal only). */
const mapModerationPost = (row) => ({
  ...mapFeedPost(row),
  author_id: row.author_id,
  moderator_note: row.moderator_note,
  updated_at: row.updated_at,
});

const validateStatus = (raw) => {
  const s = String(raw || "").trim().toLowerCase();
  if (!VALID_STATUS.has(s)) {
    throw new HttpError(
      400,
      `Invalid status. Allowed: ${[...VALID_STATUS].join(", ")}.`
    );
  }
  return s;
};

/**
 * Public-ish feed: only posts approved as visible. No author fields (4th persona: anonymous to peers).
 */
router.get(
  "/feed",
  asyncHandler(async (req, res) => {
    const supabase = getSupabaseClient();
    const limit = Math.min(Math.max(Number(req.query.limit) || 50, 1), 200);
    const offset = Math.min(Math.max(Number(req.query.offset) || 0, 0), 5000);
    const category = String(req.query.category || "").trim();
    const platform = String(req.query.platform || "").trim();
    const search = String(req.query.search || "").trim().toLowerCase();

    let query = supabase
      .from("community_posts")
      .select("id, title, body, platform, category, tags, status, created_at")
      .eq("status", "visible")
      .order("created_at", { ascending: false })
      .range(offset, offset + limit - 1);

    if (category) {
      query = query.eq("category", category);
    }
    if (platform) {
      query = query.eq("platform", platform);
    }

    const { data, error } = await query;

    if (error) {
      throw new HttpError(500, "Failed to load community feed.", error.message);
    }

    let items = (data || []).map(mapFeedPost);
    if (search) {
      items = items.filter((p) => {
        const t = `${p.title} ${p.body} ${p.category}`.toLowerCase();
        return t.includes(search);
      });
    }

    return res.status(200).json(
      success({
        items,
        pagination: { limit, offset, count: items.length },
      })
    );
  })
);

/**
 * Worker's own posts (any status), includes that they are the author (only in this list).
 */
router.get(
  "/mine",
  requireRole("worker"),
  asyncHandler(async (req, res) => {
    const supabase = getSupabaseClient();

    const { data, error } = await supabase
      .from("community_posts")
      .select(
        "id, title, body, platform, category, tags, status, moderator_note, created_at, updated_at"
      )
      .eq("author_id", req.authUser.id)
      .order("created_at", { ascending: false });

    if (error) {
      throw new HttpError(500, "Failed to load your community posts.", error.message);
    }

    return res.status(200).json(
      success({
        items: (data || []).map((row) => ({
          ...mapFeedPost(row),
          moderator_note: row.moderator_note,
          updated_at: row.updated_at,
        })),
      })
    );
  })
);

/** Workers post rate intel / complaints; stored with author_id server-side only. */
router.post(
  "/",
  requireRole("worker"),
  asyncHandler(async (req, res) => {
    const supabase = getSupabaseClient();

    const body = ensureRequiredString(req.body.body, "body");
    const title = req.body.title != null ? String(req.body.title).trim() : "";
    const platform = req.body.platform != null ? String(req.body.platform).trim() : null;
    const category =
      req.body.category != null && String(req.body.category).trim()
        ? String(req.body.category).trim()
        : "general";
    const tags = parseTagsInput(req.body.tags);

    const payload = {
      author_id: req.authUser.id,
      title,
      body,
      platform: platform || null,
      category,
      tags,
      status: "pending",
    };

    const { data, error } = await supabase.from("community_posts").insert(payload).select("*").single();

    if (error) {
      throw new HttpError(500, "Failed to create community post.", error.message);
    }

    return res.status(201).json(
      success({
        post: {
          ...mapFeedPost(data),
          moderator_note: data.moderator_note,
          updated_at: data.updated_at,
        },
      })
    );
  })
);

/** Advocate queue: all posts with author_id for moderation. */
router.get(
  "/moderation",
  requireRole("advocate"),
  asyncHandler(async (req, res) => {
    const supabase = getSupabaseClient();
    const statusFilter = String(req.query.status || "").trim().toLowerCase();

    let query = supabase
      .from("community_posts")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(200);

    if (statusFilter && VALID_STATUS.has(statusFilter)) {
      query = query.eq("status", statusFilter);
    }

    const { data, error } = await query;

    if (error) {
      throw new HttpError(500, "Failed to load moderation queue.", error.message);
    }

    return res.status(200).json(
      success({
        items: (data || []).map(mapModerationPost),
      })
    );
  })
);

router.patch(
  "/:id",
  asyncHandler(async (req, res) => {
    const supabase = getSupabaseClient();
    const id = ensureRequiredString(req.params.id, "id");
    const role = req.profile.role;

    const { data: existing, error: fetchError } = await supabase
      .from("community_posts")
      .select("*")
      .eq("id", id)
      .maybeSingle();

    if (fetchError) {
      throw new HttpError(500, "Failed to fetch post.", fetchError.message);
    }
    if (!existing) {
      throw new HttpError(404, "Post not found.");
    }

    if (role === "advocate") {
      const updates = {};
      if (req.body.status !== undefined) {
        updates.status = validateStatus(req.body.status);
      }
      if (req.body.moderator_note !== undefined) {
        updates.moderator_note =
          req.body.moderator_note === null
            ? null
            : String(req.body.moderator_note).trim() || null;
      }
      if (req.body.tags !== undefined) {
        updates.tags = parseTagsInput(req.body.tags);
      }
      if (Object.keys(updates).length === 0) {
        throw new HttpError(400, "No moderation fields to update.");
      }

      const { data, error } = await supabase
        .from("community_posts")
        .update(updates)
        .eq("id", id)
        .select("*")
        .maybeSingle();

      if (error) {
        throw new HttpError(500, "Failed to update post.", error.message);
      }
      return res.status(200).json(success({ post: mapModerationPost(data) }));
    }

    if (role === "worker" && existing.author_id === req.authUser.id && existing.status === "pending") {
      const updates = {};
      if (req.body.body !== undefined) {
        updates.body = ensureRequiredString(req.body.body, "body");
      }
      if (req.body.title !== undefined) {
        updates.title = String(req.body.title || "").trim();
      }
      if (req.body.platform !== undefined) {
        updates.platform = req.body.platform
          ? String(req.body.platform).trim()
          : null;
      }
      if (req.body.category !== undefined && String(req.body.category).trim()) {
        updates.category = String(req.body.category).trim();
      }
      if (req.body.tags !== undefined) {
        updates.tags = parseTagsInput(req.body.tags);
      }
      if (Object.keys(updates).length === 0) {
        throw new HttpError(400, "No editable fields provided.");
      }

      const { data, error } = await supabase
        .from("community_posts")
        .update(updates)
        .eq("id", id)
        .eq("author_id", req.authUser.id)
        .eq("status", "pending")
        .select("*")
        .maybeSingle();

      if (error) {
        throw new HttpError(500, "Failed to update post.", error.message);
      }
      if (!data) {
        throw new HttpError(404, "Post not found or no longer editable.");
      }
      return res.status(200).json(
        success({
          post: {
            ...mapFeedPost(data),
            moderator_note: data.moderator_note,
            updated_at: data.updated_at,
          },
        })
      );
    }

    throw new HttpError(403, "You cannot update this post.");
  })
);

export default router;
