'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useUiStore } from '@/stores';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { ChevronRight, Layers, ListOrdered, Swords, Wrench } from 'lucide-react';
import { cn } from '@/lib/utils';

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
  const active = pathname === href || pathname?.startsWith(href + '/');
  const content = (
    <span
      className={cn(
        'flex w-full items-center justify-between rounded-md px-3 py-2 text-sm hover:bg-accent hover:text-accent-foreground',
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
    <Link href={href as any} className="block px-2">
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
  const active = pathname === href || pathname?.startsWith(href + '/');

  const content = (
    <div
      className={cn(
        'flex items-center justify-between py-2 px-3 text-sm font-medium transition-all hover:bg-accent hover:text-accent-foreground rounded-md',
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
    <Link href={href as any} className="block w-full">
      {content}
    </Link>
  );
}

export default function Sidebar() {
  const { sidebarOpen, setSidebar } = useUiStore();

  const leaguePrefix = null;

  return (
    <>
      {/* Overlay */}
      <div
        className={cn(
          'fixed inset-0 z-40 bg-black/40 transition-opacity',
          sidebarOpen ? 'opacity-100' : 'pointer-events-none opacity-0'
        )}
        onClick={() => setSidebar(false)}
        role="presentation"
        aria-hidden={!sidebarOpen}
      />

      {/* Panel */}
      <aside
        className={cn(
          'fixed left-0 z-50 sidebar-w border-r border-border bg-background header-pt top-0 pt-[var(--header-h)]',
          sidebarOpen ? 'translate-x-0' : '-translate-x-full',
          'transition-transform'
        )}
        style={{ height: '100vh' }}
        aria-hidden={!sidebarOpen}
        aria-label="Main navigation"
      >
        <nav className="flex h-full flex-col gap-2 p-2" role="navigation">
          {/* Team Matchup */}
          <div className="mt-2">
            <NavGroup
              href={leaguePrefix ? `${leaguePrefix}/team-matchup` : '#'}
              icon={Swords}
            >
              Team Matchup
            </NavGroup>
          </div>

          {/* Tiers */}
          <Accordion
            type="single"
            collapsible
            className="w-full"
          >
            <AccordionItem value="tiers">
              <AccordionTrigger className="px-3">
                <span className="flex items-center gap-2">
                  <Layers className="h-4 w-4" />
                  Tiers
                </span>
              </AccordionTrigger>
              <AccordionContent>
                <div className="flex flex-col gap-1">
                  <NavLink
                    href={leaguePrefix ? `${leaguePrefix}/tiers/classic` : '#'}
                    disabled={!leaguePrefix}
                  >
                    Classic
                  </NavLink>
                  <NavLink href={leaguePrefix ? `${leaguePrefix}/tiers/type` : '#'} disabled={!leaguePrefix}>
                    Type
                  </NavLink>
                </div>
              </AccordionContent>
            </AccordionItem>
          </Accordion>

          {/* Rank */}
          <Accordion
            type="single"
            collapsible
            className="w-full"
          >
            <AccordionItem value="rank">
              <AccordionTrigger className="px-3">
                <span className="flex items-center gap-2">
                  <ListOrdered className="h-4 w-4" />
                  Rank
                </span>
              </AccordionTrigger>
              <AccordionContent>
                <div className="flex flex-col gap-1">
                  <NavLink href={leaguePrefix ? `${leaguePrefix}/rank/team` : '#'} disabled={!leaguePrefix}>
                    Team
                  </NavLink>
                  <NavLink
                    href={leaguePrefix ? `${leaguePrefix}/rank/pokemon` : '#'}
                    disabled={!leaguePrefix}
                  >
                    Pokemon
                  </NavLink>
                </div>
              </AccordionContent>
            </AccordionItem>
          </Accordion>

          {/* Tools */}
          <Accordion
            type="single"
            collapsible
            className="w-full"
          >
            <AccordionItem value="tools">
              <AccordionTrigger className="px-3">
                <span className="flex items-center gap-2">
                  <Wrench className="h-4 w-4" />
                  Tools
                </span>
              </AccordionTrigger>
              <AccordionContent>
                <div className="flex flex-col gap-1">
                  <NavLink
                    href={leaguePrefix ? `${leaguePrefix}/tools/schedule` : '#'}
                    disabled={!leaguePrefix}
                  >
                    Schedule
                  </NavLink>
                  <NavLink href={leaguePrefix ? `${leaguePrefix}/tools/rules` : '#'} disabled={!leaguePrefix}>
                    Rules
                  </NavLink>
                </div>
              </AccordionContent>
            </AccordionItem>
          </Accordion>

          <div className="mt-auto px-3 pb-3 text-xs text-muted-foreground">v0.1.0</div>
        </nav>
      </aside>
    </>
  );
}
