import express from "express";
import cors from "cors";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import hpp from "hpp";
import axios from "axios";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";
import { createRequire } from "module";
import YAML from "yaml";

import { attachProfile, requireAuth, requireRole } from "./src/middleware/auth.js";
import { requireProfile } from "./src/middleware/authorization.js";
import { asyncHandler, success } from "./src/lib/http.js";
import { getSupabaseClient } from "./src/lib/supabase.js";
import { env } from "./src/config/env.js";
import uploadRoutes from "./src/gateway/uploads.routes.js";
import { downstreamBff } from "./src/middleware/downstreamBff.js";
import { downstreamNodeProxy } from "./src/middleware/downstreamNodeProxy.js";

const require = createRequire(import.meta.url);
const swaggerUi = require("swagger-ui-express");

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = env.port;
const NODE_ENV = env.nodeEnv;

const openApiPath = path.join(__dirname, "docs", "openapi.yaml");
let openApiDocument;
try {
  openApiDocument = YAML.parse(fs.readFileSync(openApiPath, "utf8"));
  const pathCount = Object.keys(openApiDocument.paths || {}).length;
  console.log(`OpenAPI loaded: ${pathCount} paths from ${openApiPath}`);
} catch (err) {
  console.warn("OpenAPI spec not loaded:", err.message);
  openApiDocument = {
    openapi: "3.0.3",
    info: { title: "FairGiG API", version: "0.0.0" },
    paths: {},
  };
}

const ALLOWED_ORIGINS = new Set([
  ...env.corsOrigins,
  `http://localhost:${PORT}`,
  `http://127.0.0.1:${PORT}`,
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

const downstreamServices = [
  { name: "auth-service", baseUrl: env.authServiceUrl },
  { name: "grievance-service", baseUrl: env.grievanceServiceUrl },
  { name: "analytics-service", baseUrl: env.analyticsServiceUrl },
  { name: "certificates-service", baseUrl: env.certificatesServiceUrl },
  { name: "anomaly-service", baseUrl: env.anomalyServiceUrl },
  { name: "earnings-service", baseUrl: env.earningsServiceUrl },
].filter((service) => Boolean(service.baseUrl));

const httpClient = axios.create({
  timeout: env.axiosTimeoutMs,
  headers: {
    Accept: "application/json",
    "User-Agent": "fairgig-service-api-gateway-node/1.0",
  },
});

httpClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response) {
      return Promise.resolve(error.response);
    }
    return Promise.reject(error);
  }
);

app.disable("x-powered-by");
app.set("trust proxy", 1);

app.use(
  helmet({
    crossOriginResourcePolicy: { policy: "cross-origin" },
    contentSecurityPolicy: {
      directives: {
        ...helmet.contentSecurityPolicy.getDefaultDirectives(),
        "script-src": ["'self'", "'unsafe-inline'"],
        "style-src": ["'self'", "'unsafe-inline'"],
        "img-src": ["'self'", "data:", "https:"],
      },
    },
  })
);

app.use(
  rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 300,
    standardHeaders: true,
    legacyHeaders: false,
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

      // In development, allow loopback origins so Swagger and local tools can test quickly.
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

/* Auth microservice (stream JSON bodies). */
app.use("/api/v1/auth", downstreamNodeProxy(env.authServiceUrl, "Auth service"));

/*
 * BFF → Python FastAPI (stream bodies; must run before global express.json()).
 * Browser calls only Node: /api/v1/earnings/* → earnings /api/v1/*, same for anomaly.
 */
const bffAuth = [requireAuth, attachProfile, requireProfile];
app.use("/api/v1/earnings", ...bffAuth, downstreamBff("earnings"));
app.use("/api/v1/anomaly", ...bffAuth, downstreamBff("anomaly"));

/*
 * Node microservice proxies must run before express.json() so JSON bodies are not
 * consumed on the gateway; the downstream service parses the raw stream.
 */
const dataRoutesAuth = [requireAuth, attachProfile, requireProfile];
app.use(
  "/api/grievances",
  ...dataRoutesAuth,
  downstreamNodeProxy(env.grievanceServiceUrl, "Grievance service")
);
app.use(
  "/api/community",
  ...dataRoutesAuth,
  downstreamNodeProxy(env.grievanceServiceUrl, "Grievance service")
);
app.use(
  "/api/analytics",
  ...dataRoutesAuth,
  downstreamNodeProxy(env.analyticsServiceUrl, "Analytics service")
);
app.use(
  "/api/certificates",
  ...dataRoutesAuth,
  downstreamNodeProxy(env.certificatesServiceUrl, "Certificate service")
);

app.use(express.json({ limit: "100kb" }));
app.use(express.urlencoded({ extended: false, limit: "100kb" }));

app.get("/", (_req, res) => {
  res.status(200).json({
    success: true,
    data: { message: "FairGiG API gateway is running" },
    error: null,
  });
});

app.get("/health", (_req, res) => {
  res.status(200).json({
    success: true,
    data: { service: "fairgig-service-api-gateway-node", status: "ok" },
    error: null,
  });
});

app.get("/services/health", async (_req, res, next) => {
  try {
    if (downstreamServices.length === 0) {
      return res.status(200).json({
        success: true,
        data: { services: [], message: "No downstream services configured" },
        error: null,
      });
    }

    const checks = await Promise.all(
      downstreamServices.map(async (service) => {
        try {
          const response = await httpClient.get(`${service.baseUrl}/health`);

          return {
            service: service.name,
            reachable: response.status >= 200 && response.status < 400,
            statusCode: response.status,
          };
        } catch (_error) {
          return {
            service: service.name,
            reachable: false,
            statusCode: null,
          };
        }
      })
    );

    return res.status(200).json({
      success: true,
      data: { services: checks },
      error: null,
    });
  } catch (error) {
    return next(error);
  }
});

app.get("/openapi.yaml", (_req, res) => {
  res.type("application/yaml").send(fs.readFileSync(openApiPath, "utf8"));
});

app.get("/openapi.json", (_req, res) => {
  res.json(openApiDocument);
});

// Avoid stale Swagger UI in the browser during local dev (friend sees new, you see old).
app.use("/api-docs", (req, res, next) => {
  res.setHeader("Cache-Control", "no-store, no-cache, must-revalidate, private");
  res.setHeader("Pragma", "no-cache");
  next();
});

app.use(
  "/api-docs",
  swaggerUi.serve,
  swaggerUi.setup(openApiDocument, {
    customSiteTitle: "FairGiG API",
    swaggerOptions: {
      persistAuthorization: true,
      tryItOutEnabled: true,
    },
  })
);

/** Who am I — use Supabase access token from sign-in (Bearer). */
app.get(
  "/api/v1/me",
  requireAuth,
  attachProfile,
  asyncHandler(async (req, res) => {
    let earnings_verification_summary = null;

    if (req.profile?.id) {
      try {
        const supabase = getSupabaseClient();
        const { data, error } = await supabase
          .from("earnings")
          .select("status, created_at")
          .eq("worker_id", req.authUser.id);

        if (!error && Array.isArray(data)) {
          const counts = {
            pending: 0,
            verified: 0,
            flagged: 0,
            unverifiable: 0,
          };
          let lastMs = 0;

          for (const row of data) {
            const s = String(row.status || "").toLowerCase();
            if (s in counts) {
              counts[s] += 1;
            }
            if (row.created_at) {
              const t = new Date(row.created_at).getTime();
              if (Number.isFinite(t) && t > lastMs) {
                lastMs = t;
              }
            }
          }

          earnings_verification_summary = {
            ...counts,
            total: data.length,
            last_shift_log_at: lastMs ? new Date(lastMs).toISOString() : null,
          };
        }
      } catch {
        earnings_verification_summary = null;
      }
    }

    res.status(200).json(
      success({
        user: {
          id: req.authUser.id,
          email: req.authUser.email,
          phone: req.authUser.phone,
        },
        profile: req.profile,
        earnings_verification_summary,
      })
    );
  })
);


app.get(
  "/api/v1/verifier/ping",
  requireAuth,
  attachProfile,
  requireRole("verifier"),
  (_req, res) => {
    res.status(200).json({
      success: true,
      data: { message: "verifier OK" },
      error: null,
    });
  }
);

app.use("/api/uploads", ...dataRoutesAuth, uploadRoutes);

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

app.listen(PORT, () => {
  console.log(`FairGiG API gateway listening on port ${PORT}`);
});
