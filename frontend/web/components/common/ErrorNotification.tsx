import React from 'react';
import { Alert, Snackbar, Stack } from '@mui/material';
import { useErrorStore } from '../../stores/errorStore';

export const ErrorNotification: React.FC = () => {
  const { errors, removeError } = useErrorStore();

  const handleClose = (id: string) => {
    removeError(id);
  };

  return (
    <Stack spacing={2} sx={{ position: 'fixed', bottom: 24, right: 24, zIndex: 2000 }}>
      {errors.map((error) => (
        <Snackbar
          key={error.id}
          open={true}
          autoHideDuration={5000}
          onClose={() => handleClose(error.id)}
          anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
        >
          <Alert
            onClose={() => handleClose(error.id)}
            severity={error.type}
            variant="filled"
            sx={{ width: '100%' }}
          >
            {error.message}
          </Alert>
        </Snackbar>
      ))}
    </Stack>
  );
}; 