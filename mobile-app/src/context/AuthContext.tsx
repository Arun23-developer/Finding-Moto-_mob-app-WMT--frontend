import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import api from '../services/api';

type UserRole = 'buyer' | 'seller' | 'mechanic' | 'admin' | 'delivery_agent';

interface User {
  _id: string;
  email: string;
  firstName: string;
  lastName: string;
  fullName?: string;
  phone?: string;
  address?: string;
  role: UserRole;
}

interface AuthContextValue {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (data: RegisterInput) => Promise<any>;
  verifyOTP: (email: string, otp: string) => Promise<any>;
  resendOTP: (email: string) => Promise<any>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

interface RegisterInput {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  phone?: string;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  const refreshUser = async () => {
    const { data } = await api.get('/auth/me');
    setUser(data);
  };

  useEffect(() => {
    const restoreSession = async () => {
      const token = await AsyncStorage.getItem('token');

      if (token) {
        try {
          await refreshUser();
        } catch {
          await AsyncStorage.removeItem('token');
        }
      }

      setLoading(false);
    };

    void restoreSession();
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      loading,
      refreshUser,
      login: async (email, password) => {
        const { data } = await api.post('/auth/login', { email, password, role: 'buyer' });

        if (data.user?.role !== 'buyer') {
          throw new Error('Only buyers can use the mobile app. Use the web app for management roles.');
        }

        await AsyncStorage.setItem('token', data.token);
        setUser(data.user);
      },
      register: async (formData) => {
        const { data } = await api.post('/auth/register', {
          ...formData,
          email: formData.email.trim().toLowerCase(),
          phone: formData.phone?.replace(/\D/g, ''),
          role: 'buyer',
        });

        if (data.token && data.user?.role === 'buyer') {
          await AsyncStorage.setItem('token', data.token);
          setUser(data.user);
        }

        return data;
      },
      verifyOTP: async (email, otp) => {
        const { data } = await api.post('/auth/verify-otp', { email, otp, role: 'buyer' });

        if (data.token && data.user?.role === 'buyer') {
          await AsyncStorage.setItem('token', data.token);
          setUser(data.user);
        }

        return data;
      },
      resendOTP: async (email) => {
        const { data } = await api.post('/auth/resend-otp', { email, role: 'buyer' });
        return data;
      },
      logout: async () => {
        await AsyncStorage.removeItem('token');
        setUser(null);
      },
    }),
    [user, loading]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }

  return context;
}
