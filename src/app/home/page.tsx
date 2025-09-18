'use client';

import React, { useState } from 'react';
import { Box, Container, Typography, Toolbar } from '@mui/material';
import { RequireAuth } from '@/components/auth/RequireAuth';
import { Header } from '@/components/layout/Header';
import { Sidebar } from '@/components/layout/Sidebar';
import { usePathname } from 'next/navigation';

export default function HomePage() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const pathname = usePathname();
  const isLeaguePage = pathname.startsWith('/leagues/') && pathname.split('/').length > 2;

  return (
    <RequireAuth>
      <Box sx={{ display: 'flex' }}>
        <Header onMenuClick={() => setSidebarOpen(true)} />
        {isLeaguePage && (
          <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />
        )}
        <Box component="main" sx={{ flexGrow: 1, p: 3 }}>
          <Toolbar />
          <Container maxWidth="lg">
            <Typography variant="h3" component="h1" gutterBottom>
              Welcome to Draftmons
            </Typography>
            <Typography variant="body1">
              Select a league from the header to get started.
            </Typography>
          </Container>
        </Box>
      </Box>
    </RequireAuth>
  );
}