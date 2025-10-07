'use client';

import { useRouter } from 'next/navigation';
import { Home, LogOut, Menu } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuthStore, useUiStore } from '@/stores';

export default function Header() {
  const router = useRouter();
  const toggleSidebar = useUiStore((s) => s.toggleSidebar);
  const logout = useAuthStore((s) => s.logout);

  const onLogout = async () => {
    try {
      await logout();
      router.replace('/');
    } catch {
      // swallow; ErrorAlert components on pages will show if needed
    }
  };

  return (
    <header className="fixed inset-x-0 top-0 z-50 border-b border-border bg-background/80 backdrop-blur header-h">
      <div className="mx-auto flex h-full max-w-7xl items-center justify-between px-4">
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" aria-label="Open menu" onClick={toggleSidebar}>
            <Menu className="h-5 w-5" />
          </Button>
          <Button variant="ghost" size="icon" aria-label="Home" onClick={() => router.push('/home')}>
            <Home className="h-5 w-5" />
          </Button>
        </div>
        <div className="text-sm font-medium">Draftmons</div>
        <div>
          <Button variant="ghost" size="icon" aria-label="Logout" onClick={onLogout}>
            <LogOut className="h-5 w-5" />
          </Button>
        </div>
      </div>
    </header>
  );
}
