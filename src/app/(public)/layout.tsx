import { AmbientBackground } from '@/components';

export default function PublicLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <AmbientBackground />
      <main className="min-h-screen">{children}</main>
    </>
  );
}
