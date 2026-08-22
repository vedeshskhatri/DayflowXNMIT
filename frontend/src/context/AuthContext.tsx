import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { api, EmployeeProfile, LoginResponse } from '../lib/api';
import { connectSocket, disconnectSocket } from '../lib/socket';

interface AuthContextType {
  user: EmployeeProfile | null;
  isLoading: boolean;
  login: (identifier: string, password: string) => Promise<{ mustResetPwd: boolean; employee: EmployeeProfile }>;
  logout: () => Promise<void>;
  updateUser: (user: EmployeeProfile) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const USER_STORAGE_KEY = 'dayflow_user_session';

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<EmployeeProfile | null>(() => {
    try {
      const stored = localStorage.getItem(USER_STORAGE_KEY);
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  });
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (user) {
      // Connect socket when user is authenticated
      connectSocket();
    } else {
      disconnectSocket();
    }
  }, [user]);

  const login = async (identifier: string, password: string) => {
    setIsLoading(true);
    try {
      const res = await api.post<LoginResponse>('/auth/login', {
        identifier,
        password,
      });

      const { employee, mustResetPwd } = res.data;
      setUser(employee);
      localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(employee));
      connectSocket();

      return { mustResetPwd, employee };
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    setIsLoading(true);
    try {
      // RULE: Disconnect socket BEFORE calling POST /auth/logout
      disconnectSocket();
      await api.post('/auth/logout');
    } catch (err) {
      console.error('Logout error:', err);
    } finally {
      setUser(null);
      localStorage.removeItem(USER_STORAGE_KEY);
      setIsLoading(false);
    }
  };

  const updateUser = (updatedUser: EmployeeProfile) => {
    setUser(updatedUser);
    localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(updatedUser));
  };

  return (
    <AuthContext.Provider value={{ user, isLoading, login, logout, updateUser }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
