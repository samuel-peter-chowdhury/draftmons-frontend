import React from 'react';
import { Box, CircularProgress, LinearProgress } from '@mui/material';

interface LoadingProps {
  fullScreen?: boolean;
  linear?: boolean;
}

export const Loading: React.FC<LoadingProps> = ({ fullScreen = false, linear = false }) => {
  if (linear) {
    return <LinearProgress />;
  }

  if (fullScreen) {
    return (
      <Box
        display="flex"
        justifyContent="center"
        alignItems="center"
        minHeight="100vh"
        bgcolor="background.default"
      >
        <CircularProgress size={60} />
      </Box>
    );
  }

  return (
    <Box display="flex" justifyContent="center" alignItems="center" p={4}>
      <CircularProgress />
    </Box>
  );
};