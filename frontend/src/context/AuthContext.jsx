import { createContext, useContext, useState, useEffect } from 'react';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [token, setToken]               = useState(() => localStorage.getItem('token'));
  const [role, setRole]                 = useState(() => localStorage.getItem('role'));
  const [user, setUser]                 = useState(() => {
    try { return JSON.parse(localStorage.getItem('user')); } catch { return null; }
  });
  const [loading, setLoading]           = useState(false);

  const isAuthenticated = !!token && !!role;

  function login(newToken, newRole, newUser) {
    localStorage.setItem('token', newToken);
    localStorage.setItem('role', newRole);
    localStorage.setItem('user', JSON.stringify(newUser));
    setToken(newToken);
    setRole(newRole);
    setUser(newUser);
  }

  function logout() {
    localStorage.removeItem('token');
    localStorage.removeItem('role');
    localStorage.removeItem('user');
    setToken(null);
    setRole(null);
    setUser(null);
  }

  function updateUser(updated) {
    const merged = { ...user, ...updated };
    localStorage.setItem('user', JSON.stringify(merged));
    setUser(merged);
  }

  return (
    <AuthContext.Provider value={{ token, role, user, isAuthenticated, loading, login, logout, updateUser, setUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
  return ctx;
}
