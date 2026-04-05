import { Header, Sidebar } from '@/components';
import AuthProvider from '@/components/layout/AuthProvider';

export default function ProtectedLayout({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      <Header />
      <Sidebar />
      <main className="header-pt">{children}</main>
    </AuthProvider>
  );
}
