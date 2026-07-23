import { AmbientBackground, Header, Sidebar, Toaster } from '@/components';
import AuthProvider from '@/components/layout/AuthProvider';
import SWRProvider from '@/components/layout/SWRProvider';

export default function ProtectedLayout({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      <SWRProvider>
        <AmbientBackground />
        <Header />
        <Sidebar />
        <main className="header-pt">{children}</main>
        <Toaster />
      </SWRProvider>
    </AuthProvider>
  );
}
