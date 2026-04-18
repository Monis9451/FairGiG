import dotenv from "dotenv";

dotenv.config({ quiet: true });

const toNumber = (value, fallback) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
};

const parseOrigins = (rawOrigins) =>
  (rawOrigins || "http://localhost:5173,http://localhost:5000")
    .split(",")
    .map((origin) => origin.trim())
    .filter(Boolean);

const normalizeServiceUrl = (rawUrl) => {
  if (!rawUrl) {
    return null;
  }

  try {
    const parsed = new URL(rawUrl);

    if (!parsed.protocol || !["http:", "https:"].includes(parsed.protocol)) {
      return null;
    }

    parsed.username = "";
    parsed.password = "";
    return `${parsed.origin}${parsed.pathname.replace(/\/$/, "")}`;
  } catch {
    return null;
  }
};

export const env = {
  port: toNumber(process.env.PORT, 5000),
  nodeEnv: process.env.NODE_ENV || "development",
  corsOrigins: parseOrigins(process.env.CORS_ORIGIN),
  axiosTimeoutMs: toNumber(process.env.AXIOS_TIMEOUT_MS, 5000),
  anomalyServiceUrl: normalizeServiceUrl(process.env.ANOMALY_SERVICE_URL),
  earningsServiceUrl: normalizeServiceUrl(
    process.env.EARNINGS_SERVICE_URL || process.env.ANALYTICS_SERVICE_URL
  ),
  supabaseUrl: process.env.SUPABASE_URL || null,
  supabaseAnonKey: process.env.SUPABASE_ANON_KEY || null,
  supabaseServiceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY || null,
};
