import express from "express";
import cors from "cors";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import hpp from "hpp";
import axios from "axios";
import dotenv from "dotenv";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";
import { createRequire } from "module";
import YAML from "yaml";

import { attachProfile, requireAuth, requireRole } from "./src/middleware/auth.js";

const require = createRequire(import.meta.url);
const swaggerUi = require("swagger-ui-express");

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ quiet: true });

const app = express();
const PORT = Number(process.env.PORT) || 5000;
const NODE_ENV = process.env.NODE_ENV || "development";

const openApiPath = path.join(__dirname, "docs", "openapi.yaml");
let openApiDocument;
try {
  openApiDocument = YAML.parse(fs.readFileSync(openApiPath, "utf8"));
} catch (err) {
  console.warn("OpenAPI spec not loaded:", err.message);
  openApiDocument = {
    openapi: "3.0.3",
    info: { title: "FairGiG API", version: "0.0.0" },
    paths: {},
  };
}

const ALLOWED_ORIGINS = (process.env.CORS_ORIGIN || "http://localhost:5173")
  .split(",")
  .map((origin) => origin.trim())
  .filter(Boolean);

const normalizeServiceUrl = (rawUrl) => {
  if (!rawUrl) {
    return null;
  }

  try {
    const parsed = new URL(rawUrl);

    if (!["http:", "https:"].includes(parsed.protocol)) {
      return null;
    }

    parsed.username = "";
    parsed.password = "";
    return `${parsed.origin}${parsed.pathname.replace(/\/$/, "")}`;
  } catch {
    return null;
  }
};

const downstreamServices = [
  {
    name: "anomaly-service",
    baseUrl: normalizeServiceUrl(process.env.ANOMALY_SERVICE_URL),
  },
  {
    name: "analytics-service",
    baseUrl: normalizeServiceUrl(process.env.ANALYTICS_SERVICE_URL),
  },
].filter((service) => Boolean(service.baseUrl));

const httpClient = axios.create({
  timeout: Number(process.env.AXIOS_TIMEOUT_MS) || 5000,
  headers: {
    Accept: "application/json",
    "User-Agent": "fairgig-backend/1.0",
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
      if (!origin || ALLOWED_ORIGINS.includes(origin)) {
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

app.get("/", (_req, res) => {
  res.status(200).json({
    success: true,
    data: { message: "FairGiG backend is running" },
    error: null,
  });
});

app.get("/health", (_req, res) => {
  res.status(200).json({
    success: true,
    data: { service: "fairgig-backend", status: "ok" },
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
app.get("/api/v1/me", requireAuth, attachProfile, (req, res) => {
  res.status(200).json({
    success: true,
    data: {
      user: {
        id: req.authUser.id,
        email: req.authUser.email,
        phone: req.authUser.phone,
      },
      profile: req.profile,
    },
    error: null,
  });
});


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

  res.status(statusCode).json({
    success: false,
    data: null,
    error: message,
  });
});

app.listen(PORT, () => {
  console.log(`FairGiG backend listening on port ${PORT}`);
});
