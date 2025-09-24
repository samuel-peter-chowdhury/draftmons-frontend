'use client';

import React from 'react';
import { Container, Typography, Box } from '@mui/material';
import { useAppSelector } from '@/store/hooks';
import { selectUser } from '@/store/slices/authSlice';

export default function HomePage() {
  const user = useAppSelector(selectUser);

  return (
    <Container maxWidth="lg">
      <Typography variant="h3" component="h1" gutterBottom>
        Welcome to Draftmons{user?.firstName ? `, ${user.firstName}` : ''}
      </Typography>
      <Typography variant="body1" color="text.secondary" paragraph>
        Select a league from the header to get started.
      </Typography>
      
      <Box mt={4}>
        <Typography variant="h5" component="h2" gutterBottom>
          Getting Started
        </Typography>
        <Typography variant="body1" paragraph>
          Use the leagues dropdown in the header to navigate to your leagues, or create a new one to begin drafting.
        </Typography>
      </Box>

      <Box mt={4}>
        <Typography variant="h5" component="h2" gutterBottom>
          Your Dashboard
        </Typography>
        <Typography variant="body1" paragraph>
          Track your team performance, upcoming drafts, and league standings all from this dashboard.
        </Typography>
      </Box>
    </Container>
  );
}