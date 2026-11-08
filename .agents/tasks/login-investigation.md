# Login Investigation Report

## Summary

**Root cause: `.env.production` hardcodes `REACT_APP_API_URL=http://localhost:8081`.**

When Vercel runs `react-scripts build` in production mode, it reads `.env.production` and bakes `http://localhost:8081` into the compiled JS bundle. Every API call — including `/api/v1/auth/login` — is therefore sent to `localhost:8081` from the user's browser, which is an address that only exists on the developer's own machine. All requests fail with a network error, making login completely broken for all users on the deployed site at https://aiinterview-vn.vercel.app/login.

---

## Evidence

### 1. The broken env var — `.env.production`

```
REACT_APP_API_URL=http://localhost:8081
REACT_APP_AI_SERVICE_URL=http://localhost:8020
```

This is the single most critical finding. `react-scripts build` merges env files in this priority order (highest to lowest): `.env.production.local` → `.env.local` → `.env.production` → `.env`. Since only `.env.production` exists (`.env.local` and `.env.production.local` are absent from the repo and not present on disk), `REACT_APP_API_URL` resolves to `http://localhost:8081` for every production build.

### 2. How the URL flows into every API call

**`src/services/http.service.ts` (line 3):**
```ts
const BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:8080';
```

**`src/services/auth.service.ts` (line 3):**
```ts
const BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:8080';
```

Both services read the same env var. Because `.env.production` sets it to `http://localhost:8081`, the fallback `'http://localhost:8080'` is never reached. The built bundle contacts `http://localhost:8081` instead of the actual backend API server.

### 3. Login endpoint call chain

```
LoginPage.handleSubmit()
  → useAuth().login(form, rememberMe)          [AuthContext.tsx → useAuthController.ts]
    → AuthService.login(data)                  [auth.service.ts]
      → publicHttp.post('/api/v1/auth/login')  [publicHttp baseURL = BASE_URL]
        → http://localhost:8081/api/v1/auth/login  ← WRONG in production
```

The `publicHttp` axios instance (distinct from `httpService` to avoid the 401-intercept/refresh loop) is also constructed with the same `BASE_URL`, so there is no secondary code path that would use a correct URL.

### 4. The `.env` file is unrelated to production

`.env` contains Gmail SMTP credentials used by the backend, not frontend env vars. It has no `REACT_APP_*` variables and no influence on the build.

### 5. `package.json` `proxy` field has no effect in production

```json
"proxy": "http://localhost:8080"
```

`react-scripts`' `proxy` field only works during local development (`npm start`). It is silently ignored during `npm run build` and has no effect on the deployed bundle.

### 6. No Vercel env vars configured

`vercel.json` only configures the build command, output directory, and SPA rewrites — it does not set environment variables. Unless Vercel project settings have `REACT_APP_API_URL` set via the dashboard (which cannot be confirmed from the repo alone but is not present in any config file), the value from `.env.production` wins.

### 7. Auth flow is otherwise correct (no secondary bugs)

End-to-end flow is structurally sound:

| Step | Location | Notes |
|------|----------|-------|
| Form submit | `LoginPage.tsx → handleSubmit` | calls `login(form, rememberMe)`, prevents default, clears notice |
| Controller | `useAuthController.ts → login()` | sets loading, calls service, calls `persistSession` on success |
| Token storage | `useAuthController.ts → persistSession` | writes `accessToken`, `refreshToken`, `user` to localStorage (rememberMe=true) or sessionStorage |
| Redirect | `useAuthController.ts` | navigates to `/admin/users` for ROLE_ADMIN, `/dashboard` for all others |
| Error display | `LoginPage.tsx` | renders `error` from context in a visible alert box; `errorStatus` drives resend-verification UI |

No silent error swallowing: the `catch` block in `login()` calls `setError()` with `readApiErrorMessage()`, which surfaces all BE error shapes. `readApiErrorMessage` has a defined fallback string for every expected HTTP status code.

Token handling is standard: `localStorage` vs `sessionStorage` selected by `rememberMe` flag; the `rememberMe` preference itself is stored only in `localStorage` so the request interceptor in `http.service.ts` can read it cross-session.

Refresh-token loop in `http.service.ts` correctly checks `_retry` to avoid infinite recursion and drains a `failedQueue` for concurrent requests.

### 8. Potential secondary issue: mixed HTTP/HTTPS in production

Even if the API URL were set to the correct remote server address, using `http://` (plain HTTP) from an `https://` page would be blocked by browsers as a mixed-content request. The correct production URL must use `https://`.

---

## Conclusions

| # | Issue | Severity |
|---|-------|----------|
| 1 | `.env.production` sets `REACT_APP_API_URL=http://localhost:8081` — all API calls go to localhost, breaking login for every user | **Critical** |
| 2 | URL uses `http://` — even with a real host it would be blocked as mixed content from the HTTPS Vercel deployment | **High** |
| 3 | No Vercel environment variable override found in repo — the deployed build definitely uses the wrong URL unless the Vercel dashboard has a manual override | **High** |

---

## Recommendations

### Fix 1 (required): Set the correct production API URL

**Option A — Fix `.env.production` in the repo (commit the change):**

```bash
# .env.production
REACT_APP_API_URL=https://<your-actual-backend-domain>
REACT_APP_AI_SERVICE_URL=https://<your-actual-ai-service-domain>
```

Replace `<your-actual-backend-domain>` with the real deployed backend URL (e.g. `https://api.aiinterview-vn.com` or the Render/Railway service URL). Use `https://` not `http://`.

**Option B — Set Vercel environment variable via Vercel dashboard (no commit needed):**

In the Vercel project settings → Environment Variables, add:
- `REACT_APP_API_URL` = `https://<your-actual-backend-domain>` (scoped to Production)
- `REACT_APP_AI_SERVICE_URL` = `https://<your-actual-ai-service-domain>` (scoped to Production)

Then redeploy. This approach keeps secrets out of the repo but requires remembering to update dashboard settings.

**Recommended:** Option A for transparency + Option B as override for secrets. At minimum, Option B alone will fix the immediate issue without a code commit.

### Fix 2 (follow-up): Validate CORS on the backend

Once the FE points to the correct backend URL, verify the backend allows requests from `https://aiinterview-vn.vercel.app`. A missing `Access-Control-Allow-Origin` header will surface as a CORS error in the browser console, blocking all API calls despite the correct URL.

### Fix 3 (hygiene): Add `.env.production.example` to the repo

Add a committed example file (with placeholder values, never real URLs) so future developers know what variables are required for a production build:

```bash
# .env.production.example
REACT_APP_API_URL=https://your-backend-api-url
REACT_APP_AI_SERVICE_URL=https://your-ai-service-url
```
