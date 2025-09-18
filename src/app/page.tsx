'use client';

import React, { useEffect } from 'react';
import { Box } from '@mui/material';
import { GoogleSignIn } from '@/components/auth/GoogleSignIn';
import { useAppSelector } from '@/store/hooks';
import { selectAuthStatus } from '@/store/slices/authSlice';
import { useRouter } from 'next/navigation';
import { Loading } from '@/components/common/Loading';

export default function LandingPage() {
  const router = useRouter();
  const authStatus = useAppSelector(selectAuthStatus);

  useEffect(() => {
    if (authStatus === 'authenticated') {
      router.push('/home');
    }
  }, [authStatus, router]);

  if (authStatus === 'checking' || authStatus === 'idle') {
    return <Loading fullScreen />;
  }

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