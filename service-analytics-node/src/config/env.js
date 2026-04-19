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

export const env = {
  port: toNumber(process.env.PORT, 5012),
  nodeEnv: process.env.NODE_ENV || "development",
  corsOrigins: parseOrigins(process.env.CORS_ORIGIN),
  supabaseUrl: process.env.SUPABASE_URL || null,
  supabaseAnonKey: process.env.SUPABASE_ANON_KEY || null,
  supabaseServiceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY || null,
};
