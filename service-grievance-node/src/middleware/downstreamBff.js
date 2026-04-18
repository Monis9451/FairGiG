import { createRequire } from "module";

import { env } from "../config/env.js";

const require = createRequire(import.meta.url);
const { createProxyMiddleware } = require("http-proxy-middleware");

/**
 * Maps mounted path (e.g. /status under /api/v1/earnings) → Python /api/v1/status
 */
const rewriteToPythonV1 = (path) => {
  const pathname = path.split("?")[0];
  if (pathname === "/" || pathname === "") {
    return "/api/v1";
  }
  return `/api/v1${pathname}`;
};

const notConfigured = (serviceLabel) => (req, res, next) => {
  res.status(503).json({
    success: false,
    data: null,
    error: `${serviceLabel} not configured (set env URL on API gateway)`,
  });
};

/**
 * @param {"earnings"|"anomaly"} kind
 */
export const downstreamBff = (kind) => {
  const baseUrl = kind === "earnings" ? env.earningsServiceUrl : env.anomalyServiceUrl;
  const label = kind === "earnings" ? "Earnings service" : "Anomaly service";

  if (!baseUrl) {
    return notConfigured(label);
  }

  return createProxyMiddleware({
    target: baseUrl,
    changeOrigin: true,
    pathRewrite: rewriteToPythonV1,
  });
};
