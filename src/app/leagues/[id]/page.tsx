'use client';

import React, { useEffect, useState } from 'react';
import { Box, Container, Typography, Toolbar } from '@mui/material';
import { RequireAuth } from '@/components/auth/RequireAuth';
import { Header } from '@/components/layout/Header';
import { Sidebar } from '@/components/layout/Sidebar';
import { Loading } from '@/components/common/Loading';
import { useParams } from 'next/navigation';
import { useAppDispatch } from '@/store/hooks';
import { setCurrentLeague } from '@/store/slices/currentLeagueSlice';
import leaguesService from '@/services/api/leagues.service';

export default function LeagueDetailPage() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const params = useParams();
  const dispatch = useAppDispatch();
  const leagueId = params?.id as string;

  useEffect(() => {
    if (leagueId) {
      fetchLeague();
    }
  }, [leagueId]);

  const fetchLeague = async () => {
    try {
      const league = await leaguesService.getById(leagueId);
      dispatch(setCurrentLeague(league));
    } catch (error) {
      console.error('Failed to fetch league:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <RequireAuth>
      <Box sx={{ display: 'flex' }}>
        <Header onMenuClick={() => setSidebarOpen(true)} />
        <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />
        <Box component="main" sx={{ flexGrow: 1, p: 3 }}>
          <Toolbar />
          <Container maxWidth="lg">
            {loading ? (
              <Loading />
            ) : (
              <Typography variant="h4" component="h1" gutterBottom>
                League Dashboard
              </Typography>
            )}
          </Container>
        </Box>
      </Box>
    </RequireAuth>
  );
}