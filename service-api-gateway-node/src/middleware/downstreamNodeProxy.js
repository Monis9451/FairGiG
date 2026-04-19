import { createRequire } from "module";

import { env } from "../config/env.js";

const require = createRequire(import.meta.url);
const { createProxyMiddleware } = require("http-proxy-middleware");

const notConfigured = (serviceLabel) => (_req, res) => {
  res.status(503).json({
    success: false,
    data: null,
    error: `${serviceLabel} not configured (set env URL on API gateway)`,
  });
};

/**
 * Reverse-proxy to another FairGiG Node service. Path is forwarded as-is (e.g. /api/analytics/...).
 * @param {string | null} baseUrl
 * @param {string} label
 */
export const downstreamNodeProxy = (baseUrl, label) => {
  if (!baseUrl) {
    return notConfigured(label);
  }

  const timeoutMs = env.downstreamProxyTimeoutMs;

  return createProxyMiddleware({
    target: baseUrl,
    changeOrigin: true,
    proxyTimeout: timeoutMs,
    timeout: timeoutMs,
    on: {
      error: (err, _req, res) => {
        if (!res || typeof res.writeHead !== "function" || res.writableEnded || res.headersSent) {
          return;
        }
        const message =
          err?.code === "ECONNRESET" || err?.code === "ECONNREFUSED"
            ? `${label} is not reachable (check ${label} service URL and that the process is running).`
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
