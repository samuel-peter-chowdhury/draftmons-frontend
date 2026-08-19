'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import {
  ChevronRight,
  Hammer,
  Layers,
  ListOrdered,
  Shield,
  Sparkles,
  Swords,
  Trophy,
  Users,
  Wrench,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  useAuthStore,
  useIsModerator,
  useLeagueStore,
  useRecentLeagueStore,
  useUiStore,
} from '@/stores';

function NavLink({
  href,
  children,
  disabled,
  newTab
}: {
  href: string | '#';
  children: React.ReactNode;
  disabled?: boolean;
  newTab?: boolean;
}) {
  const pathname = usePathname();
  const setSidebar = useUiStore((s) => s.setSidebar);
  const active = pathname === href || pathname?.startsWith(href + '/');
  const content = (
    <span
      className={cn(
        'flex w-full items-center justify-between rounded-lg px-3 py-2 text-sm transition-all duration-200 hover:bg-accent hover:text-accent-foreground',
        active && 'bg-accent text-accent-foreground',
        disabled && 'opacity-50'
      )}
    >
      {children}
      <ChevronRight className="h-4 w-4" />
    </span>
  );
  if (disabled) return <div className="px-2">{content}</div>;
  return (
    <Link
      href={href as any}
      className="block px-2"
      target={newTab ? '_blank' : undefined}
      rel={newTab ? 'noopener noreferrer' : undefined}
      onClick={newTab ? undefined : () => setSidebar(false)}
    >
      {content}
    </Link>
  );
}

function NavGroup({
  href,
  icon: Icon,
  children,
  disabled,
  newTab
}: {
  href: string | '#';
  icon: React.ComponentType<{ className?: string }>;
  children: React.ReactNode;
  disabled?: boolean;
  newTab?: boolean;
}) {
  const pathname = usePathname();
  const setSidebar = useUiStore((s) => s.setSidebar);
  const active = pathname === href || pathname?.startsWith(href + '/');

  const content = (
    <div
      className={cn(
        'flex items-center justify-between py-2 px-3 text-sm font-medium transition-all duration-200 hover:bg-accent hover:text-accent-foreground rounded-lg',
        active && 'bg-accent text-accent-foreground',
        disabled && 'opacity-50 cursor-not-allowed'
      )}
    >
      <span className="flex items-center gap-2">
        <Icon className="h-4 w-4" />
        {children}
      </span>
      <ChevronRight className="h-4 w-4" />
    </div>
  );

  if (disabled) {
    return <div className="w-full">{content}</div>;
  }

  return (
    <Link
      href={href as any}
      className="block w-full"
      target={newTab ? '_blank' : undefined}
      rel={newTab ? 'noopener noreferrer' : undefined}
      // A new-tab link leaves this tab where it was, so closing the mobile
      // overlay would be a surprising extra step.
      onClick={newTab ? undefined : () => setSidebar(false)}
    >
      {content}
    </Link>
  );
}

/**
 * Small uppercase label separating the two nav groups. With an `href` it links
 * (season overview); without one it's static ("General").
 */
function SidebarSectionHeader({ href, label }: { href?: string; label: string }) {
  const setSidebar = useUiStore((s) => s.setSidebar);
  // `shrink-0` is load-bearing: `truncate` brings `overflow-hidden`, which switches
  // off a flex item's automatic minimum size, so without it the header gets squashed
  // from 24px to 8px (text clipped) as soon as the nav column overflows.
  const className =
    'block shrink-0 truncate px-3 py-1 text-xs font-medium uppercase tracking-wide text-muted-foreground';

  if (!href) {
    return (
      <div className={className} title={label}>
        {label}
      </div>
    );
  }

  return (
    <Link
      href={href as any}
      className={cn(className, 'transition-colors hover:text-foreground')}
      title={label}
      onClick={() => setSidebar(false)}
    >
      {label}
    </Link>
  );
}

type SidebarSeasonContext = {
  /** `live` = derived from the current URL, `cache` = the last-visited season. */
  source: 'live' | 'cache';
  prefix: string;
  leagueId: number;
  leagueAbbreviation: string | null;
  seasonName: string | null;
};

/**
 * Which season's nav the sidebar should show, in priority order:
 *
 * 1. The season in the current URL (`/league/{id}/season/{seasonId}/...`) — its
 *    league/season are already being fetched by the season layout.
 * 2. Otherwise the last-visited season from `useRecentLeagueStore`, so its nav
 *    survives a trip to a general page (or a hard reload).
 * 3. Otherwise `null` — the season section is omitted entirely.
 *
 * In the cached case this also kicks off a background `fetchLeague` so Admin
 * visibility can be resolved from a real API response rather than from
 * client-writable storage. `fetchLeague` already dedupes, so this is a no-op
 * once that league is loaded.
 */
function useSidebarSeasonContext(): SidebarSeasonContext | null {
  const pathname = usePathname();
  const match = pathname?.match(/^\/league\/(\d+)\/season\/(\d+)/);

  const league = useLeagueStore((s) => s.league);
  const season = useLeagueStore((s) => s.season);
  const fetchLeague = useLeagueStore((s) => s.fetchLeague);

  const hydrate = useRecentLeagueStore((s) => s.hydrate);
  const cachedLeagueId = useRecentLeagueStore((s) => s.leagueId);
  const cachedLeagueAbbreviation = useRecentLeagueStore((s) => s.leagueAbbreviation);
  const cachedSeasonId = useRecentLeagueStore((s) => s.seasonId);
  const cachedSeasonName = useRecentLeagueStore((s) => s.seasonName);

  // Reading localStorage during render would desync the server markup; the store
  // no-ops on every call after the first.
  useEffect(() => {
    hydrate();
  }, [hydrate]);

  const liveLeagueId = match ? Number(match[1]) : null;
  const cachedOnly = !match && cachedLeagueId !== null && cachedSeasonId !== null;

  useEffect(() => {
    if (cachedOnly && cachedLeagueId) fetchLeague(cachedLeagueId);
  }, [cachedOnly, cachedLeagueId, fetchLeague]);

  if (match && liveLeagueId) {
    const seasonId = Number(match[2]);
    return {
      source: 'live',
      prefix: `/league/${liveLeagueId}/season/${seasonId}`,
      leagueId: liveLeagueId,
      // The links come from the URL params; only the header text needs the fetch,
      // so a not-yet-loaded league/season shows a placeholder instead of blocking.
      leagueAbbreviation: league?.id === liveLeagueId ? league.abbreviation : null,
      seasonName: season?.id === seasonId ? season.name : null,
    };
  }

  if (cachedOnly && cachedLeagueId && cachedSeasonId) {
    return {
      source: 'cache',
      prefix: `/league/${cachedLeagueId}/season/${cachedSeasonId}`,
      leagueId: cachedLeagueId,
      leagueAbbreviation: cachedLeagueAbbreviation,
      seasonName: cachedSeasonName,
    };
  }

  return null;
}

export default function Sidebar() {
  const { sidebarOpen, setSidebar } = useUiStore();
  const seasonCtx = useSidebarSeasonContext();
  const { user } = useAuthStore();
  /*
    Always derived from `useLeagueStore.league.leagueUsers` — i.e. a real
    `GET /api/league/:id?full=true` response — never from the persisted recent
    league. A user can hand-edit localStorage; they can't fabricate an API
    response, so Admin stays hidden until a genuine one confirms moderator status.
  */
  const isModerator = useIsModerator(user?.id);
  const moderatorLeagueId = useLeagueStore((s) => s.league?.id);
  const showAdmin = isModerator && moderatorLeagueId === seasonCtx?.leagueId;

  const seasonPrefix = seasonCtx?.prefix;
  const seasonLabel =
    seasonCtx &&
    (seasonCtx.leagueAbbreviation && seasonCtx.seasonName
      ? `${seasonCtx.leagueAbbreviation} | ${seasonCtx.seasonName}`
      : 'Loading…');

  return (
    <>
      {/* Overlay */}
      <div
        className={cn(
          'fixed inset-x-0 bottom-0 top-[var(--header-h)] z-40 bg-black/40 transition-opacity',
          sidebarOpen ? 'opacity-100' : 'pointer-events-none opacity-0'
        )}
        onClick={() => setSidebar(false)}
        role="presentation"
        aria-hidden={!sidebarOpen}
      />

      {/* Panel */}
      <aside
        className={cn(
          'fixed left-0 top-[var(--header-h)] z-50 sidebar-w border-r border-border/[0.08] bg-background/90 backdrop-blur-md',
          sidebarOpen ? 'translate-x-0' : '-translate-x-full',
          'transition-transform'
        )}
        style={{ height: 'calc(100vh - var(--header-h))' }}
        aria-hidden={!sidebarOpen}
        aria-label="Main navigation"
      >
        <nav className="flex h-full flex-col p-2" role="navigation">
          {/*
            `min-h-0` is load-bearing: without it flexbox lets this child grow past
            the aside's fixed height and the nav never scrolls, it just overflows.
          */}
          <div className="flex min-h-0 flex-1 flex-col gap-2 overflow-y-auto">
            {/*
              Season-scoped tools come from either the current URL or the
              last-visited season, so they stay reachable from general pages.
              General destinations always render below them.
            */}
            {seasonCtx && (
              <>
                <SidebarSectionHeader href={seasonPrefix} label={seasonLabel!} />

                {/* Team Matchup */}
                <div>
                  <NavGroup href={`${seasonPrefix}/team-matchup`} icon={Swords}>
                    Team Matchup
                  </NavGroup>
                </div>

                {/* Tier List */}
                <div>
                  <NavGroup href={`${seasonPrefix}/tiers`} icon={Layers}>
                    Tier List
                  </NavGroup>
                </div>

                {/* Rank */}
                <Accordion type="single" collapsible className="w-full">
                  <AccordionItem value="rank">
                    <AccordionTrigger className="px-3">
                      <span className="flex items-center gap-2">
                        <ListOrdered className="h-4 w-4" />
                        Rank
                      </span>
                    </AccordionTrigger>
                    <AccordionContent>
                      <div className="flex flex-col gap-1">
                        <NavLink href={`${seasonPrefix}/rank/team`}>Team</NavLink>
                        <NavLink href={`${seasonPrefix}/rank/pokemon`}>Pokemon</NavLink>
                      </div>
                    </AccordionContent>
                  </AccordionItem>
                </Accordion>

                {/* Tools */}
                <Accordion type="single" collapsible className="w-full">
                  <AccordionItem value="tools">
                    <AccordionTrigger className="px-3">
                      <span className="flex items-center gap-2">
                        <Wrench className="h-4 w-4" />
                        Tools
                      </span>
                    </AccordionTrigger>
                    <AccordionContent>
                      <div className="flex flex-col gap-1">
                        <NavLink href={`${seasonPrefix}/tools/schedule`}>Schedule</NavLink>
                        <NavLink href={`${seasonPrefix}/tools/rules`}>Rules</NavLink>
                        <NavLink href={`${seasonPrefix}/tools/search`}>Pokemon Search</NavLink>
                        <NavLink href={`${seasonPrefix}/tools/roster`}>Roster</NavLink>
                      </div>
                    </AccordionContent>
                  </AccordionItem>
                </Accordion>

                {/* Admin (moderators only) */}
                {showAdmin && (
                  <Accordion type="single" collapsible className="w-full">
                    <AccordionItem value="admin">
                      <AccordionTrigger className="px-3">
                        <span className="flex items-center gap-2">
                          <Shield className="h-4 w-4" />
                          Admin
                        </span>
                      </AccordionTrigger>
                      <AccordionContent>
                        <div className="flex flex-col gap-1">
                          <NavLink href={`${seasonPrefix}/admin/team`}>Teams</NavLink>
                          <NavLink href={`${seasonPrefix}/admin/tier-list`}>Tier List</NavLink>
                          <NavLink href={`${seasonPrefix}/admin/schedule`}>Schedule</NavLink>
                          <NavLink href={`${seasonPrefix}/admin/match-upload`}>
                            Match Upload
                          </NavLink>
                        </div>
                      </AccordionContent>
                    </AccordionItem>
                  </Accordion>
                )}
              </>
            )}

            {/* General */}
            <SidebarSectionHeader label="General" />
            <div>
              <NavGroup href="/team-build" icon={Hammer} newTab>
                Team Builds
              </NavGroup>
            </div>
            <div>
              <NavGroup href="/user" icon={Users} newTab>
                Users
              </NavGroup>
            </div>
            <div>
              <NavGroup href="/league" icon={Trophy} newTab>
                Leagues
              </NavGroup>
            </div>
            <div>
              <NavGroup href="/pokemon" icon={Sparkles} newTab>
                Pokemon
              </NavGroup>
            </div>
          </div>

          <div className="px-3 pb-3 pt-2 text-xs text-muted-foreground">v0.1.0</div>
        </nav>
      </aside>
    </>
  );
}
