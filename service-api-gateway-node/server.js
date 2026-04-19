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

const jsonBodyLimited = express.json({ limit: "100kb" });

const gatewayDir = path.dirname(fileURLToPath(import.meta.url));
const monorepoAuthPackageJson = path.join(gatewayDir, "..", "service-auth-node", "package.json");

if (env.inlineNodeServices && !fs.existsSync(monorepoAuthPackageJson)) {
  console.error(
    "[FairGiG] INLINE_NODE_SERVICES=1 but sibling folder service-auth-node/ is missing from this deploy."
  );
  console.error(
    "[FairGiG] Fix Railway: Settings → set Root Directory to empty (entire repo), not service-api-gateway-node only."
  );
  console.error(
    "[FairGiG] Or unset INLINE_NODE_SERVICES and set AUTH_SERVICE_URL, GRIEVANCE_SERVICE_URL, etc."
  );
  process.exit(1);
}

const inlineBundles = env.inlineNodeServices
  ? await (async () => {
      const [
        { default: authRoutes },
        { default: grievancesRoutes },
        { default: communityRoutes },
        { default: analyticsRoutes },
        { default: certificatesRoutes },
      ] = await Promise.all([
        import(new URL("../service-auth-node/src/auth.routes.js", import.meta.url).href),
        import(new URL("../service-grievance-node/src/grievances.routes.js", import.meta.url).href),
        import(new URL("../service-grievance-node/src/community.routes.js", import.meta.url).href),
        import(new URL("../service-analytics-node/src/analytics.routes.js", import.meta.url).href),
        import(new URL("../service-certificates-node/src/certificates.routes.js", import.meta.url).href),
      ]);
      return {
        authRoutes,
        grievancesRoutes,
        communityRoutes,
        analyticsRoutes,
        certificatesRoutes,
      };
    })().catch((err) => {
      console.error("INLINE_NODE_SERVICES: failed to load in-process route modules:", err);
      throw err;
    })
  : null;

if (env.inlineNodeServices) {
  console.log(
    "INLINE_NODE_SERVICES=1: auth, grievances, community, analytics, certificates are in-process"
  );
}

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
  ...(env.inlineNodeServices
    ? []
    : [
        { name: "auth-service", baseUrl: env.authServiceUrl },
        { name: "grievance-service", baseUrl: env.grievanceServiceUrl },
        { name: "analytics-service", baseUrl: env.analyticsServiceUrl },
        { name: "certificates-service", baseUrl: env.certificatesServiceUrl },
      ]),
  { name: "anomaly-service", baseUrl: env.anomalyServiceUrl },
  { name: "earnings-service", baseUrl: env.earningsServiceUrl },
].filter((service) => Boolean(service.baseUrl));

const bundledNodeHealthChecks = env.inlineNodeServices
  ? [
      { service: "auth-service", reachable: true, statusCode: 200, bundled: true },
      { service: "grievance-service", reachable: true, statusCode: 200, bundled: true },
      { service: "analytics-service", reachable: true, statusCode: 200, bundled: true },
      { service: "certificates-service", reachable: true, statusCode: 200, bundled: true },
    ]
  : [];

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
app.set("trust proxy", true);

/* Fast paths for load balancers (before helmet / rate limits). */
app.get("/health", (_req, res) => {
  res.status(200).json({
    success: true,
    data: { service: "fairgig-service-api-gateway-node", status: "ok" },
    error: null,
  });
});

app.get("/", (_req, res) => {
  res.status(200).json({
    success: true,
    data: { message: "FairGiG API gateway is running" },
    error: null,
  });
});

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

const dataRoutesAuth = [requireAuth, attachProfile, requireProfile];

/* Auth: separate process (proxy) or in-process when INLINE_NODE_SERVICES=1. */
if (inlineBundles) {
  const authRouter = express.Router();
  authRouter.use(jsonBodyLimited);
  authRouter.use(inlineBundles.authRoutes);
  app.use("/api/v1/auth", authRouter);
} else {
  /* Proxy streams JSON bodies; keep before global express.json(). */
  app.use("/api/v1/auth", downstreamNodeProxy(env.authServiceUrl, "Auth service"));
}

/*
 * BFF → Python FastAPI (stream bodies; must run before global express.json()).
 * Browser calls only Node: /api/v1/earnings/* → earnings /api/v1/*, same for anomaly.
 */
const bffAuth = [requireAuth, attachProfile, requireProfile];
app.use("/api/v1/earnings", ...bffAuth, downstreamBff("earnings"));
app.use("/api/v1/anomaly", ...bffAuth, downstreamBff("anomaly"));

/*
 * Grievance / analytics / certificates: proxy to other Node services, or in-process.
 * Proxies must run before express.json() so bodies are not consumed here.
 */
if (inlineBundles) {
  app.use("/api/grievances", ...dataRoutesAuth, jsonBodyLimited, inlineBundles.grievancesRoutes);
  app.use("/api/community", ...dataRoutesAuth, jsonBodyLimited, inlineBundles.communityRoutes);
  app.use("/api/analytics", ...dataRoutesAuth, jsonBodyLimited, inlineBundles.analyticsRoutes);
  app.use("/api/certificates", ...dataRoutesAuth, jsonBodyLimited, inlineBundles.certificatesRoutes);
} else {
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
}

app.use(express.json({ limit: "100kb" }));
app.use(express.urlencoded({ extended: false, limit: "100kb" }));

app.get("/services/health", async (_req, res, next) => {
  try {
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

    const services = [...bundledNodeHealthChecks, ...checks];

    if (services.length === 0) {
      return res.status(200).json({
        success: true,
        data: { services: [], message: "No downstream services configured" },
        error: null,
      });
    }

    return res.status(200).json({
      success: true,
      data: { services },
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

const LISTEN_HOST = process.env.HOST || "0.0.0.0";

app.listen(PORT, LISTEN_HOST, () => {
  console.log(`FairGiG API gateway listening on http://${LISTEN_HOST}:${PORT}`);
});
