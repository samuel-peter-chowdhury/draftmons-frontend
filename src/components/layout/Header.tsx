'use client';

import { usePathname, useRouter } from 'next/navigation';
import { Home, LogOut, Menu, User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuthStore, useUiStore } from '@/stores';

// Regex pattern to match paths where the menu icon should be visible
const MENU_VISIBLE_PATH_REGEX = /^.*\/league\/\d+\/season\/\d+(?:\/.*)?$/;

export default function Header() {
  const router = useRouter();
  const pathname = usePathname();
  const toggleSidebar = useUiStore((s) => s.toggleSidebar);
  const logout = useAuthStore((s) => s.logout);
  const user = useAuthStore((s) => s.user);

  // Check if current path matches the regex pattern
  const shouldShowMenu = MENU_VISIBLE_PATH_REGEX
    ? new RegExp(MENU_VISIBLE_PATH_REGEX).test(pathname)
    : false;

  const onLogout = async () => {
    try {
      await logout();
      router.replace('/');
    } catch {
      // swallow; ErrorAlert components on pages will show if needed
    }
  };

  const onNavigateToProfile = () => {
    if (user?.id) {
      router.push(`/user/${user.id}` as any);
    }
  };

  return (
    <header className="fixed inset-x-0 top-0 z-50 border-b border-border bg-background/80 backdrop-blur header-h">
      <div className="mx-auto flex h-full max-w-7xl items-center justify-between px-4">
        <div className="flex items-center gap-2">
          {shouldShowMenu && (
            <Button variant="ghost" size="icon" aria-label="Open menu" onClick={toggleSidebar}>
              <Menu className="h-5 w-5" />
            </Button>
          )}
          <Button variant="ghost" size="icon" aria-label="Home" onClick={() => router.push('/home')}>
            <Home className="h-5 w-5" />
          </Button>
        </div>
        <div className="text-sm font-medium">Draftmons</div>
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            aria-label="My Profile"
            onClick={onNavigateToProfile}
            disabled={!user?.id}
          >
            <User className="h-5 w-5" />
          </Button>
          <Button variant="ghost" size="icon" aria-label="Logout" onClick={onLogout}>
            <LogOut className="h-5 w-5" />
          </Button>
        </div>
      </div>
    </header>
  );
}
