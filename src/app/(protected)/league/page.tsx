'use client';

import React, { useEffect, useState } from 'react';
import { Container, Typography, Box } from '@mui/material';
import { Loading } from '@/components/common/Loading';
import { ErrorAlert } from '@/components/common/ErrorAlert';
import { LeagueInputDto } from '../../../dtos/league.dto';
import leagueService from '../../../services/api/league.service';

export default function LeaguesPage() {
  const [leagues, setLeagues] = useState<Array<LeagueInputDto>>(new Array<LeagueInputDto>());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchLeagues();
  }, []);

  const fetchLeagues = async () => {
    try {
      const response = await leagueService.getAll(true);
      setLeagues(response.data);
    } catch (err) {
      setError('Failed to load leagues');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container maxWidth="lg">
      <Typography variant="h4" component="h1" gutterBottom>
        Leagues
      </Typography>
      <ErrorAlert error={error} />
      {loading ? (
        <Loading />
      ) : (
        <Box>
          {leagues.length === 0 ? (
            <Typography color="text.secondary">
              No leagues found. Create your first league to get started!
            </Typography>
          ) : (
            leagues.map((league) => (
              <Typography key={league.id}>{league.name}</Typography>
            ))
          )}
        </Box>
      )}
    </Container>
  );
}