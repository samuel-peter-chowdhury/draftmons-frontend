"use client";

import React, { useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useAppSelector, useAppDispatch } from "@/store/hooks";
import {
  selectAuthStatus,
  selectReturnTo,
  setReturnTo,
} from "@/store/slices/authSlice";
import { Loading } from "@/components/common/Loading";

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
    if (authStatus === "unauthenticated") {
      // Save the current path to return to after authentication
      dispatch(setReturnTo(pathname));
      // Redirect to the public landing page
      router.push("/");
    } else if (authStatus === "authenticated" && returnTo && returnTo !== "/") {
      // After authentication, return to the saved path
      const destination = returnTo;
      dispatch(setReturnTo(null));
      router.push(destination);
    }
  }, [authStatus, returnTo, pathname, router, dispatch]);

  // Show loading while checking auth
  if (authStatus === "checking" || authStatus === "idle") {
    return <Loading fullScreen />;
  }

  // Don't render anything if unauthenticated (will redirect)
  if (authStatus === "unauthenticated") {
    return null;
  }

  // Render children if authenticated
  return <>{children}</>;
};
