'use client';

import React, { useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAppSelector, useAppDispatch } from '@/store/hooks';
import { selectAuthStatus, selectReturnTo, setReturnTo } from '@/store/slices/authSlice';
import { Loading } from '@/components/common/Loading';

interface RequireAuthProps {
  children: React.ReactNode;
}

export const RequireAuth: React.FC<RequireAuthProps> = ({ children }) => {
  const router = useRouter();
  const pathname = usePathname();
  const dispatch = useAppDispatch();
  const authStatus = useAppSelector(selectAuthStatus);
  const returnTo = useAppSelector(selectReturnTo);

  useEffect(() => {
    if (authStatus === 'unauthenticated') {
      dispatch(setReturnTo(pathname));
      router.push('/');
    } else if (authStatus === 'authenticated' && returnTo) {
      const destination = returnTo;
      dispatch(setReturnTo(null));
      router.push(destination);
    }
  }, [authStatus, returnTo, pathname, router, dispatch]);

  if (authStatus === 'checking' || authStatus === 'idle') {
    return <Loading fullScreen />;
  }

  if (authStatus === 'unauthenticated') {
    return null;
  }

  return <>{children}</>;
};