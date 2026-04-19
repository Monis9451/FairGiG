import express from "express";

import {
  HttpError,
  asyncHandler,
  normalizeTagsOutput,
  parseBoundedInt,
  parseTagsInput,
  success,
} from "./lib/http.js";
import { isStaff } from "./middleware/authorization.js";
import { getSupabaseClient } from "./lib/supabase.js";

const router = express.Router();

const VALID_STATUSES = new Set(["open", "escalated", "resolved"]);

const mapGrievance = (grievance) => ({
  ...grievance,
  tags: normalizeTagsOutput(grievance?.tags),
});

/** Adds worker_full_name from public.profiles (same id as worker_id). */
const withWorkerFullNames = async (supabase, items) => {
  if (!Array.isArray(items) || items.length === 0) {
    return items;
  }
  const ids = [...new Set(items.map((i) => i.worker_id).filter(Boolean))];
  if (ids.length === 0) {
    return items;
  }
  const { data: rows, error } = await supabase.from("profiles").select("id, full_name").in("id", ids);
  if (error) {
    return items;
  }
  const map = new Map(
    (rows || []).map((r) => [String(r.id), ((r.full_name || "").trim() || null)])
  );
  return items.map((item) => ({
    ...item,
    worker_full_name: map.get(String(item.worker_id)) ?? null,
  }));
};

const canFallbackToStringTags = (error) => {
  const message = `${error?.message || ""} ${error?.details || ""}`.toLowerCase();
  return message.includes("tags") && message.includes("type");
};

const validateStatus = (rawStatus) => {
  const status = String(rawStatus || "").trim().toLowerCase();

  if (!status) {
    return "open";
  }

  if (!VALID_STATUSES.has(status)) {
    throw new HttpError(
      400,
      "Invalid status. Allowed values: open, escalated, resolved."
    );
  }

  return status;
};

const ensureRequiredString = (value, fieldName) => {
  const parsed = String(value || "").trim();
  if (!parsed) {
    throw new HttpError(400, `${fieldName} is required.`);
  }
  return parsed;
};

router.post(
  "/",
  asyncHandler(async (req, res) => {
    const supabase = getSupabaseClient();

    const workerId =
      req.profile.role === "worker"
        ? req.authUser.id
        : ensureRequiredString(req.body.worker_id, "worker_id");

    const payload = {
      worker_id: workerId,
      platform: ensureRequiredString(req.body.platform, "platform"),
      category: ensureRequiredString(req.body.category, "category"),
      description: ensureRequiredString(req.body.description, "description"),
      status: validateStatus(req.body.status),
      tags: parseTagsInput(req.body.tags),
    };

    let result = await supabase
      .from("grievances")
      .insert(payload)
      .select("*")
      .single();

    if (result.error && payload.tags.length > 0 && canFallbackToStringTags(result.error)) {
      result = await supabase
        .from("grievances")
        .insert({ ...payload, tags: payload.tags.join(",") })
        .select("*")
        .single();
    }

    if (result.error) {
      throw new HttpError(500, "Failed to create grievance.", result.error.message);
    }

    const mapped = mapGrievance(result.data);
    const [grievance] = await withWorkerFullNames(supabase, [mapped]);

    return res.status(201).json(
      success({
        grievance,
      })
    );
  })
);

router.get(
  "/",
  asyncHandler(async (req, res) => {
    const supabase = getSupabaseClient();

    const limit = parseBoundedInt(req.query.limit, 50, { min: 1, max: 200 });
    const offset = parseBoundedInt(req.query.offset, 0, { min: 0, max: 5000 });

    let workerId = String(req.query.worker_id || "").trim();
    if (!isStaff(req.profile)) {
      workerId = req.authUser.id;
    }
    const platform = String(req.query.platform || "").trim();
    const category = String(req.query.category || "").trim();
    const status = String(req.query.status || "").trim().toLowerCase();
    const tag = String(req.query.tag || "").trim().toLowerCase();
    const search = String(req.query.search || "").trim().toLowerCase();

    let query = supabase
      .from("grievances")
      .select("*")
      .order("created_at", { ascending: false })
      .range(offset, offset + limit - 1);

    if (workerId) {
      query = query.eq("worker_id", workerId);
    }

    if (platform) {
      query = query.eq("platform", platform);
    }

    if (category) {
      query = query.eq("category", category);
    }

    if (status) {
      query = query.eq("status", status);
    }

    const { data, error } = await query;

    if (error) {
      throw new HttpError(500, "Failed to fetch grievances.", error.message);
    }

    let items = (data || []).map(mapGrievance);

    if (tag) {
      items = items.filter((item) =>
        item.tags.some((currentTag) => currentTag.toLowerCase() === tag)
      );
    }

    if (search) {
      items = items.filter((item) => {
        const description = String(item.description || "").toLowerCase();
        const grievanceCategory = String(item.category || "").toLowerCase();
        return description.includes(search) || grievanceCategory.includes(search);
      });
    }

    items = await withWorkerFullNames(supabase, items);

    return res.status(200).json(
      success({
        items,
        pagination: {
          limit,
          offset,
          count: items.length,
        },
      })
    );
  })
);

router.get(
  "/:id",
  asyncHandler(async (req, res) => {
    const supabase = getSupabaseClient();

    const grievanceId = ensureRequiredString(req.params.id, "id");

    const { data, error } = await supabase
      .from("grievances")
      .select("*")
      .eq("id", grievanceId)
      .maybeSingle();

    if (error) {
      throw new HttpError(500, "Failed to fetch grievance.", error.message);
    }

    if (!data) {
      throw new HttpError(404, "Grievance not found.");
    }

    if (!isStaff(req.profile) && data.worker_id !== req.authUser.id) {
      throw new HttpError(404, "Grievance not found.");
    }

    const mapped = mapGrievance(data);
    const [grievance] = await withWorkerFullNames(supabase, [mapped]);

    return res.status(200).json(success({ grievance }));
  })
);

router.patch(
  "/:id",
  asyncHandler(async (req, res) => {
    const supabase = getSupabaseClient();

    const grievanceId = ensureRequiredString(req.params.id, "id");

    const updates = {};

    if (req.body.platform !== undefined) {
      updates.platform = ensureRequiredString(req.body.platform, "platform");
    }

    if (req.body.category !== undefined) {
      updates.category = ensureRequiredString(req.body.category, "category");
    }

    if (req.body.description !== undefined) {
      updates.description = ensureRequiredString(req.body.description, "description");
    }

    if (req.body.status !== undefined) {
      updates.status = validateStatus(req.body.status);
    }

    if (req.body.tags !== undefined) {
      updates.tags = parseTagsInput(req.body.tags);
    }

    if (Object.keys(updates).length === 0) {
      throw new HttpError(400, "No valid update fields were provided.");
    }

    let patchQuery = supabase.from("grievances").update(updates).eq("id", grievanceId);
    if (!isStaff(req.profile)) {
      patchQuery = patchQuery.eq("worker_id", req.authUser.id);
    }

    let result = await patchQuery.select("*").maybeSingle();

    if (result.error && updates.tags && canFallbackToStringTags(result.error)) {
      let retry = supabase
        .from("grievances")
        .update({ ...updates, tags: updates.tags.join(",") })
        .eq("id", grievanceId);
      if (!isStaff(req.profile)) {
        retry = retry.eq("worker_id", req.authUser.id);
      }
      result = await retry.select("*").maybeSingle();
    }

    if (result.error) {
      throw new HttpError(500, "Failed to update grievance.", result.error.message);
    }

    if (!result.data) {
      throw new HttpError(404, "Grievance not found.");
    }

    const mapped = mapGrievance(result.data);
    const [grievance] = await withWorkerFullNames(supabase, [mapped]);

    return res.status(200).json(success({ grievance }));
  })
);

router.post(
  "/:id/tags",
  asyncHandler(async (req, res) => {
    const supabase = getSupabaseClient();

    const grievanceId = ensureRequiredString(req.params.id, "id");
    const incomingTags = parseTagsInput(req.body.tags);

    if (incomingTags.length === 0) {
      throw new HttpError(400, "At least one tag is required.");
    }

    let fetchTags = supabase.from("grievances").select("id, tags").eq("id", grievanceId);
    if (!isStaff(req.profile)) {
      fetchTags = fetchTags.eq("worker_id", req.authUser.id);
    }

    const { data: current, error: fetchError } = await fetchTags.maybeSingle();

    if (fetchError) {
      throw new HttpError(500, "Failed to fetch current grievance tags.", fetchError.message);
    }

    if (!current) {
      throw new HttpError(404, "Grievance not found.");
    }

    const mergedTags = parseTagsInput([
      ...normalizeTagsOutput(current.tags),
      ...incomingTags,
    ]);

    let tagUpdate = supabase
      .from("grievances")
      .update({ tags: mergedTags })
      .eq("id", grievanceId);
    if (!isStaff(req.profile)) {
      tagUpdate = tagUpdate.eq("worker_id", req.authUser.id);
    }

    let result = await tagUpdate.select("*").maybeSingle();

    if (result.error && canFallbackToStringTags(result.error)) {
      let retry = supabase
        .from("grievances")
        .update({ tags: mergedTags.join(",") })
        .eq("id", grievanceId);
      if (!isStaff(req.profile)) {
        retry = retry.eq("worker_id", req.authUser.id);
      }
      result = await retry.select("*").maybeSingle();
    }

    if (result.error) {
      throw new HttpError(500, "Failed to add tags.", result.error.message);
    }

    const mapped = mapGrievance(result.data);
    const [grievance] = await withWorkerFullNames(supabase, [mapped]);

    return res.status(200).json(success({ grievance }));
  })
);

router.delete(
  "/:id",
  asyncHandler(async (req, res) => {
    const supabase = getSupabaseClient();

    const grievanceId = ensureRequiredString(req.params.id, "id");

    let del = supabase.from("grievances").delete().eq("id", grievanceId);
    if (!isStaff(req.profile)) {
      del = del.eq("worker_id", req.authUser.id);
    }

    const { data, error } = await del.select("id").maybeSingle();

    if (error) {
      throw new HttpError(500, "Failed to delete grievance.", error.message);
    }

    if (!data) {
      throw new HttpError(404, "Grievance not found.");
    }

    return res.status(200).json(success({ deleted: true, id: data.id }));
  })
);

export default router;
