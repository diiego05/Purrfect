import React, { createContext, useContext, useState, useEffect } from 'react';
import type { User } from '../types/auth';
import {
  authApi,
  setTokens,
  clearTokens,
  getAccessToken,
} from '../services/authApi';

interface AuthContextType {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  currentPath: string;
  navigate: (path: string) => void;
  loginSuccess: (
    accessToken: string,
    refreshToken: string | undefined,
    user: User,
  ) => void;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(() => getAccessToken());
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [currentPath, setCurrentPath] = useState<string>(
    () => window.location.pathname,
  );

  // Sync navigation with browser URL
  const navigate = (path: string) => {
    if (window.location.pathname !== path) {
      window.history.pushState({}, '', path);
    }
    setCurrentPath(path);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  useEffect(() => {
    const handlePopState = () => {
      setCurrentPath(window.location.pathname);
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  // Check initial token and handle Google OAuth redirect params
  useEffect(() => {
    const initAuth = async () => {
      const params = new URLSearchParams(window.location.search);
      const urlToken = params.get('token');
      const urlRefreshToken = params.get('refreshToken');

      if (urlToken) {
        setTokens(urlToken, urlRefreshToken || undefined);
        setToken(urlToken);
        // Clean URL params and navigate to home
        window.history.replaceState({}, document.title, '/');
        setCurrentPath('/');
      }

      const activeToken = urlToken || getAccessToken();
      if (activeToken) {
        try {
          const res = await authApi.getMe();
          if (res.success && res.user) {
            setUser(res.user);
          } else {
            clearTokens();
            setToken(null);
            setUser(null);
          }
        } catch (err) {
          console.error('Failed to authenticate token:', err);
        }
      }
      setIsLoading(false);
    };

    initAuth();
  }, []);

  const loginSuccess = (
    accessToken: string,
    refreshToken: string | undefined,
    newUser: User,
  ) => {
    setTokens(accessToken, refreshToken);
    setToken(accessToken);
    setUser(newUser);
    navigate('/');
  };

  const logout = async () => {
    try {
      await authApi.logout();
    } catch (e) {
      console.warn('Logout api error:', e);
    } finally {
      clearTokens();
      setToken(null);
      setUser(null);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isAuthenticated: !!user,
        isLoading,
        currentPath,
        navigate,
        loginSuccess,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

// eslint-disable-next-line react-refresh/only-export-components
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
