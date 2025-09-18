import React from 'react';
import { Button, Box, Typography } from '@mui/material';
import GoogleIcon from '@mui/icons-material/Google';
import { useAppDispatch } from '@/store/hooks';
import { startLogin } from '@/store/slices/authSlice';

export const GoogleSignIn: React.FC = () => {
  const dispatch = useAppDispatch();

  const handleGoogleSignIn = () => {
    dispatch(startLogin(window.location.pathname));
  };

  return (
    <Box
      display="flex"
      flexDirection="column"
      alignItems="center"
      gap={3}
      p={4}
      borderRadius={2}
      bgcolor="background.paper"
      boxShadow={3}
      maxWidth={400}
      width="100%"
    >
      <Typography variant="h4" component="h1" fontWeight="bold">
        Welcome to Draftmons
      </Typography>
      <Typography variant="body1" color="text.secondary" textAlign="center">
        Sign in to access your leagues and manage your teams
      </Typography>
      <Button
        variant="contained"
        size="large"
        fullWidth
        startIcon={<GoogleIcon />}
        onClick={handleGoogleSignIn}
        sx={{
          py: 1.5,
          textTransform: 'none',
          fontSize: '1rem',
        }}
      >
        Sign in with Google
      </Button>
    </Box>
  );
};