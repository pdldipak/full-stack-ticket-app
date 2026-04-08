import { createContext, useContext, useMemo, useState, useEffect, useCallback } from 'react';
import api from '@src/api/client.js';

const AuthContext = createContext(null);

function readAllowedCities() {
  const raw = localStorage.getItem('allowedCities');
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function readSellerUsernames() {
  const raw = localStorage.getItem('sellerUsernames');
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function readRole() {
  const raw = localStorage.getItem('role');
  if (raw === 'scanner' || raw === 'seller' || raw === 'admin') return raw;
  return 'seller';
}

export function AuthProvider({ children }) {
  const [token, setToken] = useState(() => localStorage.getItem('token'));
  const [username, setUsername] = useState(() => localStorage.getItem('username'));
  const [role, setRole] = useState(readRole);
  const [allowedCities, setAllowedCities] = useState(readAllowedCities);
  const [sellerUsernames, setSellerUsernames] = useState(readSellerUsernames);

  useEffect(() => {
    if (token) localStorage.setItem('token', token);
    else localStorage.removeItem('token');
  }, [token]);

  useEffect(() => {
    if (username) localStorage.setItem('username', username);
    else localStorage.removeItem('username');
  }, [username]);

  useEffect(() => {
    if (role) localStorage.setItem('role', role);
    else localStorage.removeItem('role');
  }, [role]);

  useEffect(() => {
    localStorage.setItem('allowedCities', JSON.stringify(allowedCities));
  }, [allowedCities]);

  useEffect(() => {
    localStorage.setItem('sellerUsernames', JSON.stringify(sellerUsernames));
  }, [sellerUsernames]);

  const login = useCallback(
    (newToken, user, cities, userRole = 'seller', sellersList = null) => {
      setToken(newToken);
      setUsername(user);
      if (userRole === 'scanner') setRole('scanner');
      else if (userRole === 'admin') setRole('admin');
      else setRole('seller');
      setAllowedCities(Array.isArray(cities) ? cities : []);
      setSellerUsernames(Array.isArray(sellersList) ? sellersList : []);
    },
    []
  );

  const logout = useCallback(() => {
    setToken(null);
    setUsername(null);
    setRole('seller');
    setAllowedCities([]);
    setSellerUsernames([]);
    localStorage.removeItem('token');
    localStorage.removeItem('username');
    localStorage.removeItem('role');
    localStorage.removeItem('allowedCities');
    localStorage.removeItem('sellerUsernames');
  }, []);

  useEffect(() => {
    if (!token) return;
    let cancelled = false;
    (async () => {
      try {
        const { data } = await api.get('/auth/me');
        if (cancelled) return;
        if (
          data?.role === 'scanner' ||
          data?.role === 'seller' ||
          data?.role === 'admin'
        ) {
          setRole(data.role);
        }
        if (Array.isArray(data?.allowedCities)) {
          setAllowedCities(data.allowedCities);
        }
        if (Array.isArray(data?.sellerUsernames)) {
          setSellerUsernames(data.sellerUsernames);
        } else if (data?.role !== 'admin') {
          setSellerUsernames([]);
        }
      } catch {
        /* ignore */
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [token]);

  const value = useMemo(
    () => ({
      token,
      username,
      role,
      allowedCities,
      sellerUsernames,
      isAuthenticated: Boolean(token),
      login,
      logout,
    }),
    [token, username, role, allowedCities, sellerUsernames, login, logout]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
