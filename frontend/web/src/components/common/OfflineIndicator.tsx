import React, { useEffect } from 'react';
import { Alert, Slide } from '@mui/material';
import { useSyncStore } from '../../stores/syncStore';
import { WifiOff } from '@mui/icons-material';

export const OfflineIndicator: React.FC = () => {
  const { isOnline, setOnlineStatus, pendingOperations } = useSyncStore();

  useEffect(() => {
    const handleOnline = () => setOnlineStatus(true);
    const handleOffline = () => setOnlineStatus(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [setOnlineStatus]);

  if (isOnline) {
    return null;
  }

  return (
    <Slide direction="down" in={!isOnline} mountOnEnter unmountOnExit>
      <Alert
        icon={<WifiOff />}
        severity="warning"
        variant="filled"
        sx={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          zIndex: 2000,
          borderRadius: 0,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        You are offline
        {pendingOperations.length > 0 && 
          ` • ${pendingOperations.length} changes pending sync`}
      </Alert>
    </Slide>
  );
}; 