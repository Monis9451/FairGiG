/**
 * Smoke tests for /api/v1/auth/* (run with API already listening).
 *
 * Usage:
 *   node scripts/testAuthEndpoints.mjs
 *   API_BASE=http://127.0.0.1:5000 node scripts/testAuthEndpoints.mjs
 *
 * Optional integration check (calls Supabase; counts toward project limits):
 *   AUTH_SMOKE_EMAIL=user@example.com AUTH_SMOKE_PASSWORD='secret' node scripts/testAuthEndpoints.mjs
 */
import "dotenv/config";

const base = (process.env.API_BASE || "http://127.0.0.1:5000").replace(/\/$/, "");

const fail = (msg) => {
  console.error("FAIL:", msg);
  process.exit(1);
};

const ok = (msg) => console.log("OK:", msg);

const json = async (path, init) => {
  const res = await fetch(`${base}${path}`, {
    ...init,
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
      ...init?.headers,
    },
  });
  const text = await res.text();
  let body;
  try {
    body = text ? JSON.parse(text) : null;
  } catch {
    body = { _raw: text };
  }
  return { res, body };
};

const main = async () => {
  const health = await json("/health", { method: "GET" });
  if (!health.res.ok || !health.body?.success) {
    fail(`GET /health expected success (is the server running on ${base}?)`);
  }
  ok(`GET /health (${health.res.status})`);

  let r = await json("/api/v1/auth/login", {
    method: "POST",
    body: JSON.stringify({}),
  });
  if (r.res.status !== 400 || r.body?.success) {
    fail(`POST /login empty body expected 400, got ${r.res.status}`);
  }
  ok("POST /login rejects missing email/password");

  r = await json("/api/v1/auth/signup", {
    method: "POST",
    body: JSON.stringify([]),
  });
  if (r.res.status !== 400) {
    fail(`POST /signup array body expected 400, got ${r.res.status}`);
  }
  ok("POST /signup rejects non-object JSON");

  const email = process.env.AUTH_SMOKE_EMAIL;
  const password = process.env.AUTH_SMOKE_PASSWORD;
  if (email && password) {
    r = await json("/api/v1/auth/login", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    });
    if (!r.body?.success || !r.body?.data?.session?.access_token) {
      fail(
        `Smoke login failed: ${r.res.status} ${r.body?.error || JSON.stringify(r.body)}`
      );
    }
    if (!r.body.data.profile?.role) {
      fail("Smoke login: expected data.profile.role (check SUPABASE_SERVICE_ROLE_KEY)");
    }
    ok(`Smoke login as ${email} role=${r.body.data.profile.role}`);

    const token = r.body.data.session.access_token;
    r = await json("/api/v1/me", {
      method: "GET",
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!r.body?.success || !r.body?.data?.user?.id) {
      fail(`/me with token failed: ${r.body?.error || r.res.status}`);
    }
    ok("GET /api/v1/me with access_token");
  } else {
    console.log(
      "(skip) Set AUTH_SMOKE_EMAIL and AUTH_SMOKE_PASSWORD to run live login + /me."
    );
  }

  console.log("All checks passed.");
};

main().catch((err) => fail(err.message || String(err)));
