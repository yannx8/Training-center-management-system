// FILE: src/context/AuthContext.jsx
import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import axiosInstance from '../api/axiosInstance';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser]     = useState(null);
  const [role, setRole]     = useState(null);
  const [token, setToken]   = useState(() => localStorage.getItem('tcms_token'));
  const [loading, setLoading] = useState(true);

  // Restore session from localStorage on mount
  useEffect(() => {
    const savedToken = localStorage.getItem('tcms_token');
    const savedRole  = localStorage.getItem('tcms_role');
    const savedUser  = localStorage.getItem('tcms_user');

    if (savedToken && savedRole && savedUser) {
      setToken(savedToken);
      setRole(savedRole);
      setUser(JSON.parse(savedUser));
    }
    setLoading(false);
  }, []);

  const login = useCallback((tokenValue, roleValue, userData) => {
    localStorage.setItem('tcms_token', tokenValue);
    localStorage.setItem('tcms_role',  roleValue);
    localStorage.setItem('tcms_user',  JSON.stringify(userData));
    setToken(tokenValue);
    setRole(roleValue);
    setUser(userData);
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem('tcms_token');
    localStorage.removeItem('tcms_role');
    localStorage.removeItem('tcms_user');
    setToken(null);
    setRole(null);
    setUser(null);
  }, []);

  const value = { user, role, token, loading, login, logout, isAuthenticated: !!token };
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
  return ctx;
}
