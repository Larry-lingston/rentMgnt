import React, { createContext, useContext, useState, useEffect } from 'react';
import { api } from '../services/api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkAuth();
  }, []);

  async function checkAuth() {
    try {
      await api.init();
      const profile = await api.getProfile();
      setUser(profile);
    } catch {
      setUser(null);
      await api.setToken(null);
    } finally {
      setLoading(false);
    }
  }

  async function login(username, password) {
    const { user: userData, token } = await api.login(username, password);
    await api.setToken(token);
    setUser(userData);
    return userData;
  }

  async function register(data) {
    const { user: userData, token } = await api.register(data);
    await api.setToken(token);
    setUser(userData);
    return userData;
  }

  async function logout() {
    await api.setToken(null);
    setUser(null);
  }

  async function updateProfile(data) {
    const updated = await api.updateProfile(data);
    setUser(updated);
    return updated;
  }

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout, updateProfile }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
}
