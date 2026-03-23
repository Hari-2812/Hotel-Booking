import { useCallback, useEffect, useMemo, useState } from 'react';
import toast from 'react-hot-toast';
import { api, setAuthToken } from '../services/api';
import { AuthContext } from './auth-context';

export function AuthProvider({ children }) {
  const [token, setToken] = useState(() => localStorage.getItem('token'));
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setAuthToken(token);
  }, [token]);

  useEffect(() => {
    async function loadMe() {
      if (!token) {
        setUser(null);
        setLoading(false);
        return;
      }

      try {
        const response = await api.get('/api/users/me');
        setUser(response.data.user);
      } catch {
        localStorage.removeItem('token');
        setToken(null);
        setUser(null);
      } finally {
        setLoading(false);
      }
    }

    loadMe();
  }, [token]);

  const persistAuth = useCallback((authToken, authUser) => {
    localStorage.setItem('token', authToken);
    setToken(authToken);
    setUser(authUser);
  }, []);

  const login = useCallback(async ({ email, password }) => {
    const response = await api.post('/api/auth/login', { email, password });
    persistAuth(response.data.token, response.data.user);
    toast.success('Welcome back!');
  }, [persistAuth]);

  const loginWithGoogle = useCallback(async (idToken) => {
    const response = await api.post('/api/auth/google', { idToken });
    persistAuth(response.data.token, response.data.user);
    toast.success('Signed in with Google');
  }, [persistAuth]);

  const register = useCallback(async ({ name, email, password }) => {
    const response = await api.post('/api/auth/register', { name, email, password });
    persistAuth(response.data.token, response.data.user);
    toast.success('Account created successfully');
  }, [persistAuth]);

  const logout = useCallback(() => {
    localStorage.removeItem('token');
    setToken(null);
    setUser(null);
    toast.success('Logged out successfully');
  }, []);

  const value = useMemo(
    () => ({ token, user, loading, login, loginWithGoogle, logout, register, setUser }),
    [loading, login, loginWithGoogle, logout, register, token, user]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
