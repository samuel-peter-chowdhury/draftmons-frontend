'use client';

import { useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Image from 'next/image';
import {
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Spinner,
} from '@/components';
import { useAuthStore } from '@/stores';
import { AuthApi } from '@/lib/api';
import { CLIENT_URL } from '@/lib/constants';
import { LogIn } from 'lucide-react';

export default function LandingPage() {
  const router = useRouter();
  const search = useSearchParams();
  const { isAuthenticated, loading, checkAuth } = useAuthStore();

  useEffect(() => {
    // Check session on first load
    checkAuth();
  }, [checkAuth]);

  useEffect(() => {
    if (isAuthenticated) {
      const raw = search.get('next') || '/home';
      // Validate: must start with / and not // (prevent open redirect)
      const next = raw.startsWith('/') && !raw.startsWith('//') ? raw : '/home';
      router.replace(next as any);
    }
  }, [isAuthenticated, search, router]);

  const rawNext = search.get('next') || '/home';
  const next = rawNext.startsWith('/') && !rawNext.startsWith('//') ? rawNext : '/home';
  const redirectUrl = `${CLIENT_URL}${next}`;
  const googleUrl = AuthApi.getGoogleAuthUrl(redirectUrl);

  return (
    <div className="relative flex min-h-screen items-center justify-center p-4">
      <Image
        src="/images/draftmons-background.jpg"
        alt="Background"
        fill
        priority
        className="object-cover"
        quality={100}
      />
      <div className="relative z-10">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>Welcome to Draftmons</CardTitle>
            <CardDescription>Sign in to continue.</CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex items-center justify-center py-6">
                <Spinner size={28} />
              </div>
            ) : (
              <a href={googleUrl}>
                <Button className="w-full">
                  <LogIn className="mr-2 h-4 w-4" />
                  Sign in with Google
                </Button>
              </a>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
