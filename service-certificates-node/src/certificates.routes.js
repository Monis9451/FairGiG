import express from "express";

import { HttpError, asyncHandler, roundTo, success } from "./lib/http.js";
import { isStaff } from "./middleware/authorization.js";
import { getSupabaseClient } from "./lib/supabase.js";

const router = express.Router();

const isIsoDate = (value) => /^\d{4}-\d{2}-\d{2}$/.test(String(value || ""));

router.get(
  "/workers/:workerId/verified-logs",
  asyncHandler(async (req, res) => {
    const supabase = getSupabaseClient();

    const workerId = String(req.params.workerId || "").trim();
    const fromDate = req.query.from;
    const toDate = req.query.to;

    if (!workerId) {
      throw new HttpError(400, "workerId is required.");
    }

    if (!isStaff(req.profile) && workerId !== req.authUser.id) {
      throw new HttpError(403, "You can only access your own certificate data.");
    }

    if (fromDate && !isIsoDate(fromDate)) {
      throw new HttpError(400, "from must be in YYYY-MM-DD format.");
    }

    if (toDate && !isIsoDate(toDate)) {
      throw new HttpError(400, "to must be in YYYY-MM-DD format.");
    }

    const { data: worker, error: workerError } = await supabase
      .from("profiles")
      .select("id, full_name, city_zone, role")
      .eq("id", workerId)
      .maybeSingle();

    if (workerError) {
      throw new HttpError(500, "Failed to fetch worker profile.", workerError.message);
    }

    if (!worker) {
      throw new HttpError(404, "Worker not found.");
    }

    let logsQuery = supabase
      .from("earnings")
      .select(
        "id, worker_id, platform, date, hours_worked, gross_earned, deductions, net_received, status, screenshot_url, anomaly_explanation, created_at"
      )
      .eq("worker_id", workerId)
      .eq("status", "verified")
      .order("date", { ascending: false });

    if (fromDate) {
      logsQuery = logsQuery.gte("date", fromDate);
    }

    if (toDate) {
      logsQuery = logsQuery.lte("date", toDate);
    }

    const { data: logs, error: logsError } = await logsQuery;

    if (logsError) {
      throw new HttpError(500, "Failed to fetch verified earnings logs.", logsError.message);
    }

    const summary = (logs || []).reduce(
      (totals, item) => {
        totals.total_hours += Number(item.hours_worked) || 0;
        totals.total_gross += Number(item.gross_earned) || 0;
        totals.total_deductions += Number(item.deductions) || 0;
        totals.total_net += Number(item.net_received) || 0;
        return totals;
      },
      {
        total_hours: 0,
        total_gross: 0,
        total_deductions: 0,
        total_net: 0,
      }
    );

    return res.status(200).json(
      success({
        worker,
        filters: {
          from: fromDate || null,
          to: toDate || null,
        },
        summary: {
          total_verified_logs: (logs || []).length,
          total_hours: roundTo(summary.total_hours),
          total_gross: roundTo(summary.total_gross),
          total_deductions: roundTo(summary.total_deductions),
          total_net: roundTo(summary.total_net),
        },
        logs: logs || [],
      })
    );
  })
);

export default router;
