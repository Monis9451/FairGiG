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

  const timeoutMs = env.downstreamProxyTimeoutMs;

  return createProxyMiddleware({
    target: baseUrl,
    changeOrigin: true,
    pathRewrite: rewriteToPythonV1,
    proxyTimeout: timeoutMs,
    timeout: timeoutMs,
    on: {
      error: (err, _req, res) => {
        if (!res || typeof res.writeHead !== "function" || res.writableEnded || res.headersSent) {
          return;
        }
        const message =
          err?.code === "ECONNRESET" || err?.code === "ECONNREFUSED"
            ? `${label} is not reachable (is it running? Is ${kind === "earnings" ? "EARNINGS_SERVICE_URL" : "ANOMALY_SERVICE_URL"} correct?).`
            : `${label} proxy error: ${err?.message || String(err)}`;
        res.writeHead(502, { "Content-Type": "application/json" });
        res.end(
          JSON.stringify({
            success: false,
            data: null,
            error: message,
          })
        );
      },
    },
  });
};
