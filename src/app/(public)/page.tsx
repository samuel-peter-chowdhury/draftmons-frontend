'use client';

import React, { useEffect } from 'react';
import { Box } from '@mui/material';
import { GoogleSignIn } from '@/components/auth/GoogleSignIn';
import { Loading } from '@/components/common/Loading';
import { useAppSelector } from '@/store/hooks';
import { selectAuthStatus } from '@/store/slices/authSlice';
import { useRouter } from 'next/navigation';

export default function LandingPage() {
  const router = useRouter();
  const authStatus = useAppSelector(selectAuthStatus);

  useEffect(() => {
    // If already authenticated, redirect to home
    if (authStatus === 'authenticated') {
      router.push('/home');
    }
  }, [authStatus, router]);

  // Show loading state while checking authentication
  if (authStatus === 'checking' || authStatus === 'idle') {
    return <Loading fullScreen />;
  }

  // Show sign-in page for unauthenticated users
  if (authStatus === 'unauthenticated') {
    return (
      <Box
        display="flex"
        justifyContent="center"
        alignItems="center"
        minHeight="100vh"
        bgcolor="background.default"
      >
        <GoogleSignIn />
      </Box>
    );
  }

  // Brief loading state while redirecting authenticated users
  return <Loading fullScreen />;
}