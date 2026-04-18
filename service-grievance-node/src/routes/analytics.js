import express from "express";

import {
  HttpError,
  asyncHandler,
  calculateMedian,
  roundTo,
  success,
} from "../lib/http.js";
import { requireRole } from "../middleware/auth.js";
import { isStaff } from "../middleware/authorization.js";
import { getSupabaseClient } from "../lib/supabase.js";

const router = express.Router();

const monthKey = (rawDate) => String(rawDate).slice(0, 7);

router.get(
  "/benchmarks/platform-city",
  asyncHandler(async (req, res) => {
    const supabase = getSupabaseClient();

    const platform = String(req.query.platform || "").trim();
    const cityZone = String(req.query.city_zone || req.query.cityZone || "").trim();

    if (!platform || !cityZone) {
      throw new HttpError(400, "Query params platform and city_zone are required.");
    }

    if (!isStaff(req.profile)) {
      const mine = String(req.profile.city_zone || "").trim();
      if (!mine || mine !== cityZone) {
        throw new HttpError(
          403,
          "Workers can only request benchmarks for their own city_zone."
        );
      }
    }

    const { data: profiles, error: profileError } = await supabase
      .from("profiles")
      .select("id")
      .eq("city_zone", cityZone);

    if (profileError) {
      throw new HttpError(500, "Failed to fetch profiles for benchmark.", profileError.message);
    }

    const workerIds = (profiles || []).map((profile) => profile.id).filter(Boolean);

    if (workerIds.length === 0) {
      return res.status(200).json(
        success({
          platform,
          city_zone: cityZone,
          metric: "median_hourly_pay",
          median_hourly_pay: 0,
          average_hourly_pay: 0,
          sample_size: 0,
        })
      );
    }

    const { data: earnings, error: earningsError } = await supabase
      .from("earnings")
      .select("worker_id, hours_worked, net_received")
      .eq("platform", platform)
      .eq("status", "verified")
      .in("worker_id", workerIds)
      .not("hours_worked", "is", null)
      .not("net_received", "is", null)
      .gt("hours_worked", 0);

    if (earningsError) {
      throw new HttpError(500, "Failed to fetch earnings for benchmark.", earningsError.message);
    }

    const hourlyRates = (earnings || [])
      .map((item) => Number(item.net_received) / Number(item.hours_worked))
      .filter((value) => Number.isFinite(value) && value > 0);

    const averageHourlyPay =
      hourlyRates.length > 0
        ? roundTo(
            hourlyRates.reduce((total, current) => total + current, 0) / hourlyRates.length
          )
        : 0;

    const medianHourlyPay =
      hourlyRates.length > 0 ? roundTo(calculateMedian(hourlyRates)) : 0;

    return res.status(200).json(
      success({
        platform,
        city_zone: cityZone,
        metric: "median_hourly_pay",
        median_hourly_pay: medianHourlyPay,
        average_hourly_pay: averageHourlyPay,
        sample_size: hourlyRates.length,
      })
    );
  })
);

router.get(
  "/vulnerability-flags",
  requireRole("verifier", "advocate"),
  asyncHandler(async (req, res) => {
    const supabase = getSupabaseClient();

    const threshold = Number(req.query.threshold || 20);
    if (!Number.isFinite(threshold) || threshold <= 0) {
      throw new HttpError(400, "threshold must be a positive number.");
    }

    const { data: earnings, error } = await supabase
      .from("earnings")
      .select("worker_id, date, net_received")
      .eq("status", "verified")
      .not("date", "is", null)
      .not("net_received", "is", null)
      .order("date", { ascending: true });

    if (error) {
      throw new HttpError(500, "Failed to fetch earnings for vulnerability flags.", error.message);
    }

    const monthTotalsByWorker = new Map();

    for (const item of earnings || []) {
      const workerId = String(item.worker_id || "").trim();
      const month = monthKey(item.date);
      const amount = Number(item.net_received);

      if (!workerId || month.length !== 7 || !Number.isFinite(amount)) {
        continue;
      }

      if (!monthTotalsByWorker.has(workerId)) {
        monthTotalsByWorker.set(workerId, new Map());
      }

      const workerMonths = monthTotalsByWorker.get(workerId);
      workerMonths.set(month, (workerMonths.get(month) || 0) + amount);
    }

    const rawFlags = [];

    for (const [workerId, monthTotals] of monthTotalsByWorker.entries()) {
      const months = [...monthTotals.keys()].sort();

      if (months.length < 2) {
        continue;
      }

      const previousMonth = months[months.length - 2];
      const currentMonth = months[months.length - 1];

      const previousMonthIncome = Number(monthTotals.get(previousMonth) || 0);
      const currentMonthIncome = Number(monthTotals.get(currentMonth) || 0);

      if (previousMonthIncome <= 0) {
        continue;
      }

      const dropPercentage =
        ((previousMonthIncome - currentMonthIncome) / previousMonthIncome) * 100;

      if (dropPercentage > threshold) {
        rawFlags.push({
          worker_id: workerId,
          previous_month: previousMonth,
          current_month: currentMonth,
          previous_month_income: roundTo(previousMonthIncome),
          current_month_income: roundTo(currentMonthIncome),
          drop_percentage: roundTo(dropPercentage),
        });
      }
    }

    let enrichedFlags = rawFlags;

    if (rawFlags.length > 0) {
      const workerIds = rawFlags.map((item) => item.worker_id);

      const { data: profiles, error: profilesError } = await supabase
        .from("profiles")
        .select("id, full_name, city_zone")
        .in("id", workerIds);

      if (profilesError) {
        throw new HttpError(
          500,
          "Failed to fetch profile metadata for vulnerability flags.",
          profilesError.message
        );
      }

      const profileMap = new Map((profiles || []).map((item) => [item.id, item]));

      enrichedFlags = rawFlags
        .map((item) => {
          const profile = profileMap.get(item.worker_id) || null;

          return {
            ...item,
            worker_name: profile?.full_name || null,
            city_zone: profile?.city_zone || null,
          };
        })
        .sort((a, b) => b.drop_percentage - a.drop_percentage);
    }

    return res.status(200).json(
      success({
        threshold_percentage: roundTo(threshold),
        count: enrichedFlags.length,
        workers: enrichedFlags,
      })
    );
  })
);

export default router;
