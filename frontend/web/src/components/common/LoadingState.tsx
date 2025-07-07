import React from 'react';
import { CircularProgress, Typography, Box } from '@mui/material';

interface LoadingStateProps {
  message?: string;
  size?: 'small' | 'medium' | 'large';
  fullScreen?: boolean;
}

export const LoadingState: React.FC<LoadingStateProps> = ({
  message = 'Loading...',
  size = 'medium',
  fullScreen = false
}) => {
  const spinnerSize = {
    small: 24,
    medium: 40,
    large: 56
  }[size];

  const containerStyles = fullScreen ? {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    zIndex: 9999
  } : {};

  return (
    <Box
      display="flex"
      flexDirection="column"
      alignItems="center"
      justifyContent="center"
      minHeight={fullScreen ? '100vh' : '200px'}
      style={containerStyles}
    >
      <CircularProgress size={spinnerSize} />
      <Typography
        variant="body1"
        color="textSecondary"
        style={{ marginTop: 16 }}
      >
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