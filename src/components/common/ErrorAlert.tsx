import React from 'react';
import { Alert, AlertTitle } from '@mui/material';

interface ErrorAlertProps {
  error: string | null;
  title?: string;
  onClose?: () => void;
}

export const ErrorAlert: React.FC<ErrorAlertProps> = ({ error, title = 'Error', onClose }) => {
  if (!error) return null;

  return (
    <Alert severity="error" onClose={onClose} sx={{ mb: 2 }}>
      <AlertTitle>{title}</AlertTitle>
      {error}
    </Alert>
  );
};