import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <div className="text-center">
        <h1 className="text-6xl font-bold text-foreground">404</h1>
        <p className="mt-4 text-lg text-muted-foreground">Page not found</p>
        <Link
          href="/home"
          className="mt-6 inline-block rounded-md bg-primary px-6 py-2 text-sm text-primary-foreground hover:bg-primary/90"
        >
          Go home
        </Link>
      </div>
    </div>
  );
}
