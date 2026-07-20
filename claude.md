
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
- **Protected routes**: `/home`, `/user`, `/pokemon`, `/league`, `/league/[id]`, `/team-build`,
  plus **league/season-scoped tools** nested under `/league/[id]/season/[seasonId]/*` (`tools/`,
  `admin/`, `rank/`, `tiers`, `team-matchup`, `team`). League/season creation is dialog-driven
  (`CreateLeagueModal`/`CreateSeasonModal`), not a separate route.  
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
      layout.tsx        # no header on public routes; mounts AmbientBackground
      loading.tsx
      error.tsx
    (protected)/
      layout.tsx        # header + sidebar; mounts AmbientBackground
      loading.tsx
      error.tsx
      home/page.tsx
      user/page.tsx
      user/[id]/page.tsx           # profile, incl. Discord link/unlink
      pokemon/page.tsx             # global Pokemon table (PokemonTable)
      league/page.tsx              # list + CreateLeagueModal trigger
      league/[id]/page.tsx         # league detail (Discord tab, seasons list)
      league/[id]/season/page.tsx  # + CreateSeasonModal trigger
      league/[id]/season/[seasonId]/
        layout.tsx                 # season sub-nav
        page.tsx                   # season overview
        team/page.tsx
        team/[teamId]/page.tsx
        tiers/page.tsx             # classic/type toggle in one page (not separate routes)
        rank/team/page.tsx
        rank/pokemon/page.tsx
        team-matchup/page.tsx      # renders shared components/comparison/*
        tools/rules/page.tsx
        tools/schedule/page.tsx
        tools/search/page.tsx
        tools/roster/page.tsx
        admin/team/page.tsx
        admin/team/[teamId]/page.tsx
        admin/schedule/page.tsx
        admin/match-upload/page.tsx
        admin/tier-list/page.tsx   # drag-and-drop board (@dnd-kit/core) + rapid placement view
      team-build/page.tsx
      team-build/[teamBuildId]/page.tsx
      team-build/compare/page.tsx  # uses components/comparison/* (shared with team-matchup)
  components/
    layout/Header.tsx
    layout/Sidebar.tsx
    layout/AmbientBackground.tsx
    layout/AuthProvider.tsx
    feedback/Spinner.tsx
    feedback/ErrorAlert.tsx
    modals/                        # CreateLeagueModal, CreateSeasonModal, CreateTeamModal, EditUserModal, EditRulesModal, ...
    pokemon/                       # PokemonTable, PokemonModal, PokemonFilterPanel, PokemonSprite, FilterDropdown
    comparison/                    # TeamInfoColumn, CopyableField, SpecialMovesContent, CoverageMovesContent — shared by team-matchup and team-build/compare
    home/                          # MyLeagueCard, LeagueSearch
    ui/                            # 24 primitives — see "UI & theming" below
    index.ts                       # barrel; re-exports every ui/* primitive plus the above
  hooks/
    useFetch.ts
    useMutation.ts
    usePokemonModal.ts
    index.ts
  lib/
    api.ts            # fetch wrapper (credentials: 'include'); buildUrl/buildUrlWithQuery
    api/              # typed per-resource clients: LeagueApi, PokemonApi, AuthApi, TeamBuildApi, ...
    constants.ts      # ENDPOINTS + URLs
    pokemon.ts        # getStatColor/getEffectivenessColor, POKEMON_TYPE_ORDER
    sanitize.ts       # sanitizeHtml for rich-text rendering
    standings.ts      # computeStandings
    utils.ts          # cn(), formatUserDisplayName, etc.
    index.ts
  stores/
    useAuthStore.ts   # auth status & logout
    useUiStore.ts     # sidebar + activeLeagueId
    useLeagueStore.ts # active league/season cache + useIsModerator
    index.ts
  types/
    dto.ts            # DTOs: Base, User, League, PaginatedResponse, etc.
    index.ts
app/globals.css       # Tailwind + design tokens (Minimalist Dark/Amber — see below)
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

**`_components/` co-location**: page-specific components that aren't reused elsewhere live in a
sibling `_components/` directory next to the `page.tsx` that uses them (e.g.
`admin/tier-list/_components/TierColumn.tsx`, `team-build/[teamBuildId]/_components/DraftPrepTab.tsx`).
The leading underscore opts the folder out of Next.js route matching. Each `_components/` directory
has its own `index.ts` barrel. Promote a component out of `_components/` into `src/components/` only
once a second, unrelated route needs it (see `components/comparison/*`, shared by `team-matchup` and
`team-build/compare`).

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
- Local shadcn-style primitives (`src/components/ui/*.tsx`, 24 files, all re-exported from the
  `components` barrel): `Accordion`, `Alert`, `AlertDialog`, `Badge`, `Button`, `Card`, `Checkbox`,
  `Combobox`, `Command`, `Dialog`, `Input`, `Label`, `Pagination`, `Popover`, `RichTextEditor`
  (Tiptap-based), `Select`, `Skeleton`, `SortControls`, `Table`, `Tabs`, `Textarea`, `Toast`/
  `Toaster` (+ `addToast` helper in `hooks/useToast.ts`), `Tooltip`. `Combobox`/`Command` wrap
  `cmdk`. Add new primitives by hand (no `components.json`/shadcn CLI in this repo) and export them
  from `components/index.ts` — every primitive should be reachable via the `@/components` barrel,
  not a direct `@/components/ui/*` import.  
- Icons via `lucide-react`.  
- Header height is fixed (**64px**). Sidebar is **fixed** beneath header with an overlay; it **does not** shift page content.

#### Design language — "Minimalist Dark / Amber"

- **Palette**: layered slate backgrounds with a single warm amber accent
  (`--primary` = `#F59E0B`) used **sparingly** — reserved for calls to
  action (default `Button`, `Badge`, checkbox checked-state, links,
  focus rings). `--accent` is a **neutral slate** hover/selected surface,
  **not** amber; never map amber onto generic hover states. `--success` /
  `--warning` are deliberately muted (sage / ochre), differentiated from
  `--primary` by saturation, not hue.
- **Tokens are alpha-ready**: colors map through the `<alpha-value>`
  placeholder in `tailwind.config.ts`, so opacity modifiers composite for
  real (`bg-card/60`, `border-border/[0.08]`). `--border` is pure white
  consumed at low alpha — always pair `border`/`border-border` with an
  explicit alpha (`border-border/[0.08]` default, `/[0.15]` on hover/focus);
  a bare `border` will render solid white.
- **Glass surfaces**: floating surfaces (card, dialog, popover, tooltip,
  toast, command) use `bg-*/60`–`/90` + `backdrop-blur-md` (higher opacity
  for text-dense surfaces).
- **Motion**: interactive elements use `transition-all duration-200`
  (`300` for cards/larger surfaces), amber `hover:shadow-glow-hover` +
  `active:scale-[0.98]` on primary buttons.
- **Typography**: `font-sans` (Inter) body default, `font-display`
  (Space Grotesk) on headings/titles, `font-mono` (JetBrains Mono).
  Extended scale `text-3xl`–`text-7xl` available for display headings.
- **Radius**: standalone interactive elements `rounded-lg` (badges/inputs
  as noted), containers `rounded-xl`.
- **Ambient background**: `AmbientBackground` (amber radial glow + faint
  noise) is mounted once per route-group layout — purely decorative,
  `fixed`, `-z-10`, `pointer-events-none`; never affects scroll/layout.

#### Spacing / typography density (per-page, not global)

Two modes, chosen per page — Draftmons deliberately diverges from a blanket
"generous spacing everywhere" because its data-dense views need to show more
with less scrolling:

- **Spacious** — public landing (`(public)/page.tsx`), the rules page
  (`tools/rules/page.tsx`): generous padding/line-height for prose and
  single-focus content. League/season "creation flows" are dialogs now
  (`CreateLeagueModal`/`CreateSeasonModal`), not standalone pages — dialog
  internal spacing is a `components/ui/dialog.tsx` concern, not a per-page
  density choice.
- **Compact** — Pokemon data tables (`PokemonTable.tsx`), ranking tables
  (`rank/team`, `rank/pokemon`), the tier list (`tiers/page.tsx`,
  `admin/tier-list/page.tsx`), all `admin/*` pages, `team-matchup/*` (and
  `components/comparison/*`, which it shares with `team-build/compare`):
  tight padding (`p-1`/`p-2`), small row heights, no large section padding.
  `Table`/`TableHead`/`TableCell` default to shadcn's standard `h-12`/`p-4`
  sizing — compact call sites override via `[&_th]:h-8 [&_th]:px-2
  [&_th]:py-1 [&_td]:p-2` on the `Table` element rather than touching the
  primitive itself.

These compose independently of the design tokens above.

### 7) Errors & loading

- Pages use `loading.tsx` and `error.tsx` per route group.  
- Inline fetch/loading uses shared `Spinner` and `ErrorAlert`.  
- Map backend validation errors to field messages when adding forms (current create form shows a general alert).

### 8) File organization & naming

- Co-locate small, page-specific components in a sibling `_components/` directory (see
  "`_components/` co-location" under Repository layout above).  
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

- Paths treated as **protected** (see `protectedRoutes` in `src/middleware.ts`): `/home`,
  `/league`, `/user`, `/pokemon`, `/team-build`.  
  Add new protected top-level routes to that array.
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
