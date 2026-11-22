import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useMemo,
  useCallback,
  type ReactNode,
} from 'react';
import { useNavigate } from 'react-router-dom';
import { authApi, normalizeUser } from '../api/authApi';
import {
  onSessionExpired,
  TOKEN_STORAGE_KEY,
  USER_STORAGE_KEY,
} from '../../../shared/api/httpClient';
import type {
  AuthCredentials,
  AuthSession,
  User,
  UserPayload,
} from '../../../shared/types/domain';

export interface AuthContextValue {
  token: string | null;
  currentUser: User | null;
  isAuthenticated: boolean;
  userName: string;
  userRole: string;
  isAdmin: boolean;
  userInitials: string;
  login: (credentials: AuthCredentials) => Promise<AuthSession>;
  loginAdmin: (credentials: AuthCredentials) => Promise<AuthSession>;
  register: (userData: UserPayload) => Promise<User>;
  logout: () => void;
  updateStoredUser: (fresh: Partial<User>) => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const navigate = useNavigate();

  const [token, setToken] = useState<string | null>(() => localStorage.getItem(TOKEN_STORAGE_KEY));
  const [currentUser, setCurrentUser] = useState<User | null>(() => {
    const stored = localStorage.getItem(USER_STORAGE_KEY);
    if (!stored) return null;
    try {
      return normalizeUser(JSON.parse(stored));
    } catch (err) {
      console.warn('[AuthContext] Corrupted stored user removed:', err);
      localStorage.removeItem(USER_STORAGE_KEY);
      return null;
    }
  });

  const isAuthenticated = Boolean(token && currentUser);

  const userName = useMemo(() => {
    if (!currentUser) return 'Usuario';
    return (
      currentUser.fullName ||
      `${currentUser.firstName || ''} ${currentUser.lastName || ''}`.trim() ||
      currentUser.email ||
      'Usuario'
    );
  }, [currentUser]);

  const userRole = useMemo(() => currentUser?.role ?? 'ENCARGADO', [currentUser]);

  const isAdmin = useMemo(() => {
    const role = String(currentUser?.role || '').toUpperCase();
    return role === 'ADMINISTRADOR' || role === 'ADMIN';
  }, [currentUser]);

  const userInitials = useMemo(() => {
    const parts = userName.split(' ').filter((p) => p.length > 0);
    return parts.length >= 2
      ? (parts[0][0] + parts[1][0]).toUpperCase()
      : userName.substring(0, 2).toUpperCase();
  }, [userName]);

  const handleAuthSuccess = useCallback((response: AuthSession) => {
    localStorage.setItem(TOKEN_STORAGE_KEY, response.token);
    localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(response.user));
    setToken(response.token);
    setCurrentUser(response.user);
  }, []);

  const login = useCallback(
    async (credentials: AuthCredentials): Promise<AuthSession> => {
      const response = await authApi.login(credentials);
      handleAuthSuccess(response);
      navigate('/dashboard');
      return response;
    },
    [handleAuthSuccess, navigate]
  );

  const loginAdmin = useCallback(
    async (credentials: AuthCredentials): Promise<AuthSession> => {
      const response = await authApi.loginAdmin(credentials);
      handleAuthSuccess(response);
      navigate('/dashboard');
      return response;
    },
    [handleAuthSuccess, navigate]
  );

  const register = useCallback(async (userData: UserPayload): Promise<User> => {
    return authApi.register(userData);
  }, []);

  const clearSessionState = useCallback(() => {
    localStorage.removeItem(TOKEN_STORAGE_KEY);
    localStorage.removeItem(USER_STORAGE_KEY);
    setToken(null);
    setCurrentUser(null);
  }, []);

  const logout = useCallback(() => {
    clearSessionState();
    navigate('/auth/login');
  }, [clearSessionState, navigate]);

  const updateStoredUser = useCallback((fresh: Partial<User>) => {
    setCurrentUser((prev) => {
      const merged = normalizeUser({ ...(prev ?? {}), ...fresh });
      if (merged) {
        localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(merged));
      }
      return merged;
    });
  }, []);

  useEffect(() => {
    return onSessionExpired(() => {
      clearSessionState();
    });
  }, [clearSessionState]);

  return (
    <AuthContext.Provider
      value={{
        token,
        currentUser,
        isAuthenticated,
        userName,
        userRole,
        isAdmin,
        userInitials,
        login,
        loginAdmin,
        register,
        logout,
        updateStoredUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextValue => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth debe ser utilizado dentro de un AuthProvider');
  }
  return context;
};
