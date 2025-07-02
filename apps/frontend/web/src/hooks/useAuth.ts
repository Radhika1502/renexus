import { useState, useEffect, useCallback, createContext, useContext, ReactNode } from 'react';
import axios from 'axios';

// Define types
interface User {
  id: string;
  email: string;
  name: string;
  role: string;
  organizationId: string;
  preferences?: Record<string, any>;
}

interface AuthState {
  user: User | null;
  token: string | null;
  refreshToken: string | null;
  isLoading: boolean;
  error: string | null;
}

interface AuthContextType extends AuthState {
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, name: string, organizationName: string) => Promise<void>;
  logout: () => Promise<void>;
  updateUser: (userData: Partial<User>) => Promise<void>;
  changePassword: (currentPassword: string, newPassword: string) => Promise<void>;
  forgotPassword: (email: string) => Promise<void>;
  resetPassword: (token: string, newPassword: string) => Promise<void>;
  clearError: () => void;
}

// Create auth context
const AuthContext = createContext<AuthContextType | undefined>(undefined);

// API client
const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api',
});

// Add token to requests
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Handle token refresh on 401 errors
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      
      try {
        const refreshToken = localStorage.getItem('refreshToken');
        if (!refreshToken) {
          throw new Error('No refresh token available');
        }
        
        const response = await axios.post(
          `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api'}/auth/refresh-token`,
          { refreshToken }
        );
        
        const { token, refreshToken: newRefreshToken } = response.data;
        
        localStorage.setItem('token', token);
        localStorage.setItem('refreshToken', newRefreshToken);
        
        originalRequest.headers.Authorization = `Bearer ${token}`;
        return axios(originalRequest);
      } catch (refreshError) {
        // If refresh fails, log the user out
        localStorage.removeItem('token');
        localStorage.removeItem('refreshToken');
        localStorage.removeItem('user');
        window.location.href = '/login';
        return Promise.reject(refreshError);
      }
    }
    
    return Promise.reject(error);
  }
);

// Auth provider component
export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [state, setState] = useState<AuthState>({
    user: null,
    token: null,
    refreshToken: null,
    isLoading: true,
    error: null,
  });
  
  // Initialize auth state from localStorage
  useEffect(() => {
    const initializeAuth = async () => {
      try {
        const token = localStorage.getItem('token');
        const refreshToken = localStorage.getItem('refreshToken');
        const userJson = localStorage.getItem('user');
        
        if (token && refreshToken && userJson) {
          const user = JSON.parse(userJson);
          setState({
            user,
            token,
            refreshToken,
            isLoading: false,
            error: null,
          });
          
          // Verify token is still valid
          try {
            await api.get('/auth/me');
          } catch (error) {
            // Token is invalid, try to refresh
            try {
              const response = await api.post('/auth/refresh-token', { refreshToken });
              const { token: newToken, refreshToken: newRefreshToken } = response.data;
              
              localStorage.setItem('token', newToken);
              localStorage.setItem('refreshToken', newRefreshToken);
              
              setState(prev => ({
                ...prev,
                token: newToken,
                refreshToken: newRefreshToken,
              }));
            } catch (refreshError) {
              // Refresh failed, clear auth state
              localStorage.removeItem('token');
              localStorage.removeItem('refreshToken');
              localStorage.removeItem('user');
              
              setState({
                user: null,
                token: null,
                refreshToken: null,
                isLoading: false,
                error: null,
              });
            }
          }
        } else {
          setState(prev => ({ ...prev, isLoading: false }));
        }
      } catch (error) {
        setState({
          user: null,
          token: null,
          refreshToken: null,
          isLoading: false,
          error: 'Failed to initialize authentication',
        });
      }
    };
    
    initializeAuth();
  }, []);
  
  // Login function
  const login = useCallback(async (email: string, password: string) => {
    try {
      setState(prev => ({ ...prev, isLoading: true, error: null }));
      
      const response = await api.post('/auth/login', { email, password });
      const { user, token, refreshToken } = response.data;
      
      localStorage.setItem('token', token);
      localStorage.setItem('refreshToken', refreshToken);
      localStorage.setItem('user', JSON.stringify(user));
      
      setState({
        user,
        token,
        refreshToken,
        isLoading: false,
        error: null,
      });
    } catch (error: any) {
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: error.response?.data?.message || 'Login failed',
      }));
    }
  }, []);
  
  // Register function
  const register = useCallback(async (
    email: string,
    password: string,
    name: string,
    organizationName: string
  ) => {
    try {
      setState(prev => ({ ...prev, isLoading: true, error: null }));
      
      const response = await api.post('/auth/register', {
        email,
        password,
        name,
        organizationName,
      });
      
      const { user, token, refreshToken } = response.data;
      
      localStorage.setItem('token', token);
      localStorage.setItem('refreshToken', refreshToken);
      localStorage.setItem('user', JSON.stringify(user));
      
      setState({
        user,
        token,
        refreshToken,
        isLoading: false,
        error: null,
      });
    } catch (error: any) {
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: error.response?.data?.message || 'Registration failed',
      }));
    }
  }, []);
  
  // Logout function
  const logout = useCallback(async () => {
    try {
      setState(prev => ({ ...prev, isLoading: true }));
      
      if (state.refreshToken) {
        await api.post('/auth/logout', { refreshToken: state.refreshToken });
      }
      
      localStorage.removeItem('token');
      localStorage.removeItem('refreshToken');
      localStorage.removeItem('user');
      
      setState({
        user: null,
        token: null,
        refreshToken: null,
        isLoading: false,
        error: null,
      });
    } catch (error) {
      // Even if the API call fails, we still want to clear local state
      localStorage.removeItem('token');
      localStorage.removeItem('refreshToken');
      localStorage.removeItem('user');
      
      setState({
        user: null,
        token: null,
        refreshToken: null,
        isLoading: false,
        error: null,
      });
    }
  }, [state.refreshToken]);
  
  // Update user function
  const updateUser = useCallback(async (userData: Partial<User>) => {
    try {
      setState(prev => ({ ...prev, isLoading: true, error: null }));
      
      if (!state.user) {
        throw new Error('No user logged in');
      }
      
      const response = await api.put(`/users/${state.user.id}`, userData);
      const updatedUser = response.data;
      
      localStorage.setItem('user', JSON.stringify(updatedUser));
      
      setState(prev => ({
        ...prev,
        user: updatedUser,
        isLoading: false,
      }));
    } catch (error: any) {
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: error.response?.data?.message || 'Failed to update user',
      }));
    }
  }, [state.user]);
  
  // Change password function
  const changePassword = useCallback(async (currentPassword: string, newPassword: string) => {
    try {
      setState(prev => ({ ...prev, isLoading: true, error: null }));
      
      if (!state.user) {
        throw new Error('No user logged in');
      }
      
      await api.put(`/users/${state.user.id}/password`, {
        currentPassword,
        newPassword,
      });
      
      setState(prev => ({
        ...prev,
        isLoading: false,
      }));
    } catch (error: any) {
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: error.response?.data?.message || 'Failed to change password',
      }));
    }
  }, [state.user]);
  
  // Forgot password function
  const forgotPassword = useCallback(async (email: string) => {
    try {
      setState(prev => ({ ...prev, isLoading: true, error: null }));
      
      await api.post('/auth/forgot-password', { email });
      
      setState(prev => ({
        ...prev,
        isLoading: false,
      }));
    } catch (error: any) {
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: error.response?.data?.message || 'Failed to process forgot password request',
      }));
    }
  }, []);
  
  // Reset password function
  const resetPassword = useCallback(async (token: string, newPassword: string) => {
    try {
      setState(prev => ({ ...prev, isLoading: true, error: null }));
      
      await api.post('/auth/reset-password', { token, newPassword });
      
      setState(prev => ({
        ...prev,
        isLoading: false,
      }));
    } catch (error: any) {
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: error.response?.data?.message || 'Failed to reset password',
      }));
    }
  }, []);
  
  // Clear error function
  const clearError = useCallback(() => {
    setState(prev => ({ ...prev, error: null }));
  }, []);
  
  return (
    <AuthContext.Provider
      value={{
        ...state,
        login,
        register,
        logout,
        updateUser,
        changePassword,
        forgotPassword,
        resetPassword,
        clearError,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

// Hook to use auth context
export const useAuth = () => {
  const context = useContext(AuthContext);
  
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  
  return context;
};

export default useAuth;
