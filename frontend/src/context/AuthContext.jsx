import React, { createContext, useContext, useState, useEffect } from 'react';
import { api } from '../api/client';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [unreadCount, setUnreadCount] = useState(0);

  // Initialize auth
  useEffect(() => {
    const token = localStorage.getItem('civic_token');
    if (token) {
      api.getMe()
        .then((userData) => {
          setUser(userData);
          fetchUnreadNotifications();
        })
        .catch(() => {
          localStorage.removeItem('civic_token');
          setUser(null);
        })
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, []);

  const fetchUnreadNotifications = async () => {
    try {
      const data = await api.getNotifications();
      setUnreadCount(data.unread_count || 0);
    } catch {
      // ignore if not logged in
    }
  };

  const login = async (username_or_email, password) => {
    const data = await api.login(username_or_email, password);
    localStorage.setItem('civic_token', data.token);
    setUser(data.user);
    fetchUnreadNotifications();
    return data.user;
  };

  const register = async (formData) => {
    const data = await api.register(formData);
    localStorage.setItem('civic_token', data.token);
    setUser(data.user);
    return data.user;
  };

  const logout = () => {
    localStorage.removeItem('civic_token');
    setUser(null);
    setUnreadCount(0);
  };

  // Demo 1-click accounts
  const demoLogin = async (role) => {
    let creds = { username_or_email: 'citizen@example.com', password: 'citizen123' };
    if (role === 'ADMIN') {
      creds = { username_or_email: 'admin@civicpulse.gov', password: 'admin123' };
    } else if (role === 'OFFICIAL') {
      creds = { username_or_email: 'official.pwd@civicpulse.gov', password: 'pwd123' };
    }
    return login(creds.username_or_email, creds.password);
  };

  return (
    <AuthContext.Provider value={{
      user,
      loading,
      unreadCount,
      refreshNotifications: fetchUnreadNotifications,
      login,
      register,
      logout,
      demoLogin,
      isAdmin: user?.role === 'ADMIN',
      isOfficial: user?.role === 'OFFICIAL',
      isCitizen: user?.role === 'CITIZEN',
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
