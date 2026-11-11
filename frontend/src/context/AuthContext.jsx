import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import * as authApi from '../api/authApi';
import { onSessionExpired, tokenStorage } from '../api/client';
import { useToast } from './ToastContext';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const toast = useToast();
  const [user, setUser] = useState(null);
  const [isBootstrapping, setIsBootstrapping] = useState(Boolean(tokenStorage.get()));

  const clearSession = useCallback(() => {
    tokenStorage.clear();
    setUser(null);
  }, []);

  useEffect(() => {
    onSessionExpired(() => {
      if (!tokenStorage.get()) return;
      clearSession();
      toast.info('Your session has expired. Please log in again.');
    });
  }, [clearSession, toast]);

  useEffect(() => {
    if (!tokenStorage.get()) return;
    authApi
      .fetchCurrentUser()
      .then((data) => setUser(data.user))
      .catch(() => tokenStorage.clear())
      .finally(() => setIsBootstrapping(false));
  }, []);

  const startSession = useCallback(({ user: nextUser, token }) => {
    tokenStorage.set(token);
    setUser(nextUser);
  }, []);

  const login = useCallback(async (credentials) => startSession(await authApi.loginUser(credentials)), [startSession]);
  const register = useCallback(async (details) => startSession(await authApi.registerUser(details)), [startSession]);

  const logout = useCallback(() => {
    clearSession();
    toast.success('You have been logged out.');
  }, [clearSession, toast]);

  const value = useMemo(
    () => ({ user, isBootstrapping, login, register, logout }),
    [user, isBootstrapping, login, register, logout]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export const useAuth = () => useContext(AuthContext);
