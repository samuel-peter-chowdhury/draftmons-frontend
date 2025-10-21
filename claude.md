
# claude.md — Draftmons Frontend Playbook

> **Purpose**: This file tells Claude Code how to work within the Draftmons frontend repository.  
> It summarizes the architecture, file/package structure, patterns, and best practices for a modern Next.js (App Router) TypeScript app.

---

## Quick facts (must not change unless explicitly requested)

- **Framework**: Next.js (App Router) + **TypeScript**  
- **Node**: v20.x, **npm** for package management  
- **Ports**: Frontend **3333**, Backend (Express/Passport) **3000**  
- **API base**: `NEXT_PUBLIC_API_BASE_URL` (defaults to `http://localhost:3000`)  
- **Auth**: Google OAuth 2 via backend sessions (Passport). Routes under **`/api/auth/*`**.  
- **Public route**: `/` only.  
- **Protected routes**: `/home`, `/league`, `/league/create`, `/league/[id]`, plus **league-scoped tools** nested under `/league/[id]/*`.  
- **Dark theme only**. No theme toggle.  
- **State**: Zustand (`useAuthStore`, `useUiStore`).  
- **UI**: shadcn-style primitives (local), TailwindCSS, lucide-react icons.  
- **Navigation**: Protected pages share a 64px header and a fixed overlay sidebar (no layout shift).  
- **Edge protection**: `middleware.ts` calls `/api/auth/status` and redirects to `/` with `?next=…` when unauthenticated.  
- **All fetches include cookies**: `credentials: 'include'`.

---

## Repository layout

```
src/
  app/
    (public)/
      page.tsx          # "/" – landing with Google sign-in
      layout.tsx        # no header on public routes
      loading.tsx
      error.tsx
    (protected)/
      layout.tsx        # header + sidebar
      loading.tsx
      error.tsx
      home/page.tsx
      league/page.tsx
      league/create/page.tsx
      league/[id]/page.tsx
      league/[id]/team-matchup/page.tsx
      league/[id]/tiers/classic/page.tsx
      league/[id]/tiers/type/page.tsx
      league/[id]/rank/team/page.tsx
      league/[id]/rank/pokemon/page.tsx
      league/[id]/tools/schedule/page.tsx
      league/[id]/tools/rules/page.tsx
  components/
    layout/Header.tsx
    layout/Sidebar.tsx
    feedback/Spinner.tsx
    feedback/ErrorAlert.tsx
    ui/accordion.tsx
    ui/alert.tsx
    ui/button.tsx
    ui/card.tsx
    ui/input.tsx
    ui/label.tsx
    ui/skeleton.tsx
    index.ts
  hooks/
    useFetch.ts
    index.ts
  lib/
    api.ts            # fetch wrapper (credentials: 'include')
    constants.ts      # ENDPOINTS + URLs
    utils.ts          # cn()
    index.ts
  stores/
    useAuthStore.ts   # auth status & logout
    useUiStore.ts     # sidebar + activeLeagueId
    index.ts
  types/
    dto.ts            # DTOs: Base, User, League, PaginatedResponse, etc.
    index.ts
app/globals.css       # Tailwind + dark tokens
middleware.ts         # SSR/edge protection
tailwind.config.ts
postcss.config.js
next.config.ts
tsconfig.json
.eslintrc.js
.prettierrc
.env.example
README.md
```

**Index barrels** exist under `components`, `lib`, `stores`, `hooks`, and `types`.

---

## Core packages

**Runtime**: `next`, `react`, `react-dom`, `zustand`, `lucide-react`, `clsx`, `tailwind-merge`, `class-variance-authority`, `@radix-ui/react-*` primitives.

**Dev**: `typescript`, `eslint`, `eslint-config-next`, `@typescript-eslint/*`, `eslint-plugin-import`, `eslint-plugin-react`, `eslint-plugin-react-hooks`, `eslint-plugin-tailwindcss`, `tailwindcss`, `postcss`, `autoprefixer`, `prettier`, `prettier-plugin-tailwindcss`.

> **Guidance**: Prefer adding UI primitives locally (shadcn-style) instead of introducing new design systems. Add only what’s needed.

---

## Design patterns & conventions

### 1) App Router structure

- Use **route groups** to separate public vs protected UI.  
- Each route group has its own `layout.tsx`, `loading.tsx`, and `error.tsx` for consistent UX.  
- Protected pages always render the **global header** and **overlay sidebar** (no layout shift; sidebar starts below header).  
- Use `metadata` sparingly; rely on sensible defaults.

### 2) State management (Zustand)

- `useAuthStore`: `{ user, isAuthenticated, loading, error }`, with actions `{ checkAuth, logout, setUser }`.  
  - **Non-persistent** to avoid stale sessions. SSR/edge middleware handles deep-link protection.
- `useUiStore`: `{ sidebarOpen, expandedGroups, activeLeagueId }` for UI-only state.  
  - `activeLeagueId` is set when visiting `/league/[id]` and used to scope sidebar links.

> **Do:** keep stores minimal and domain-focused. Avoid derived or server-owned state in global stores.

### 3) Data fetching

- Use `lib/api.ts` (`apiFetch`) which sets `credentials: 'include'` and normalizes errors.  
- For simple needs, `hooks/useFetch.ts` wraps `apiFetch` and provides `{ data, loading, error, refetch }`.  
- For forms, call `Api.post/put/delete` directly and surface errors via `ErrorAlert`.

> **Do:** handle loading with the shared spinner; show user-friendly error messages.  
> **Don’t:** duplicate fetch logic or bypass the wrapper without a good reason.

### 4) DTOs & typing

- DTOs live in `src/types/dto.ts`.  
- Nested DTO references are **base fields only** (until full shapes are available).  
- For lists, prefer `PaginatedResponse<T>`.  
- Stick to `SortOrder = 'ASC' | 'DESC'` and use query params: `page`, `pageSize`, `sortBy`, `sortOrder` (+ `full=true` for details).

### 5) Authentication & redirects

- Backend endpoints (with `/api` prefix):
  - `GET /api/auth/status` → `{ isAuthenticated, user? }`
  - `GET /api/auth/google?redirect=<abs>&state=<abs>` → starts OAuth
  - `POST /api/auth/logout` → ends session
- The **landing page** (`/`) accepts an optional `?next=`. After successful OAuth, the backend should redirect to `state/redirect` (the intended route).  
- The **edge middleware** protects server-side: on 401, redirect to `/` with `?next=`.

> **Do:** always pass `credentials: 'include'`.  
> **Do:** keep CORS and cookie attributes correct in each environment.  
> **Don’t:** assume JWTs; this app uses **Passport sessions**.

### 6) UI & theming

- Dark theme only. CSS variables defined in `globals.css` (shadcn-style tokens).  
- Local shadcn-style primitives for: `Button`, `Input`, `Label`, `Card`, `Alert`, `Accordion`, `Skeleton`.  
- Icons via `lucide-react`.  
- Header height is fixed (**64px**). Sidebar is **fixed** beneath header with an overlay; it **does not** shift page content.

### 7) Errors & loading

- Pages use `loading.tsx` and `error.tsx` per route group.  
- Inline fetch/loading uses shared `Spinner` and `ErrorAlert`.  
- Map backend validation errors to field messages when adding forms (current create form shows a general alert).

### 8) File organization & naming

- Co-locate small, page-specific components under the page directory when helpful.  
- Reusable components go under `src/components`.  
- Prefer **barrel exports** for `components`, `lib`, `stores`, `hooks`, `types`.  
- Use **absolute imports** via `@/*` path alias.  
- Follow ESLint/Prettier defaults; do not commit with lint errors.

---

## Adding features — templates for Claude

### A) Create a new league‑scoped page
1. Create a directory under `src/app/(protected)/league/[id]/<feature>/page.tsx`.
2. Export a client component if it needs state/hooks.
3. Use `useParams<{ id: string }>()` to derive `leagueId`.
4. Use `useUiStore().setActiveLeagueId(leagueId)` if the page is the first league context entry.
5. Fetch data via `useFetch(`${ENDPOINTS.LEAGUE_BASE}/${leagueId}/...`)` or compose a helper in `lib/`.
6. Use the shared spinner and error alert. Keep UI minimal and consistent.

### B) Add a list page with pagination & sorting
1. Use `useState` for `page`, `pageSize`, `sortBy`, `sortOrder`.
2. Build a `URLSearchParams` string with those values.
3. Call `useFetch<PaginatedResponse<MyDto>>(url)`.
4. Render a grid of cards; add Previous/Next buttons and paging summary.
5. Expose visible sort controls and default `sortBy` to `name` when applicable.

### C) Add a form page
1. Create `page.tsx` with a client component.
2. Manage form state with `useState` (or `react-hook-form` if introduced later).
3. Submit via `Api.post/put` and handle error mapping.
4. On success, redirect with `router.replace()`.
5. Reuse `Input`, `Label`, `Button` and show inline spinner in the submit button.

### D) Extend the sidebar with a new item
1. Add a new section or child link in `components/layout/Sidebar.tsx`.
2. Use `activeLeagueId` for league-scoped links. Disable links when `activeLeagueId` is `null`.
3. Use `Accordion` for collapsible groups and a lucide icon.

---

## Routing & protection details

- Paths treated as **protected** (see `middleware.ts`): `/home`, `/league`, `/pokemon`, `/user`.  
  Add to `PROTECTED_PREFIXES` if new protected top-level routes are introduced.
- `middleware.ts` forwards cookies to the backend and checks `/api/auth/status`.  
  On failure, it redirects the user to `/` and preserves the intended path in `?next=`.

---

## API boundary

- Centralize endpoints in `lib/constants.ts` (`ENDPOINTS`).  
- Always use the `Api` wrapper in `lib/api.ts`. It:
  - Sets `credentials: 'include'`
  - Parses JSON automatically
  - Throws errors with `err.status` and `err.body` populated when available

> If the backend returns a validation error with a known shape, map it to field errors; otherwise, display a generic `ErrorAlert` with `body.message` when present.

---

## Performance & a11y (quick wins)

- Keep components small; prefer memoization only when profiling shows benefit.  
- Use semantic elements (`<button>`, `<nav>`, `<header>`, `<main>`) and ARIA labels on icon buttons.  
- Avoid layout shifts: the header and sidebar are fixed; page content starts below header via `header-pt` utility.  
- Defer heavy client work; prefer server components by default (App Router), convert to client with `"use client"` only when needed.

---

## Linting, formatting, and commits

- Run `npm run lint` before pushing.  
- Prettier + Tailwind plugin sorts utility classes automatically.  
- Prefer small, focused PRs; describe which page/feature was touched and why.

---

## Environment & configuration

- `.env.local`:
  ```
  NEXT_PUBLIC_API_BASE_URL=http://localhost:3000
  NEXT_PUBLIC_CLIENT_URL=http://localhost:3333
  ```
- In production (Vercel), set both to your real origins.  
- Ensure backend CORS allows the Vercel domain **and** `Access-Control-Allow-Credentials: true`.  
- Cookies must be `SameSite=None; Secure` in production for cross-origin sessions.

---

## Deployment notes (Vercel)

- No special config required; this repo is Vercel-ready.  
- Ensure the backend is accessible from the Vercel region.  
- Edge middleware calls `${API_BASE}/api/auth/status`; confirm reachability and latency.  
- If needed later, add a `vercel.json` for headers/caching.

---

## Glossary

- **League‑scoped page**: a route under `/league/[id]/*` which requires an active league ID to build links in the sidebar.  
- **Protected route**: any route that requires an authenticated session; enforced at the edge in `middleware.ts`.  
- **shadcn-style primitives**: locally implemented UI components that follow shadcn patterns and Tailwind tokens.

---

## What Claude should optimize for

1. **Consistency**: use shared components (Spinner, ErrorAlert, UI primitives) and existing patterns.  
2. **Minimal deps**: avoid introducing libraries unless justified.  
3. **Type-safety**: keep DTOs up to date; prefer explicit types over `any`.  
4. **SSR-friendliness**: keep server components by default; add `"use client"` only when hooks/state are required.  
5. **Ergonomics**: maintain simple APIs in `lib/` and clear store responsibilities.

If any change would affect ports, auth flow, or route groups, call it out explicitly in the PR/commit description.
