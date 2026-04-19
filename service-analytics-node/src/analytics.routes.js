import express from "express";

import {
  HttpError,
  asyncHandler,
  calculateMedian,
  normalizeTagsOutput,
  parseBoundedInt,
  roundTo,
  sampleStddev,
  success,
} from "./lib/http.js";
import { requireRole } from "./middleware/auth.js";
import { isStaff } from "./middleware/authorization.js";
import { getSupabaseClient } from "./lib/supabase.js";

const router = express.Router();

const monthKey = (rawDate) => String(rawDate).slice(0, 7);

const staffMonitoringRoles = requireRole("verifier", "advocate", "analyst");

const isoDateMonthsAgo = (monthsBack) => {
  const d = new Date();
  d.setUTCMonth(d.getUTCMonth() - monthsBack);
  return d.toISOString().slice(0, 10);
};

const isDeactivationGrievance = (row) => {
  const category = String(row?.category || "").toLowerCase();
  const description = String(row?.description || "").toLowerCase();
  const tags = normalizeTagsOutput(row?.tags).map((tag) => String(tag).toLowerCase());

  if (category.includes("deactiv")) {
    return true;
  }
  if (description.includes("deactiv")) {
    return true;
  }
  if (tags.some((tag) => tag.includes("deactiv"))) {
    return true;
  }

  return false;
};

const requireWorker = requireRole("worker");

/** Monday (UTC) start date YYYY-MM-DD for a shift date. */
function mondayWeekStartUtc(isoDateStr) {
  const datePart = String(isoDateStr || "").slice(0, 10);
  const d = new Date(`${datePart}T12:00:00.000Z`);
  if (Number.isNaN(d.getTime())) {
    return datePart;
  }
  const day = d.getUTCDay();
  const diff = (day + 6) % 7;
  d.setUTCDate(d.getUTCDate() - diff);
  return d.toISOString().slice(0, 10);
}

function periodBucket(isoDateStr, granularity) {
  const datePart = String(isoDateStr || "").slice(0, 10);
  if (granularity === "month") {
    const ym = datePart.slice(0, 7);
    return {
      period_key: ym,
      period_start: `${ym}-01`,
      period_label: ym,
    };
  }

  const weekStart = mondayWeekStartUtc(datePart);
  return {
    period_key: `week:${weekStart}`,
    period_start: weekStart,
    period_label: `Week of ${weekStart}`,
  };
}

function percentileNearestRank(sortedAsc, p) {
  if (!sortedAsc.length) {
    return 0;
  }
  const idx = Math.min(sortedAsc.length - 1, Math.max(0, Math.ceil(p * sortedAsc.length) - 1));
  return sortedAsc[idx];
}

function histogramEqualWidth(values, binCount) {
  if (!values.length) {
    return [];
  }
  const min = Math.min(...values);
  const max = Math.max(...values);
  if (min === max) {
    return [{ bucket_min: roundTo(min), bucket_max: roundTo(max), count: values.length }];
  }
  const width = (max - min) / binCount;
  const bins = Array.from({ length: binCount }, (_, i) => ({
    bucket_min: roundTo(min + i * width),
    bucket_max: roundTo(min + (i + 1) * width),
    count: 0,
  }));

  for (const v of values) {
    let i = Math.floor((v - min) / width);
    if (i >= binCount) {
      i = binCount - 1;
    }
    if (i < 0) {
      i = 0;
    }
    bins[i].count += 1;
  }

  return bins;
}

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
  requireRole("verifier", "advocate", "analyst"),
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

/**
 * Verified earnings only: average platform commission share (deductions / gross) by calendar month.
 */
router.get(
  "/commission-trends",
  staffMonitoringRoles,
  asyncHandler(async (req, res) => {
    const supabase = getSupabaseClient();
    const monthsBack = parseBoundedInt(req.query.months, 12, { min: 1, max: 36 });
    const fromDate = isoDateMonthsAgo(monthsBack);

    const { data: rows, error } = await supabase
      .from("earnings")
      .select("platform, date, gross_earned, deductions")
      .eq("status", "verified")
      .gte("date", fromDate)
      .not("date", "is", null)
      .not("gross_earned", "is", null)
      .not("deductions", "is", null)
      .limit(25_000);

    if (error) {
      throw new HttpError(500, "Failed to fetch earnings for commission trends.", error.message);
    }

    const buckets = new Map();

    for (const row of rows || []) {
      const platform = String(row.platform || "").trim() || "unknown";
      const month = monthKey(row.date);
      const gross = Number(row.gross_earned);
      const deductions = Number(row.deductions);

      if (!month || month.length !== 7 || !Number.isFinite(gross) || gross <= 0) {
        continue;
      }
      if (!Number.isFinite(deductions) || deductions < 0) {
        continue;
      }

      const share = Math.min(1, deductions / gross);
      const key = `${platform}\u0000${month}`;

      if (!buckets.has(key)) {
        buckets.set(key, { rates: [], grosses: [], deductions: [] });
      }

      const bucket = buckets.get(key);
      bucket.rates.push(share);
      bucket.grosses.push(gross);
      bucket.deductions.push(deductions);
    }

    const series = [];

    for (const [key, bucket] of buckets.entries()) {
      const [platform, month] = key.split("\u0000");
      const n = bucket.rates.length;
      const avgRate = bucket.rates.reduce((a, b) => a + b, 0) / n;
      const avgGross = bucket.grosses.reduce((a, b) => a + b, 0) / n;
      const avgDeduction = bucket.deductions.reduce((a, b) => a + b, 0) / n;

      series.push({
        platform,
        month,
        avg_commission_rate: roundTo(avgRate, 4),
        avg_commission_percent: roundTo(avgRate * 100, 2),
        sample_size: n,
        avg_gross_earned: roundTo(avgGross),
        avg_deductions: roundTo(avgDeduction),
      });
    }

    series.sort((a, b) => {
      if (a.month !== b.month) {
        return a.month.localeCompare(b.month);
      }
      return a.platform.localeCompare(b.platform);
    });

    const platforms = [...new Set(series.map((item) => item.platform))].sort();

    return res.status(200).json(
      success({
        metric:
          "Mean deductions/gross (commission share) on verified shift logs, grouped by platform and month.",
        from_date: fromDate,
        months_lookback: monthsBack,
        platforms,
        series,
      })
    );
  })
);

/**
 * Dispersion of net hourly pay (verified) by worker city_zone and platform — volatility proxy.
 */
router.get(
  "/income-volatility-by-zone",
  staffMonitoringRoles,
  asyncHandler(async (req, res) => {
    const supabase = getSupabaseClient();
    const lookbackMonths = parseBoundedInt(req.query.lookback_months, 24, { min: 1, max: 48 });
    const minSamples = parseBoundedInt(req.query.min_samples, 5, { min: 3, max: 500 });
    const platformFilter = String(req.query.platform || "").trim();
    const fromDate = isoDateMonthsAgo(lookbackMonths);

    let query = supabase
      .from("earnings")
      .select("worker_id, platform, hours_worked, net_received")
      .eq("status", "verified")
      .gte("date", fromDate)
      .not("hours_worked", "is", null)
      .not("net_received", "is", null)
      .gt("hours_worked", 0)
      .limit(30_000);

    if (platformFilter) {
      query = query.eq("platform", platformFilter);
    }

    const { data: rows, error } = await query;

    if (error) {
      throw new HttpError(500, "Failed to fetch earnings for volatility.", error.message);
    }

    const workerIds = [
      ...new Set((rows || []).map((row) => String(row.worker_id || "").trim()).filter(Boolean)),
    ];

    const cityByWorker = new Map();

    if (workerIds.length > 0) {
      const { data: profiles, error: profileError } = await supabase
        .from("profiles")
        .select("id, city_zone")
        .in("id", workerIds);

      if (profileError) {
        throw new HttpError(500, "Failed to load profiles for zones.", profileError.message);
      }

      for (const profile of profiles || []) {
        const zone = String(profile.city_zone || "").trim() || "(unknown zone)";
        cityByWorker.set(profile.id, zone);
      }
    }

    const groupMap = new Map();

    for (const row of rows || []) {
      const workerId = String(row.worker_id || "").trim();
      const platform = String(row.platform || "").trim() || "unknown";
      const hours = Number(row.hours_worked);
      const net = Number(row.net_received);

      if (!workerId || !Number.isFinite(hours) || !Number.isFinite(net) || hours <= 0) {
        continue;
      }

      const hourly = net / hours;
      if (!Number.isFinite(hourly) || hourly <= 0) {
        continue;
      }

      const cityZone = cityByWorker.get(workerId) || "(unknown zone)";
      const gKey = `${cityZone}\u0000${platform}`;

      if (!groupMap.has(gKey)) {
        groupMap.set(gKey, { city_zone: cityZone, platform, hourlies: [] });
      }

      groupMap.get(gKey).hourlies.push(hourly);
    }

    const zones = [];

    for (const group of groupMap.values()) {
      const values = group.hourlies;
      if (values.length < minSamples) {
        continue;
      }

      const mean = values.reduce((a, b) => a + b, 0) / values.length;
      const std = sampleStddev(values);
      const cv = mean > 1e-6 ? std / mean : 0;

      zones.push({
        city_zone: group.city_zone,
        platform: group.platform,
        sample_size: values.length,
        mean_hourly_net: roundTo(mean),
        median_hourly_net: roundTo(calculateMedian(values)),
        stdev_hourly_net: roundTo(std),
        coefficient_of_variation: roundTo(cv, 4),
        volatility_index_percent: roundTo(cv * 100, 2),
        min_hourly_net: roundTo(Math.min(...values)),
        max_hourly_net: roundTo(Math.max(...values)),
      });
    }

    zones.sort((a, b) => b.coefficient_of_variation - a.coefficient_of_variation);

    return res.status(200).json(
      success({
        metric:
          "Coefficient of variation (stdev/mean) of net hourly pay on verified logs, by city_zone and platform.",
        from_date: fromDate,
        lookback_months: lookbackMonths,
        min_samples: minSamples,
        platform_filter: platformFilter || null,
        count: zones.length,
        zones,
      })
    );
  })
);

/**
 * Group grievances into clusters (platform × city × category), with deactivation-focused filter.
 */
router.get(
  "/grievance-clusters",
  staffMonitoringRoles,
  asyncHandler(async (req, res) => {
    const supabase = getSupabaseClient();
    const focus = String(req.query.focus || "deactivation").trim().toLowerCase();
    const scanLimit = parseBoundedInt(req.query.limit, 500, { min: 50, max: 3000 });

    if (focus !== "deactivation" && focus !== "all") {
      throw new HttpError(400, "focus must be deactivation or all.");
    }

    const { data: grievances, error } = await supabase
      .from("grievances")
      .select("id, worker_id, platform, category, description, status, tags, created_at")
      .order("created_at", { ascending: false })
      .limit(scanLimit);

    if (error) {
      throw new HttpError(500, "Failed to fetch grievances for clustering.", error.message);
    }

    let rows = grievances || [];

    if (focus === "deactivation") {
      rows = rows.filter(isDeactivationGrievance);
    }

    const workerIds = [
      ...new Set(rows.map((row) => String(row.worker_id || "").trim()).filter(Boolean)),
    ];

    const cityByWorker = new Map();

    if (workerIds.length > 0) {
      const { data: profiles, error: profileError } = await supabase
        .from("profiles")
        .select("id, city_zone")
        .in("id", workerIds);

      if (profileError) {
        throw new HttpError(500, "Failed to load profiles for grievance clusters.", profileError.message);
      }

      for (const profile of profiles || []) {
        const zone = String(profile.city_zone || "").trim() || "(unknown zone)";
        cityByWorker.set(profile.id, zone);
      }
    }

    const clusters = new Map();

    for (const row of rows) {
      const workerId = String(row.worker_id || "").trim();
      const platform = String(row.platform || "").trim() || "(unknown platform)";
      const category = String(row.category || "").trim() || "(uncategorized)";
      const cityZone = workerId ? cityByWorker.get(workerId) || "(unknown zone)" : "(unknown zone)";
      const clusterId = `${platform}\u0000${cityZone}\u0000${category.toLowerCase()}`;

      if (!clusters.has(clusterId)) {
        clusters.set(clusterId, {
          cluster_id: clusterId,
          platform,
          city_zone: cityZone,
          category,
          count: 0,
          by_status: { open: 0, escalated: 0, resolved: 0 },
          tag_counts: new Map(),
          sample_ids: [],
        });
      }

      const bucket = clusters.get(clusterId);
      bucket.count += 1;

      const st = String(row.status || "open").toLowerCase();
      if (st === "open" || st === "escalated" || st === "resolved") {
        bucket.by_status[st] += 1;
      }

      for (const tag of normalizeTagsOutput(row.tags)) {
        const t = String(tag).trim().toLowerCase();
        if (!t) {
          continue;
        }
        bucket.tag_counts.set(t, (bucket.tag_counts.get(t) || 0) + 1);
      }

      if (bucket.sample_ids.length < 8) {
        bucket.sample_ids.push(row.id);
      }
    }

    const out = [...clusters.values()]
      .map((bucket) => {
        const top_tags = [...bucket.tag_counts.entries()]
          .map(([tag, count]) => ({ tag, count }))
          .sort((a, b) => b.count - a.count)
          .slice(0, 8);

        return {
          cluster_id: bucket.cluster_id,
          platform: bucket.platform,
          city_zone: bucket.city_zone,
          category: bucket.category,
          count: bucket.count,
          by_status: bucket.by_status,
          top_tags,
          sample_grievance_ids: bucket.sample_ids,
        };
      })
      .sort((a, b) => b.count - a.count);

    return res.status(200).json(
      success({
        focus,
        scan_limit: scanLimit,
        total_grievances_scanned: grievances?.length || 0,
        total_in_focus: rows.length,
        cluster_count: out.length,
        clusters: out,
      })
    );
  })
);

/**
 * Worker-only: weekly or monthly aggregates (net, hours, effective hourly, commission share).
 * Excludes unverifiable rows from money totals.
 */
router.get(
  "/worker/earnings-trends",
  requireWorker,
  asyncHandler(async (req, res) => {
    const supabase = getSupabaseClient();
    const granularityRaw = String(req.query.granularity || "month").trim().toLowerCase();
    const granularity = granularityRaw === "week" ? "week" : "month";
    const lookbackMonths = parseBoundedInt(req.query.lookback_months, 18, { min: 1, max: 60 });
    const platformFilter = String(req.query.platform || "").trim();
    const workerId = String(req.authUser.id || "").trim();

    const fromDate = isoDateMonthsAgo(lookbackMonths);

    let query = supabase
      .from("earnings")
      .select(
        "date, platform, hours_worked, gross_earned, deductions, net_received, status, created_at"
      )
      .eq("worker_id", workerId)
      .gte("date", fromDate)
      .not("date", "is", null)
      .neq("status", "unverifiable")
      .limit(10_000);

    if (platformFilter) {
      query = query.eq("platform", platformFilter);
    }

    const { data: rows, error } = await query.order("date", { ascending: true });

    if (error) {
      throw new HttpError(500, "Failed to fetch earnings for worker trends.", error.message);
    }

    const buckets = new Map();

    for (const row of rows || []) {
      const { period_key, period_start, period_label } = periodBucket(row.date, granularity);

      if (!buckets.has(period_key)) {
        buckets.set(period_key, {
          period_key,
          period_start,
          period_label,
          granularity,
          shift_count: 0,
          total_net: 0,
          total_hours: 0,
          total_gross: 0,
          total_deductions: 0,
        });
      }

      const b = buckets.get(period_key);
      b.shift_count += 1;

      const hours = Number(row.hours_worked);
      const net = Number(row.net_received);
      const gross = Number(row.gross_earned);
      const ded = Number(row.deductions);

      if (Number.isFinite(net)) {
        b.total_net += net;
      }
      if (Number.isFinite(hours) && hours > 0) {
        b.total_hours += hours;
      }
      if (Number.isFinite(gross) && gross > 0) {
        b.total_gross += gross;
      }
      if (Number.isFinite(ded) && ded >= 0) {
        b.total_deductions += ded;
      }
    }

    const series = [...buckets.values()]
      .map((b) => {
        const effectiveHourly =
          b.total_hours > 0 ? roundTo(b.total_net / b.total_hours) : 0;
        const avgCommissionRate =
          b.total_gross > 0 ? roundTo(b.total_deductions / b.total_gross, 4) : null;
        const avgCommissionPercent =
          avgCommissionRate != null ? roundTo(avgCommissionRate * 100, 2) : null;

        return {
          period_key: b.period_key,
          period_start: b.period_start,
          period_label: b.period_label,
          granularity: b.granularity,
          shift_count: b.shift_count,
          total_net: roundTo(b.total_net),
          total_hours: roundTo(b.total_hours, 2),
          total_gross: roundTo(b.total_gross),
          total_deductions: roundTo(b.total_deductions),
          effective_hourly_net: effectiveHourly,
          avg_commission_rate: avgCommissionRate,
          avg_commission_percent: avgCommissionPercent,
        };
      })
      .sort((a, b) => a.period_start.localeCompare(b.period_start));

    return res.status(200).json(
      success({
        metric:
          "Worker-scoped aggregates by week or month; excludes unverifiable logs from sums.",
        worker_id: workerId,
        from_date: fromDate,
        lookback_months: lookbackMonths,
        platform_filter: platformFilter || null,
        granularity,
        series,
      })
    );
  })
);

/**
 * Staff: grievance counts by category (and platform) in a rolling window — "top complaints this week".
 */
router.get(
  "/grievance-category-window",
  staffMonitoringRoles,
  asyncHandler(async (req, res) => {
    const supabase = getSupabaseClient();
    const days = parseBoundedInt(req.query.days, 7, { min: 1, max: 90 });

    const since = new Date();
    since.setUTCDate(since.getUTCDate() - days);
    const sinceIso = since.toISOString();

    const { data: rows, error } = await supabase
      .from("grievances")
      .select("id, platform, category, status, created_at")
      .gte("created_at", sinceIso)
      .order("created_at", { ascending: false })
      .limit(5000);

    if (error) {
      throw new HttpError(500, "Failed to fetch grievances for category window.", error.message);
    }

    const keys = new Map();

    for (const row of rows || []) {
      const category = String(row.category || "").trim() || "(uncategorized)";
      const platform = String(row.platform || "").trim() || "(unknown platform)";
      const key = `${platform}\u0000${category.toLowerCase()}`;

      if (!keys.has(key)) {
        keys.set(key, {
          platform,
          category,
          count: 0,
          by_status: { open: 0, escalated: 0, resolved: 0 },
        });
      }

      const bucket = keys.get(key);
      bucket.count += 1;
      const st = String(row.status || "open").toLowerCase();
      if (st === "open" || st === "escalated" || st === "resolved") {
        bucket.by_status[st] += 1;
      }
    }

    const categories = [...keys.values()].sort((a, b) => b.count - a.count);

    return res.status(200).json(
      success({
        days,
        since: sinceIso,
        total_in_window: rows?.length || 0,
        distinct_groups: categories.length,
        categories,
      })
    );
  })
);

/**
 * Staff: hourly pay distribution (percentiles + histogram) by city_zone and platform.
 */
router.get(
  "/income-distribution-by-zone",
  staffMonitoringRoles,
  asyncHandler(async (req, res) => {
    const supabase = getSupabaseClient();
    const lookbackMonths = parseBoundedInt(req.query.lookback_months, 24, { min: 1, max: 48 });
    const platformFilter = String(req.query.platform || "").trim();
    const minSamples = parseBoundedInt(req.query.min_samples, 8, { min: 5, max: 500 });
    const bins = parseBoundedInt(req.query.bins, 10, { min: 4, max: 24 });
    const fromDate = isoDateMonthsAgo(lookbackMonths);

    let query = supabase
      .from("earnings")
      .select("worker_id, platform, hours_worked, net_received")
      .eq("status", "verified")
      .gte("date", fromDate)
      .not("hours_worked", "is", null)
      .not("net_received", "is", null)
      .gt("hours_worked", 0)
      .limit(35_000);

    if (platformFilter) {
      query = query.eq("platform", platformFilter);
    }

    const { data: rows, error } = await query;

    if (error) {
      throw new HttpError(500, "Failed to fetch earnings for distribution.", error.message);
    }

    const workerIds = [
      ...new Set((rows || []).map((row) => String(row.worker_id || "").trim()).filter(Boolean)),
    ];

    const cityByWorker = new Map();

    if (workerIds.length > 0) {
      const { data: profiles, error: profileError } = await supabase
        .from("profiles")
        .select("id, city_zone")
        .in("id", workerIds);

      if (profileError) {
        throw new HttpError(500, "Failed to load profiles for distribution.", profileError.message);
      }

      for (const profile of profiles || []) {
        const zone = String(profile.city_zone || "").trim() || "(unknown zone)";
        cityByWorker.set(profile.id, zone);
      }
    }

    const groupMap = new Map();

    for (const row of rows || []) {
      const workerId = String(row.worker_id || "").trim();
      const platform = String(row.platform || "").trim() || "unknown";
      const hours = Number(row.hours_worked);
      const net = Number(row.net_received);

      if (!workerId || !Number.isFinite(hours) || !Number.isFinite(net) || hours <= 0) {
        continue;
      }

      const hourly = net / hours;
      if (!Number.isFinite(hourly) || hourly <= 0) {
        continue;
      }

      const cityZone = cityByWorker.get(workerId) || "(unknown zone)";
      const gKey = `${cityZone}\u0000${platform}`;

      if (!groupMap.has(gKey)) {
        groupMap.set(gKey, { city_zone: cityZone, platform, hourlies: [] });
      }

      groupMap.get(gKey).hourlies.push(hourly);
    }

    const zones = [];

    for (const group of groupMap.values()) {
      const values = [...group.hourlies].sort((a, b) => a - b);
      if (values.length < minSamples) {
        continue;
      }

      zones.push({
        city_zone: group.city_zone,
        platform: group.platform,
        sample_size: values.length,
        percentiles: {
          p10: roundTo(percentileNearestRank(values, 0.1)),
          p25: roundTo(percentileNearestRank(values, 0.25)),
          p50: roundTo(percentileNearestRank(values, 0.5)),
          p75: roundTo(percentileNearestRank(values, 0.75)),
          p90: roundTo(percentileNearestRank(values, 0.9)),
        },
        histogram: histogramEqualWidth(values, bins),
      });
    }

    zones.sort((a, b) => b.sample_size - a.sample_size);

    return res.status(200).json(
      success({
        metric:
          "Distribution of verified net hourly pay: percentiles and equal-width histogram bins per city_zone × platform.",
        from_date: fromDate,
        lookback_months: lookbackMonths,
        min_samples: minSamples,
        bins,
        platform_filter: platformFilter || null,
        count: zones.length,
        zones,
      })
    );
  })
);

export default router;
