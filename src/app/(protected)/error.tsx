'use client';

import { useEffect } from 'react';
import { Button, Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components';
import { AlertCircle } from 'lucide-react';

export default function ProtectedError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('Protected route error:', error);
  }, [error]);

  return (
    <div className="mx-auto flex min-h-screen max-w-7xl items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <div className="mb-2 flex justify-center">
            <AlertCircle className="h-12 w-12 text-destructive" />
          </div>
          <CardTitle className="text-center">Something went wrong!</CardTitle>
          <CardDescription className="text-center">
            An error occurred while loading this page.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-2">
          {error.digest && (
            <p className="text-center text-xs text-muted-foreground">Error ID: {error.digest}</p>
          )}
          <Button onClick={reset} className="w-full">
            Try again
          </Button>
          <Button variant="outline" onClick={() => (window.location.href = '/home')} className="w-full">
            Go to home
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
