# FAIRGIG FRONTEND - AGENT RULES & CONTEXT

## 1. Core Principles & Mindset
- **Keep it Simple & Direct:** Do not over-engineer. Write straightforward, readable code. If a simple React component works, do not build a complex abstraction.
- **Match Requirements Exactly:** Stick strictly to the provided design system, color codes, and schemas. 
- **No Placeholder Data:** Except for initial UI building, rely on real aggregated data fetched via APIs. Never hardcode the city-wide median.

## 2. Tech Stack Mandates
- **Framework:** React + Vite (Do NOT use Next.js or generic React boilerplate).
- **Routing:** React Router v6 (Implement Role-Based routing).
- **State Management:** Zustand (for Auth/User state). Do NOT use Redux.
- **Server State:** TanStack Query v5 (for data fetching, caching, and background updates).
- **UI & Styling:** Tailwind CSS v3 + shadcn/ui. Use `lucide-react` for icons.
- **Forms & Validation:** React Hook Form + Zod.
- **Charts:** Recharts.
- **Utilities:** `axios` (HTTP), `date-fns` (dates), `sonner` (toasts), `papaparse` (CSV), `react-to-print` (PDF/Print).

## 3. Design System & Theming
Apply these exact Tailwind colors for semantic meaning:
- **Primary:** `indigo-600` (CTAs, active nav, primary buttons)
- **Secondary:** `teal-600` (Verified status, success states)
- **Warning:** `amber-600` (Pending, needs attention)
- **Danger:** `rose-600` (Flagged, anomaly, error)
- **Status Badges:** `pending` = amber, `verified` = teal, `flagged` = rose.

## 4. API & Architecture Boundaries
- The backend consists of logically separated microservices. Create separate Axios instances in `src/api/` for each:
  - `authClient` (Role management, JWT)
  - `earningsClient` (Shift logs, CSV import, Screenshots)
  - `anomalyClient` (FastAPI Python service)
  - `grievanceClient` (Node.js service)
  - `analyticsClient` (Aggregate KPIs)
- **Authentication:** All clients (except public routes) must use an Axios interceptor to attach the JWT token from the Zustand store. If 401, redirect to `/login`.

## 5. Role-Based Access Control (RBAC)
Strictly isolate views based on `authStore.user.role`:
- `worker`: Access to Dashboard, Log Shift, Earnings History, Income Certificate.
- `verifier`: Access to Verify Queue, Verify Details.
- `advocate`: Access to Analytics Dashboard, Grievance Manager.

## 6. Critical Feature Implementations
- **Form Auto-Calculation:** In the "Log Shift" form, `net_received` MUST be auto-calculated (`gross_earned` - `deductions`) using `watch()` from React Hook Form.
- **Income Certificate:** Must use `react-to-print` and be completely stripped of UI chrome (navbars, sidebars) when rendered for printing.
- **Anomaly Trigger:** After a worker logs a shift, automatically trigger a POST request to the Anomaly service with their recent 30-day earnings.
- **Database Safety (Supabase/PostgreSQL context):** When building charts, ensure aggregate queries never expose individual `worker_id` data.