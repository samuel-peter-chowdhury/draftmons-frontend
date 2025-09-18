'use client';

import React, { useEffect, useState } from 'react';
import { Box, Container, Typography, Toolbar } from '@mui/material';
import { RequireAuth } from '@/components/auth/RequireAuth';
import { Header } from '@/components/layout/Header';
import { Loading } from '@/components/common/Loading';
import { ErrorAlert } from '@/components/common/ErrorAlert';
import leaguesService from '@/services/api/leagues.service';
import { League } from '@/types/league.types';

export default function LeaguesPage() {
  const [leagues, setLeagues] = useState<League[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchLeagues();
  }, []);

  const fetchLeagues = async () => {
    try {
      const response = await leaguesService.getAll();
      setLeagues(response.data);
    } catch (err) {
      setError('Failed to load leagues');
    } finally {
      setLoading(false);
    }
  };

  return (
    <RequireAuth>
      <Box sx={{ display: 'flex' }}>
        <Header />
        <Box component="main" sx={{ flexGrow: 1, p: 3 }}>
          <Toolbar />
          <Container maxWidth="lg">
            <Typography variant="h4" component="h1" gutterBottom>
              Leagues
            </Typography>
            <ErrorAlert error={error} />
            {loading ? (
              <Loading />
            ) : (
              <Box>
                {leagues.map((league) => (
                  <Typography key={league.id}>{league.name}</Typography>
                ))}
              </Box>
            )}
          </Container>
        </Box>
      </Box>
    </RequireAuth>
  );
}