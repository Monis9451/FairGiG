import express from "express";
import cors from "cors";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import hpp from "hpp";

import { env } from "./src/config/env.js";
import { attachProfile, requireAuth } from "./src/middleware/auth.js";
import { requireProfile } from "./src/middleware/authorization.js";
import grievancesRoutes from "./src/grievances.routes.js";
import communityRoutes from "./src/community.routes.js";

const app = express();
const NODE_ENV = env.nodeEnv;

const ALLOWED_ORIGINS = new Set([
  ...env.corsOrigins,
  `http://localhost:${env.port}`,
  `http://127.0.0.1:${env.port}`,
]);

const isLoopbackOrigin = (origin) => {
  if (!origin) {
    return false;
  }
  try {
    const parsed = new URL(origin);
    return ["localhost", "127.0.0.1"].includes(parsed.hostname);
  } catch {
    return false;
  }
};

app.disable("x-powered-by");
app.set("trust proxy", true);

app.get("/health", (_req, res) => {
  res.status(200).json({
    success: true,
    data: { service: "fairgig-service-grievance-node", status: "ok" },
    error: null,
  });
});

app.get("/", (_req, res) => {
  res.status(200).json({
    success: true,
    data: { message: "FairGiG grievance & community service is running" },
    error: null,
  });
});

app.use(
  helmet({
    crossOriginResourcePolicy: { policy: "cross-origin" },
    contentSecurityPolicy: false,
  })
);

app.use(
  rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 300,
    standardHeaders: true,
    legacyHeaders: false,
    skip: (req) => req.path === "/health" || req.path === "/",
    message: {
      success: false,
      data: null,
      error: "Too many requests. Please try again later.",
    },
  })
);

app.use(hpp());

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin || ALLOWED_ORIGINS.has(origin)) {
        return callback(null, true);
      }
      if (NODE_ENV !== "production" && isLoopbackOrigin(origin)) {
        return callback(null, true);
      }
      const corsError = new Error("Origin not allowed by CORS policy");
      corsError.statusCode = 403;
      return callback(corsError);
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  })
);

app.use(express.json({ limit: "100kb" }));
app.use(express.urlencoded({ extended: false, limit: "100kb" }));

const dataRoutesAuth = [requireAuth, attachProfile, requireProfile];

app.use("/api/grievances", ...dataRoutesAuth, grievancesRoutes);
app.use("/api/community", ...dataRoutesAuth, communityRoutes);

app.use((req, res) => {
  res.status(404).json({
    success: false,
    data: null,
    error: `Route ${req.method} ${req.originalUrl} not found`,
  });
});

app.use((err, _req, res, _next) => {
  console.error(err);

  const statusCode = err.statusCode || 500;
  const message =
    statusCode >= 500 && NODE_ENV === "production"
      ? "Internal server error"
      : err.message || "Internal server error";

  const payload = {
    success: false,
    data: null,
    error: message,
  };

  if (err.details && NODE_ENV !== "production") {
    payload.details = err.details;
  }

  res.status(statusCode).json(payload);
});

const LISTEN_HOST = process.env.HOST || "0.0.0.0";

app.listen(env.port, LISTEN_HOST, () => {
  console.log(`FairGiG grievance service listening on http://${LISTEN_HOST}:${env.port}`);
});
