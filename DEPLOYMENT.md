# Frontend Deployment (as-built)

Production facts for the Draftmons Next.js frontend. For the full from-scratch
runbook see `../DEPLOYMENT.md` in the parent directory (note: the parent dir is
**not** version-controlled, so this file is the durable copy of what matters).

First deployed: **2026-07-21**.

## Where it runs

| Thing | Value |
|---|---|
| Host | **Vercel** |
| Project | `draftmons-frontend`, scope `samuel-peter-chowdhurys-projects` (personal) |
| Public URL | `https://draftmons-frontend.vercel.app` |
| Source | GitHub `samuel-peter-chowdhury/draftmons-frontend`, **auto-deploys on push to `main`** |
| Backend API | `https://draftmons-backend-production.up.railway.app` (Railway) |

⚠️ The **Vercel MCP plugin is authenticated to the wrong team** ("renny's
projects"). Do **not** use it for this project. Deploy via the `vercel` CLI
(`vercel login` to the personal account, then `vercel --prod`) or just push to `main`.

## Environment variables (Vercel → Settings → Environment Variables, Production)

- `NEXT_PUBLIC_API_BASE_URL` = **`https://draftmons-frontend.vercel.app`** — the
  frontend's OWN origin, so browser API calls go same-origin and get proxied to
  the backend (see below). ⚠️ **Do NOT set this to the raw backend URL** — that
  re-introduces the cross-domain cookie bug and breaks login.
- `INTERNAL_API_BASE_URL` = **`https://draftmons-backend-production.up.railway.app`**
  — the direct backend URL. Used by the `next.config.ts` rewrite destination and by
  the edge middleware's server-side `/api/auth/status` call.
- `NEXT_PUBLIC_CLIENT_URL` = **`https://draftmons-frontend.vercel.app`** — used to
  build the OAuth `redirect` param.

All three are baked at **build** time (the `NEXT_PUBLIC_*` ones, plus the CSP
`connect-src`). Changing any of them requires a **redeploy**, not just a restart.

## Cross-domain session fix (the reason for the /api proxy)

Frontend (`*.vercel.app`) and backend (`*.up.railway.app`) are different sites,
so the backend's session cookie was third-party and never sent on
frontend-domain requests. `middleware.ts` forwards the incoming request's cookies
to the backend `/api/auth/status`, so it never saw the cookie → every protected
route redirected to `/?next=`.

**Fix:** `next.config.ts` has a `rewrites()` entry proxying `/api/:path*` →
`${INTERNAL_API_BASE_URL}/api/:path*`. The browser now talks to the backend
*through* the Vercel origin, so the session cookie is **first-party** to
`draftmons-frontend.vercel.app` and the middleware can see it. This also removes
the third-party-cookie fragility entirely.

Companion requirements (both already set):
- Backend `GOOGLE_CALLBACK_URL` = `https://draftmons-frontend.vercel.app/api/auth/google/callback`
  (so the OAuth callback flows through the proxy and the cookie is set first-party).
- That callback URI is registered in the Google Cloud Console OAuth client.

Works locally without the proxy because both frontend and backend are
`localhost` (cookies aren't port-scoped).

## Verify

```bash
# Same-origin proxy is live if this returns 200 JSON (not a 404 from Next):
curl https://draftmons-frontend.vercel.app/api/auth/status   # {"isAuthenticated":false}
```
Then in a browser: sign in with Google → land on `/home` → **refresh stays
logged in** (session cookie should be first-party under the Vercel domain,
`Secure` + `SameSite=None`).

## Build note

`npm run build` runs `next build` (which lints); it passes clean as of 2026-07-21.
`next.config.ts` also injects security headers incl. a CSP whose `connect-src`
includes `NEXT_PUBLIC_API_BASE_URL` — a wrong value there silently blocks fetches
even when CORS is fine.
