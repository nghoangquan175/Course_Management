import React, { createContext, useState, useEffect, type ReactNode } from 'react';
import { authService } from '../api/authService';

interface AuthContextType {
  user: any;
  accessToken: string | null;
  isInitializing: boolean;
  login: (user: any, token: string) => void;
  logout: () => void;
  setAccessToken: (token: string) => void;
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<any>(null);
  const [accessToken, setAccessTokenState] = useState<string | null>(
    localStorage.getItem('accessToken')
  );
  const [isInitializing, setIsInitializing] = useState(true);

  useEffect(() => {
    const silentRefresh = async () => {
      try {
        // Try to get a new access token using the refresh token cookie
        const response = await authService.refresh();
        const newToken = response.data.accessToken;
        setAccessTokenState(newToken);
        localStorage.setItem('accessToken', newToken);

        // Fetch user profile if token is valid
        const userRes = await authService.getProfile();
        setUser(userRes.data);
      } catch (error) {
        console.log('No valid session found');
        // If refresh fails, clear everything
        localStorage.removeItem('accessToken');
        setAccessTokenState(null);
        setUser(null);
      } finally {
        setIsInitializing(false);
      }
    };

    silentRefresh();
  }, []);

  useEffect(() => {
    const handleUnauthorized = () => {
      setUser(null);
      setAccessTokenState(null);
      localStorage.removeItem('accessToken');
    };

    window.addEventListener('auth:unauthorized', handleUnauthorized);
    return () => window.removeEventListener('auth:unauthorized', handleUnauthorized);
  }, []);

  const login = (userData: any, token: string) => {
    setUser(userData);
    setAccessTokenState(token);
    localStorage.setItem('accessToken', token);
  };

  const logout = async () => {
    try {
      await authService.logout();
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      setUser(null);
      setAccessTokenState(null);
      localStorage.removeItem('accessToken');
    }
  };

  const setAccessToken = (token: string) => {
    setAccessTokenState(token);
    localStorage.setItem('accessToken', token);
  };

  return (
    <AuthContext.Provider
      value={{ user, accessToken, isInitializing, login, logout, setAccessToken }}
    >
      {children}
    </AuthContext.Provider>
  );
};
