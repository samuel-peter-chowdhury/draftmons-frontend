'use client';

import React from 'react';

export default function PublicLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Public pages don't need authentication or header
  // This layout is intentionally minimal
  return <>{children}</>;
}