# Draftmons (Frontend)

This repository contains the **Next.js App Router** frontend for **Draftmons**, served on port **3333** in development.  
It communicates with an Express.js backend (running on port **3000**) via REST APIs under `/api/*` and uses **Passport (session)** with **Google OAuth 2** for authentication.

---

## Table of Contents

- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Environment Variables](#environment-variables)
- [Getting Started (Local)](#getting-started-local)
- [Authentication Flow](#authentication-flow)
- [Routing & Protection](#routing--protection)
- [State Management](#state-management)
- [UI & Theming](#ui--theming)
- [Error & Loading UX](#error--loading-ux)
- [League Pages](#league-pages)
- [Quality (ESLint/Prettier)](#quality-eslintprettier)
- [Deployment (Vercel)](#deployment-vercel)
- [Troubleshooting](#troubleshooting)

---

## Tech Stack

- **Next.js (App Router, TypeScript)**
- **Zustand** for client state
- **shadcn/ui** components (locally included) + **Tailwind CSS**
- **ESLint** + **Prettier** (+ `prettier-plugin-tailwindcss`)
- **lucide-react** icons
- Served on **port 3333**
- Dark theme across all pages

---

## Project Structure

```
draftmons-frontend/
├─ src/
│  ├─ app/
│  │  ├─ (public)/
│  │  │  ├─ page.tsx            # "/" – Google sign-in for unauthenticated users
│  │  │  ├─ layout.tsx          # No header on public routes
│  │  │  ├─ loading.tsx
│  │  │  └─ error.tsx
│  │  └─ (protected)/
│  │     ├─ layout.tsx          # Header + Sidebar for protected pages
│  │     ├─ loading.tsx
│  │     ├─ error.tsx
│  │     ├─ home/page.tsx
│  │     ├─ league/page.tsx
│  │     ├─ league/create/page.tsx
│  │     ├─ league/[id]/page.tsx
│  │     └─ league/[id]/...     # team-matchup, tiers, rank, tools
│  ├─ components/
│  │  ├─ layout/{Header,Sidebar}.tsx
│  │  ├─ feedback/{Spinner,ErrorAlert}.tsx
│  │  └─ ui/* (shadcn-like primitives: button, input, card, alert, accordion, skeleton)
│  ├─ hooks/
│  │  └─ useFetch.ts
│  ├─ lib/{api.ts, constants.ts, utils.ts}
│  ├─ stores/{useAuthStore.ts, useUiStore.ts}
│  └─ types/{dto.ts}
├─ middleware.ts                 # Server-edge protection
├─ tailwind.config.ts
├─ postcss.config.js
├─ next.config.ts
├─ tsconfig.json
├─ .eslintrc.js
├─ .prettierrc
├─ .gitignore
├─ .env.example
└─ README.md
```

---

## Environment Variables

Create a `.env.local` from the example:

```
cp .env.example .env.local
```

**.env.local**

```
NEXT_PUBLIC_API_BASE_URL=http://localhost:3000
NEXT_PUBLIC_CLIENT_URL=http://localhost:3333
```

> ⚠️ In production, set `NEXT_PUBLIC_API_BASE_URL` to your deployed backend origin. `NEXT_PUBLIC_CLIENT_URL`
> should be your deployed Vercel URL (e.g. https://draftmons.vercel.app).

---

## Getting Started (Local)

1. **Node 20** (LTS) and **npm** are required.
2. Install dependencies:

   ```bash
   npm install
   ```

3. Run the dev server on **port 3333**:

   ```bash
   npm run dev
   ```

4. Backend: ensure the Express server is running at **http://localhost:3000**, with:
   - Routes under `/api/*`
   - CORS allowing `http://localhost:3333` with **credentials enabled**
   - Passport **session** configured
   - Google OAuth routes mounted at `/api/auth`

---

## Authentication Flow

- The public `/` page checks session via `GET /api/auth/status`.  
  - Unauthenticated users see a **“Sign in with Google”** button that hits:
    - `GET /api/auth/google?redirect={clientUrl + next}&state={clientUrl + next}`
  - Authenticated users are redirected to either `/home` **or** the last attempted route (`next`).
- The backend should read the `redirect` (or `state`) param during the OAuth callback and redirect to that URL on success.

**Logout**: the header has a right-aligned logout icon that calls `POST /api/auth/logout` and redirects to `/`.

---

## Routing & Protection

- **Route groups** distinguish public vs. protected.
  - `(public)`: only `/`
  - `(protected)`: `/home`, `/league`, `/league/create`, `/league/[id]`, and all league-scoped tools.
- **Edge middleware** (`middleware.ts`) protects all protected paths server-side by calling `GET /api/auth/status` with forwarded cookies.
  - If unauthenticated, we redirect to `/` with `?next=/original/path`.
  - On the landing page, sign-in preserves `next` and returns users to their destination post-login.

**Protected Sidebar Navigation** (always visible on protected routes):
- Left hamburger opens a **fixed side panel** (z-index above content, **no layout shift**, starts below the 64px header).
- Items are **league-scoped** (under `/league/:id/*`):
  - Team Matchup → `/league/:id/team-matchup`
  - Tiers → Classic `/league/:id/tiers/classic`, Type `/league/:id/tiers/type`
  - Rank → Team `/league/:id/rank/team`, Pokemon `/league/:id/rank/pokemon`
  - Tools → Schedule `/league/:id/tools/schedule`, Rules `/league/:id/tools/rules`
- Until a league is selected, links are disabled. Visiting `/league/:id` sets the active league ID in state.

---

## State Management

- `useAuthStore` (Zustand): `user`, `isAuthenticated`, `checkAuth()`, `logout()`.
- `useUiStore` (Zustand): `sidebarOpen`, expand/collapse state, and `activeLeagueId` for league-scoped nav.

> In this starter, auth state is **non-persistent** to avoid stale sessions. The edge middleware ensures protection on reload and deep links.

---

## UI & Theming

- Dark theme only (`html` has `class="dark"`), Tailwind configured with `darkMode: 'class'`.
- A minimal set of **shadcn-style** UI primitives are included locally:
  - Button, Input, Label, Card, Alert, Accordion, Skeleton
- **Header** (64px): left hamburger to open sidebar; left Home icon; right Logout icon.

---

## Error & Loading UX

- **Loading spinners** appear when pages or data are loading (global `loading.tsx` and inline spinners).
- **Error alerts** use a shared `ErrorAlert` component with a consistent look.
- Data fetching is centralized through a small `useFetch` helper around `fetch` (with `credentials: 'include'`).

---

## League Pages

- `/league` – paginated, sortable (by **name** or **createdAt**) list with navigation to details.
- `/league/create` – form with standard fields (**name**, **abbreviation**).
- `/league/[id]` – detail page (fetches with `?full=true`) with placeholders for future sections.
- `/league/[id]/team-matchup`, `/tiers/*`, `/rank/*`, `/tools/*` – scaffolded pages.

All API calls go to the Express backend under `/api/*` on port 3000 and include credentials for session cookies.

---

## Quality (ESLint/Prettier)

- ESLint is configured with Next + TypeScript + Tailwind plugins.
- Prettier with `prettier-plugin-tailwindcss` keeps class names tidy.

Run:

```bash
npm run lint
```

---

## Deployment (Vercel)

- This project is Vercel-ready.
- Set environment variables in Vercel:
  - `NEXT_PUBLIC_API_BASE_URL=https://<your-backend-domain>`
  - `NEXT_PUBLIC_CLIENT_URL=https://<your-vercel-app>`
- Ensure your backend:
  - Accepts the Vercel domain in CORS (`Access-Control-Allow-Origin`), with **credentials enabled**.
  - Sets session cookies with `SameSite=None; Secure` for cross-origin in production.
- The **edge middleware** will call `${API_BASE}/api/auth/status`; ensure it’s reachable from Vercel.

---

## Troubleshooting

- **Stuck on login?**
  - Verify backend CORS: `Access-Control-Allow-Origin` must match `NEXT_PUBLIC_CLIENT_URL`, **and** `Access-Control-Allow-Credentials: true`.
  - Ensure session cookies are set for the correct domain with `SameSite=None; Secure` in production.
  - Confirm OAuth callback redirects back to your client URL (`redirect` or `state`).

- **401s on protected routes?**
  - Check that middleware can reach `${API_BASE}/api/auth/status` and that cookies are forwarded.
  - In local dev, both frontend and backend must run on `localhost` ports 3333 and 3000.

- **Type mismatches?**
  - DTOs are intentionally minimal for nested relations (base fields only). Expand as backend DTOs evolve.
