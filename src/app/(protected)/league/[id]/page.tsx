'use client';

import React, { useEffect, useState } from 'react';
import { Container, Typography } from '@mui/material';
import { Loading } from '@/components/common/Loading';
import { useParams } from 'next/navigation';
import { LeagueInputDto } from '../../../../dtos/league.dto';
import leagueService from '../../../../services/api/league.service';

export default function LeagueDetailPage() {
  const [league, setLeague] = useState<LeagueInputDto>();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const params = useParams();
  const leagueId = params?.id as string;

  useEffect(() => {
    if (leagueId) {
      fetchLeague();
    }
  }, [leagueId]);
  
  const fetchLeague = async () => {
    try {
      const response = await leagueService.getById(leagueId);
      setLeague(response);
    } catch (err) {
      setError('Failed to load leagues');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container maxWidth="lg">
      {loading ? (
        <Loading />
      ) : (
        <Typography variant="h4" component="h1" gutterBottom>
          League Dashboard
        </Typography>
      )}
    </Container>
  );
}