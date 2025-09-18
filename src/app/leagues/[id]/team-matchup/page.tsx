'use client';

import React, { useState } from 'react';
import { Box, Container, Typography, Toolbar } from '@mui/material';
import { RequireAuth } from '@/components/auth/RequireAuth';
import { Header } from '@/components/layout/Header';
import { Sidebar } from '@/components/layout/Sidebar';

export default function TeamMatchupPage() {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <RequireAuth>
      <Box sx={{ display: 'flex' }}>
        <Header onMenuClick={() => setSidebarOpen(true)} />
        <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />
        <Box component="main" sx={{ flexGrow: 1, p: 3 }}>
          <Toolbar />
          <Container maxWidth="lg">
            <Typography variant="h4" component="h1" gutterBottom>
              Team Matchup
            </Typography>
          </Container>
        </Box>
      </Box>
    </RequireAuth>
  );
}