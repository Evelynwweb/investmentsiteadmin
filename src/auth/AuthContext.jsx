import { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import { api, getToken, setToken } from '../lib/api.js';

/* ============================================================
   Admin session. Rehydrates from GET /api/auth/me and refuses any
   account that isn't role: 'admin' — a client token must never
   light up the admin shell even if it's pasted into localStorage.
   ============================================================ */
const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [admin, setAdmin] = useState(null);
  const [booting, setBooting] = useState(() => !!getToken());

  useEffect(() => {
    if (!getToken()) return;
    api.get('/api/auth/me')
      .then((u) => {
        if (u.role === 'admin') setAdmin(u);
        else setToken(null);
      })
      .catch(() => setToken(null))
      .finally(() => setBooting(false));
  }, []);

  const login = useCallback(async (email, password) => {
    const { user, token } = await api.post('/api/auth/login', { email, password });
    if (user.role !== 'admin') {
      throw new Error('That account does not have admin access.');
    }
    setToken(token);
    setAdmin(user);
    return user;
  }, []);

  const logout = useCallback(() => {
    setToken(null);
    setAdmin(null);
  }, []);

  const value = useMemo(() => ({ admin, booting, login, logout }), [admin, booting, login, logout]);
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export const useAuth = () => useContext(AuthContext);
