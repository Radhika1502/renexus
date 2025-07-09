import { useState, useEffect } from 'react';

export const useOfflineDetection = () => {
  const [isOffline, setIsOffline] = useState(!navigator.onLine);

  useEffect(() => {
    const handleOnline = () => setIsOffline(false);
    const handleOffline = () => setIsOffline(true);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  return {
    isOffline,
    isOnline: !isOffline,
  };
};

export const useNetworkStatus = () => {
  const [networkStatus, setNetworkStatus] = useState({
    effectiveType: 'unknown',
    downlink: 0,
    rtt: 0,
  });

  useEffect(() => {
    if ('connection' in navigator) {
      const connection = (navigator as any).connection;

      const updateNetworkStatus = () => {
        setNetworkStatus({
          effectiveType: connection.effectiveType,
          downlink: connection.downlink,
          rtt: connection.rtt,
        });
      };

      updateNetworkStatus();
      connection.addEventListener('change', updateNetworkStatus);

      return () => {
        connection.removeEventListener('change', updateNetworkStatus);
      };
    }
  }, []);

  return networkStatus;
}; 