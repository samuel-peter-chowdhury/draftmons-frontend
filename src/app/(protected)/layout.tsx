import { Header, Sidebar } from '@/components';

export default function ProtectedLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <Header />
      <Sidebar />
      <main className="header-pt">{children}</main>
    </>
  );
}
