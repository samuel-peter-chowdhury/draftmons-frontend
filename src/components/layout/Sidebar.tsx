'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useUiStore } from '@/stores';
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
import { useIsModerator } from '@/stores/useLeagueStore';
import { useAuthStore } from '@/stores';

function NavLink({
  href,
  children,
  disabled
}: {
  href: string | '#';
  children: React.ReactNode;
  disabled?: boolean;
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
    <Link href={href as any} className="block px-2" onClick={() => setSidebar(false)}>
      {content}
    </Link>
  );
}

function NavGroup({
  href,
  icon: Icon,
  children,
  disabled
}: {
  href: string | '#';
  icon: React.ComponentType<{ className?: string }>;
  children: React.ReactNode;
  disabled?: boolean;
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
    <Link href={href as any} className="block w-full" onClick={() => setSidebar(false)}>
      {content}
    </Link>
  );
}

/**
 * Extract league and season IDs from the current pathname.
 * Expected format: /league/{leagueId}/season/{seasonId}/...
 */
function useSeasonPrefix(): string | null {
  const pathname = usePathname();

  if (!pathname) return null;

  // Match /league/{id}/season/{seasonId}
  const match = pathname.match(/^\/league\/(\d+)\/season\/(\d+)/);

  if (match) {
    const [, leagueId, seasonId] = match;
    return `/league/${leagueId}/season/${seasonId}`;
  }

  return null;
}

export default function Sidebar() {
  const { sidebarOpen, setSidebar } = useUiStore();
  const seasonPrefix = useSeasonPrefix();
  const { user } = useAuthStore();
  const isModerator = useIsModerator(user?.id);

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
        <nav className="flex h-full flex-col gap-2 p-2" role="navigation">
          {/*
            Season-scoped tools only exist inside a season context. Outside one we
            render the top-level browse destinations instead, so no nav item is ever
            shown in a disabled state or pointing at a dead '#' href. "Team Builds"
            is never season-scoped and appears in both branches.
          */}
          {seasonPrefix ? (
            <>
              {/* Team Matchup */}
              <div className="mt-2">
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

              {/* Team Builds */}
              <div>
                <NavGroup href="/team-build" icon={Hammer}>
                  Team Builds
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
              {isModerator && (
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
                        <NavLink href={`${seasonPrefix}/admin/match-upload`}>Match Upload</NavLink>
                      </div>
                    </AccordionContent>
                  </AccordionItem>
                </Accordion>
              )}
            </>
          ) : (
            <>
              <div className="mt-2">
                <NavGroup href="/team-build" icon={Hammer}>
                  Team Builds
                </NavGroup>
              </div>
              <div>
                <NavGroup href="/user" icon={Users}>
                  Users
                </NavGroup>
              </div>
              <div>
                <NavGroup href="/league" icon={Trophy}>
                  Leagues
                </NavGroup>
              </div>
              <div>
                <NavGroup href="/pokemon" icon={Sparkles}>
                  Pokemon
                </NavGroup>
              </div>
            </>
          )}

          <div className="mt-auto px-3 pb-3 text-xs text-muted-foreground">v0.1.0</div>
        </nav>
      </aside>
    </>
  );
}
