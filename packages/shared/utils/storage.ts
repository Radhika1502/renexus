/**
 * Storage Utilities
 * 
 * This file exports storage utility functions for browser and node environments
 */

// Browser storage utilities
export const localStorageAvailable = (): boolean => {
  try {
    const testKey = '__storage_test__';
    localStorage.setItem(testKey, testKey);
    localStorage.removeItem(testKey);
    return true;
  } catch (e) {
    return false;
  }
};

export const setLocalStorageItem = <T>(key: string, value: T): void => {
  if (!localStorageAvailable()) return;
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (error) {
    console.error('Error saving to localStorage:', error);
  }
};

export const getLocalStorageItem = <T>(key: string, defaultValue: T): T => {
  if (!localStorageAvailable()) return defaultValue;
  try {
    const item = localStorage.getItem(key);
    return item ? JSON.parse(item) : defaultValue;
  } catch (error) {
    console.error('Error reading from localStorage:', error);
    return defaultValue;
  }
};

export const removeLocalStorageItem = (key: string): void => {
  if (!localStorageAvailable()) return;
  try {
    localStorage.removeItem(key);
  } catch (error) {
    console.error('Error removing from localStorage:', error);
  }
};

export const clearLocalStorage = (): void => {
  if (!localStorageAvailable()) return;
  try {
    localStorage.clear();
  } catch (error) {
    console.error('Error clearing localStorage:', error);
  }
};

// Session storage utilities
export const sessionStorageAvailable = (): boolean => {
  try {
    const testKey = '__storage_test__';
    sessionStorage.setItem(testKey, testKey);
    sessionStorage.removeItem(testKey);
    return true;
  } catch (e) {
    return false;
  }
};

export const setSessionStorageItem = <T>(key: string, value: T): void => {
  if (!sessionStorageAvailable()) return;
  try {
    sessionStorage.setItem(key, JSON.stringify(value));
  } catch (error) {
    console.error('Error saving to sessionStorage:', error);
  }
};

export const getSessionStorageItem = <T>(key: string, defaultValue: T): T => {
  if (!sessionStorageAvailable()) return defaultValue;
  try {
    const item = sessionStorage.getItem(key);
    return item ? JSON.parse(item) : defaultValue;
  } catch (error) {
    console.error('Error reading from sessionStorage:', error);
    return defaultValue;
  }
};

export const removeSessionStorageItem = (key: string): void => {
  if (!sessionStorageAvailable()) return;
  try {
    sessionStorage.removeItem(key);
  } catch (error) {
    console.error('Error removing from sessionStorage:', error);
  }
};

export const clearSessionStorage = (): void => {
  if (!sessionStorageAvailable()) return;
  try {
    sessionStorage.clear();
  } catch (error) {
    console.error('Error clearing sessionStorage:', error);
  }
};

// Cookie utilities
export const setCookie = (name: string, value: string, days: number = 7): void => {
  try {
    const expires = new Date();
    expires.setTime(expires.getTime() + days * 24 * 60 * 60 * 1000);
    document.cookie = `${name}=${encodeURIComponent(value)};expires=${expires.toUTCString()};path=/;SameSite=Strict`;
  } catch (error) {
    console.error('Error setting cookie:', error);
  }
};

export const getCookie = (name: string): string | null => {
  try {
    const nameEQ = `${name}=`;
    const ca = document.cookie.split(';');
    for (let i = 0; i < ca.length; i++) {
      let c = ca[i];
      while (c.charAt(0) === ' ') c = c.substring(1, c.length);
      if (c.indexOf(nameEQ) === 0) return decodeURIComponent(c.substring(nameEQ.length, c.length));
    }
    return null;
  } catch (error) {
    console.error('Error getting cookie:', error);
    return null;
  }
};

export const removeCookie = (name: string): void => {
  try {
    document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/;SameSite=Strict`;
  } catch (error) {
    console.error('Error removing cookie:', error);
  }
};

// Offline storage wrapper
export interface StorageOptions {
  storage?: 'local' | 'session' | 'cookie';
  expires?: number; // days for cookies
}

export const setItem = <T>(key: string, value: T, options: StorageOptions = {}): void => {
  const { storage = 'local', expires = 7 } = options;
  
  switch (storage) {
    case 'session':
      setSessionStorageItem(key, value);
      break;
    case 'cookie':
      setCookie(key, JSON.stringify(value), expires);
      break;
    case 'local':
    default:
      setLocalStorageItem(key, value);
      break;
  }
};

export const getItem = <T>(key: string, defaultValue: T, options: StorageOptions = {}): T => {
  const { storage = 'local' } = options;
  
  switch (storage) {
    case 'session':
      return getSessionStorageItem(key, defaultValue);
    case 'cookie': {
      const cookieValue = getCookie(key);
      if (!cookieValue) return defaultValue;
      try {
        return JSON.parse(cookieValue) as T;
      } catch {
        return defaultValue;
      }
    }
    case 'local':
    default:
      return getLocalStorageItem(key, defaultValue);
  }
};

export const removeItem = (key: string, options: StorageOptions = {}): void => {
  const { storage = 'local' } = options;
  
  switch (storage) {
    case 'session':
      removeSessionStorageItem(key);
      break;
    case 'cookie':
      removeCookie(key);
      break;
    case 'local':
    default:
      removeLocalStorageItem(key);
      break;
  }
};
