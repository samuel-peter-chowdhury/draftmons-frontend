import { AmbientBackground, Header, Sidebar, Toaster } from '@/components';
import AuthProvider from '@/components/layout/AuthProvider';

export default function ProtectedLayout({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      <AmbientBackground />
      <Header />
      <Sidebar />
      <main className="header-pt">{children}</main>
      <Toaster />
    </AuthProvider>
  );
}
