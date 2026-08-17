'use client';

import { useRouter } from 'next/navigation';
import { Home, LogOut, Menu } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { UserAvatar } from '@/components/user/UserAvatar';
import { useAuthStore, useUiStore } from '@/stores';

export default function Header() {
  const router = useRouter();
  const toggleSidebar = useUiStore((s) => s.toggleSidebar);
  const logout = useAuthStore((s) => s.logout);
  const user = useAuthStore((s) => s.user);

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
    <header className="fixed inset-x-0 top-0 z-50 border-b border-border/[0.08] bg-background/70 backdrop-blur-md header-h">
      <div className="mx-auto flex h-full max-w-7xl items-center justify-between px-4">
        <div className="flex items-center gap-2">
          {/* The sidebar always has content — season-scoped tools inside a season,
              the top-level browse destinations outside one — so the toggle is
              always available on protected routes. */}
          <Button variant="ghost" size="icon" aria-label="Open menu" onClick={toggleSidebar}>
            <Menu className="h-5 w-5" />
          </Button>
          <Button variant="ghost" size="icon" aria-label="Home" onClick={() => router.push('/home')}>
            <Home className="h-5 w-5" />
          </Button>
        </div>
        <div className="font-display text-base font-semibold tracking-tight">Draftmons</div>
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            aria-label="My Profile"
            onClick={onNavigateToProfile}
            disabled={!user?.id}
          >
            <UserAvatar
              avatarUrl={user?.avatarUrl}
              name={user?.firstName || 'Profile'}
              className="h-5 w-5 rounded-full object-cover"
            />
          </Button>
          <Button variant="ghost" size="icon" aria-label="Logout" onClick={onLogout}>
            <LogOut className="h-5 w-5" />
          </Button>
        </div>
      </div>
    </header>
  );
}
