import React from 'react';
import { CircularProgress, Box, Typography } from '@mui/material';

interface LoadingStateProps {
  message?: string;
  size?: number;
}

export const LoadingState: React.FC<LoadingStateProps> = ({ 
  message = 'Loading...', 
  size = 40 
}) => {
  return (
    <Box
      display="flex"
      flexDirection="column"
      alignItems="center"
      justifyContent="center"
      p={3}
    >
      <CircularProgress size={size} />
      <Typography variant="body1" sx={{ mt: 2 }}>
        {message}
      </Typography>
    </Box>
  );
};

export const LoadingSkeleton: React.FC = () => {
  return (
    <Box sx={{ width: '100%', p: 2 }}>
      <Box sx={{ 
        height: 20, 
        width: '60%', 
        bgcolor: 'grey.200', 
        borderRadius: 1,
        mb: 2 
      }} />
      <Box sx={{ 
        height: 100, 
        bgcolor: 'grey.200', 
        borderRadius: 1,
        mb: 2 
      }} />
      <Box sx={{ 
        height: 20, 
        width: '40%', 
        bgcolor: 'grey.200', 
        borderRadius: 1 
      }} />
    </Box>
  );
}; 