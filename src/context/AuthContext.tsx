import React, { createContext, useContext, useState, useEffect } from 'react';
import { User } from '../types';
import { api } from '../services/api';

interface AuthContextType {
  user: User | null;
  token: string | null;
  mustChangePassword: boolean;
  isLoading: boolean;
  login: (email: string, pass: string, role_target?: string) => Promise<User>;
  logout: () => void;
  setMustChangePassword: (val: boolean) => void;
  updateUser: (updatedUser: Partial<User>) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(localStorage.getItem('medifaces_token'));
  const [mustChangePassword, setMustChangePassword] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    const savedUser = localStorage.getItem('medifaces_user');
    if (savedUser && token) {
      try {
        const parsed = JSON.parse(savedUser);
        setUser(parsed);
        if (parsed.must_change_password) {
          setMustChangePassword(true);
        }
      } catch (e) {
        localStorage.removeItem('medifaces_user');
        localStorage.removeItem('medifaces_token');
      }
    }
    setIsLoading(false);
  }, [token]);

  const clearSessionStorage = () => {
    localStorage.removeItem('medifaces_token');
    localStorage.removeItem('medifaces_user');
    localStorage.removeItem('medifaces_current_user_id');
    try {
      sessionStorage.clear();
    } catch {}
  };

  const login = async (email: string, pass: string, role_target?: string): Promise<User> => {
    setIsLoading(true);
    // Bersihkan sesi lama sebelum memuat akun baru
    clearSessionStorage();
    setUser(null);
    setToken(null);
    setMustChangePassword(false);

    try {
      const res = await api.login(email, pass, role_target);
      localStorage.setItem('medifaces_token', res.token);
      localStorage.setItem('medifaces_user', JSON.stringify(res.user));
      localStorage.setItem('medifaces_current_user_id', String(res.user.id));
      setUser(res.user);
      setToken(res.token);
      setMustChangePassword(!!res.must_change_password);
      return res.user;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    clearSessionStorage();
    setUser(null);
    setToken(null);
    setMustChangePassword(false);
  };

  const updateUser = (updated: Partial<User>) => {
    setUser(prev => {
      if (!prev) return null;
      const next = { ...prev, ...updated };
      localStorage.setItem('medifaces_user', JSON.stringify(next));
      if (next.id) {
        localStorage.setItem('medifaces_current_user_id', String(next.id));
      }
      return next;
    });
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        mustChangePassword,
        isLoading,
        login,
        logout,
        setMustChangePassword,
        updateUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
};
