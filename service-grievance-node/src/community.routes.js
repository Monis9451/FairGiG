import express from "express";

import { requireRole } from "./middleware/auth.js";
import { isCommunityModerator } from "./middleware/authorization.js";
import {
  HttpError,
  asyncHandler,
  normalizeTagsOutput,
  parseTagsInput,
  success,
} from "./lib/http.js";
import { getSupabaseClient } from "./lib/supabase.js";

const router = express.Router();

const VALID_STATUS = new Set(["pending", "visible", "hidden", "removed"]);
/** Advocate moderation may only move posts between peer-visible states (not back to pending). */
const MODERATION_STATUS = new Set(["visible", "hidden", "removed"]);

/** Strip / normalize search so PostgREST `or=(...)` is not broken by commas or ILIKE wildcards. */
const sanitizeSearchInput = (raw) => {
  const s = String(raw || "")
    .trim()
    .replace(/,/g, " ")
    .replace(/%/g, "")
    .replace(/_/g, "")
    .slice(0, 200);
  return s;
};

const applyFeedFilters = (query, { category, platform, search }) => {
  let q = query;
  if (category) {
    q = q.eq("category", category);
  }
  if (platform) {
    q = q.eq("platform", platform);
  }
  const term = sanitizeSearchInput(search);
  if (term) {
    const pat = `%${term}%`;
    q = q.or(`title.ilike.${pat},body.ilike.${pat},category.ilike.${pat}`);
  }
  return q;
};

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

const mapPublicComment = (row) => ({
  id: row.id,
  body: row.body,
  created_at: row.created_at,
});

const enrichFeedWithEngagement = async (supabase, items, viewerId) => {
  if (!items.length) {
    return items;
  }
  const ids = items.map((i) => i.id);
  const { data, error } = await supabase.rpc("community_feed_engagement", {
    p_ids: ids,
    p_viewer: viewerId,
  });
  if (error) {
    console.warn("community: feed engagement RPC unavailable:", error.message);
    return items.map((item) => ({
      ...item,
      upvote_count: 0,
      comment_count: 0,
      viewer_upvoted: false,
    }));
  }
  const byId = new Map((data || []).map((row) => [row.post_id, row]));
  return items.map((item) => {
    const row = byId.get(item.id);
    return {
      ...item,
      upvote_count: Number(row?.upvote_count ?? 0),
      comment_count: Number(row?.comment_count ?? 0),
      viewer_upvoted: Boolean(row?.viewer_upvoted),
    };
  });
};

/** Advocate / moderation view includes author (internal only). */
const mapModerationPost = (row) => ({
  ...mapFeedPost(row),
  author_id: row.author_id,
  moderator_note: row.moderator_note,
  updated_at: row.updated_at,
});

const validateModerationStatus = (raw) => {
  const s = String(raw || "").trim().toLowerCase();
  if (!MODERATION_STATUS.has(s)) {
    throw new HttpError(
      400,
      `Invalid moderation status. Allowed: ${[...MODERATION_STATUS].join(", ")}.`
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
    const search = String(req.query.search || "").trim();

    const filterArgs = { category, platform, search };

    let countQuery = applyFeedFilters(
      supabase
        .from("community_posts")
        .select("*", { count: "exact", head: true })
        .eq("status", "visible"),
      filterArgs
    );

    let dataQuery = applyFeedFilters(
      supabase
        .from("community_posts")
        .select("id, title, body, platform, category, tags, status, created_at")
        .eq("status", "visible")
        .order("created_at", { ascending: false })
        .range(offset, offset + limit - 1),
      filterArgs
    );

    const [{ count: total, error: countError }, { data, error }] = await Promise.all([
      countQuery,
      dataQuery,
    ]);

    if (countError) {
      throw new HttpError(500, "Failed to count community feed.", countError.message);
    }
    if (error) {
      throw new HttpError(500, "Failed to load community feed.", error.message);
    }

    const baseItems = (data || []).map(mapFeedPost);
    const items = await enrichFeedWithEngagement(supabase, baseItems, req.authUser.id);
    const totalRows = typeof total === "number" ? total : items.length;

    return res.status(200).json(
      success({
        items,
        pagination: {
          limit,
          offset,
          total: totalRows,
          returned: items.length,
        },
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
  requireRole("advocate", "analyst"),
  asyncHandler(async (req, res) => {
    const supabase = getSupabaseClient();
    const statusFilter = String(req.query.status || "").trim().toLowerCase();
    const limit = Math.min(Math.max(Number(req.query.limit) || 50, 1), 200);
    const offset = Math.min(Math.max(Number(req.query.offset) || 0, 0), 5000);

    let countQuery = supabase
      .from("community_posts")
      .select("*", { count: "exact", head: true });

    let dataQuery = supabase
      .from("community_posts")
      .select("*")
      .order("created_at", { ascending: false })
      .range(offset, offset + limit - 1);

    if (statusFilter && VALID_STATUS.has(statusFilter)) {
      countQuery = countQuery.eq("status", statusFilter);
      dataQuery = dataQuery.eq("status", statusFilter);
    }

    const [{ count: total, error: countError }, { data, error }] = await Promise.all([
      countQuery,
      dataQuery,
    ]);

    if (countError) {
      throw new HttpError(500, "Failed to count moderation queue.", countError.message);
    }
    if (error) {
      throw new HttpError(500, "Failed to load moderation queue.", error.message);
    }

    const items = (data || []).map(mapModerationPost);
    const totalRows = typeof total === "number" ? total : items.length;

    return res.status(200).json(
      success({
        items,
        pagination: {
          limit,
          offset,
          total: totalRows,
          returned: items.length,
        },
      })
    );
  })
);

/**
 * Toggle upvote on a visible post (one per user per post).
 */
router.post(
  "/:id/upvote",
  asyncHandler(async (req, res) => {
    const supabase = getSupabaseClient();
    const id = ensureRequiredString(req.params.id, "id");
    const userId = req.authUser.id;

    const { data: post, error: postErr } = await supabase
      .from("community_posts")
      .select("id, status")
      .eq("id", id)
      .maybeSingle();

    if (postErr) {
      throw new HttpError(500, "Failed to verify post.", postErr.message);
    }
    if (!post || post.status !== "visible") {
      throw new HttpError(404, "Post not found or not available for engagement.");
    }

    const { data: existing, error: exErr } = await supabase
      .from("community_post_upvotes")
      .select("post_id")
      .eq("post_id", id)
      .eq("user_id", userId)
      .maybeSingle();

    if (exErr) {
      throw new HttpError(500, "Failed to check upvote.", exErr.message);
    }

    if (existing) {
      const { error: delErr } = await supabase
        .from("community_post_upvotes")
        .delete()
        .eq("post_id", id)
        .eq("user_id", userId);
      if (delErr) {
        throw new HttpError(500, "Failed to remove upvote.", delErr.message);
      }
    } else {
      const { error: insErr } = await supabase.from("community_post_upvotes").insert({
        post_id: id,
        user_id: userId,
      });
      if (insErr) {
        throw new HttpError(500, "Failed to add upvote.", insErr.message);
      }
    }

    const { data: stats, error: statsErr } = await supabase.rpc("community_feed_engagement", {
      p_ids: [id],
      p_viewer: userId,
    });

    if (!statsErr && stats?.[0]) {
      const row = stats[0];
      return res.status(200).json(
        success({
          upvote_count: Number(row.upvote_count ?? 0),
          viewer_upvoted: Boolean(row.viewer_upvoted),
        })
      );
    }

    console.warn("community: upvote refresh RPC fallback:", statsErr?.message);
    const { count, error: cErr } = await supabase
      .from("community_post_upvotes")
      .select("*", { count: "exact", head: true })
      .eq("post_id", id);
    if (cErr) {
      throw new HttpError(500, "Failed to refresh upvote counts.", cErr.message);
    }
    const { data: mine } = await supabase
      .from("community_post_upvotes")
      .select("post_id")
      .eq("post_id", id)
      .eq("user_id", userId)
      .maybeSingle();
    return res.status(200).json(
      success({
        upvote_count: Number(count ?? 0),
        viewer_upvoted: Boolean(mine),
      })
    );
  })
);

/** Comments on visible posts only; peers do not see author identity. */
router.get(
  "/:id/comments",
  asyncHandler(async (req, res) => {
    const supabase = getSupabaseClient();
    const id = ensureRequiredString(req.params.id, "id");
    const limit = Math.min(Math.max(Number(req.query.limit) || 80, 1), 200);

    const { data: post, error: postErr } = await supabase
      .from("community_posts")
      .select("id, status")
      .eq("id", id)
      .maybeSingle();

    if (postErr) {
      throw new HttpError(500, "Failed to verify post.", postErr.message);
    }
    if (!post || post.status !== "visible") {
      throw new HttpError(404, "Post not found.");
    }

    const { data, error } = await supabase
      .from("community_post_comments")
      .select("id, body, created_at")
      .eq("post_id", id)
      .order("created_at", { ascending: true })
      .limit(limit);

    if (error) {
      throw new HttpError(500, "Failed to load comments.", error.message);
    }

    return res.status(200).json(
      success({
        items: (data || []).map(mapPublicComment),
      })
    );
  })
);

router.post(
  "/:id/comments",
  asyncHandler(async (req, res) => {
    const supabase = getSupabaseClient();
    const id = ensureRequiredString(req.params.id, "id");
    const body = ensureRequiredString(req.body.body, "body");
    if (body.length > 4000) {
      throw new HttpError(400, "Comment is too long (max 4000 characters).");
    }

    const { data: post, error: postErr } = await supabase
      .from("community_posts")
      .select("id, status")
      .eq("id", id)
      .maybeSingle();

    if (postErr) {
      throw new HttpError(500, "Failed to verify post.", postErr.message);
    }
    if (!post || post.status !== "visible") {
      throw new HttpError(404, "Post not found or not open for comments.");
    }

    const { data, error } = await supabase
      .from("community_post_comments")
      .insert({
        post_id: id,
        author_id: req.authUser.id,
        body,
      })
      .select("id, body, created_at")
      .single();

    if (error) {
      throw new HttpError(500, "Failed to post comment.", error.message);
    }

    return res.status(201).json(success({ comment: mapPublicComment(data) }));
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

    if (isCommunityModerator(req.profile)) {
      const updates = {};
      if (req.body.status !== undefined) {
        updates.status = validateModerationStatus(req.body.status);
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
