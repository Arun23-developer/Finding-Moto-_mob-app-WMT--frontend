import React, { createContext, useState, useContext, useEffect } from 'react';
import api from '../services/api';

export type UserRole = 'buyer' | 'seller' | 'mechanic' | 'admin' | 'delivery_agent';
export type ApprovalStatus = 'pending' | 'approved' | 'rejected';
//       "approvalStatus": "pending", // or "approved", "rejected"

interface User {
  _id: string;
  email: string;
  firstName: string;
  lastName: string;
  fullName: string;
  phone?: string;
  address?: string;
  avatar?: string;
  role: UserRole;
  approvalStatus: ApprovalStatus;
  isActive: boolean;
  // Seller fields
  shopName?: string;
  shopDescription?: string;
  shopLocation?: string;
  sellerSpecializations?: string[];
  sellerBrands?: string[];
  // Mechanic fields
  specialization?: string;
  experienceYears?: number;
  workshopLocation?: string;
  workshopName?: string;
  servicesOffered?: string[];
  mechanicBrands?: string[];
  // Delivery agent fields
  vehicleType?: string;
  vehicleNumber?: string;
  licenseNumber?: string;
  payoutMethod?: string;
  payoutAccountName?: string;
}

interface LoginCredentials {
  email: string;
  password: string;
}

interface RegisterData {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  phone?: string;
  role: UserRole;
  // Seller fields
  shopName?: string;
  shopDescription?: string;
  shopLocation?: string;
  // Mechanic fields
  specialization?: string;
  experienceYears?: number;
  workshopLocation?: string;
  workshopName?: string;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (credentials: LoginCredentials & { role?: string }) => Promise<any>;
  loginWithRole: (email: string, password: string, role: string) => Promise<any>;
  register: (userData: RegisterData) => Promise<any>;
  googleAuth: (credential: string) => Promise<any>;
  verifyOTP: (email: string, otp: string, role?: string) => Promise<any>;
  resendOTP: (email: string, role?: string) => Promise<any>;
  logout: () => void;
  updateProfile: (data: Partial<User>) => Promise<any>;
  uploadAvatar: (file: File) => Promise<any>;
  changePassword: (currentPassword: string, newPassword: string) => Promise<any>;
  addRole: (data: any) => Promise<any>;
  getMyRoles: () => Promise<any>;
  isBuyer: boolean;
  isSeller: boolean;
  isMechanic: boolean;
  isAdmin: boolean;
  isDeliveryAgent: boolean;
}

const AuthContext = createContext<AuthContextType | null>(null);

interface AuthProviderProps {
  children: React.ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkAuth();
  }, []);

  const refreshUser = async () => {
    const response = await api.get('/auth/me');
    setUser(response.data);
    return response.data;
  };

  const checkAuth = async () => {
    const token = localStorage.getItem('token');
    if (token) {
      try {
        await refreshUser();
      } catch (error) {
        localStorage.removeItem('token');
      }
    }
    setLoading(false);
  };

  const login = async (credentials: LoginCredentials & { role?: string }) => {
    const response = await api.post('/auth/login', credentials);
    // If role selection is needed, don't set token
    if (response.data.requiresRoleSelection) {
      return response.data;
    }
    localStorage.setItem('token', response.data.token);
    setUser(response.data.user);
    return response.data;
  };

  const loginWithRole = async (email: string, password: string, role: string) => {
    const response = await api.post('/auth/login', { email, password, role });
    localStorage.setItem('token', response.data.token);
    setUser(response.data.user);
    return response.data;
  };

  const register = async (userData: RegisterData) => {
    const response = await api.post('/auth/register', userData);
    // OTP flow: no token returned, user needs to verify email first
    return response.data;
  };

  const googleAuth = async (credential: string) => {
    const response = await api.post('/auth/google', { credential });
    localStorage.setItem('token', response.data.token);
    setUser(response.data.user);
    return response.data;
  };

  const verifyOTP = async (email: string, otp: string, role?: string) => {
    const response = await api.post('/auth/verify-otp', { email, otp, role });
    // If token is returned (buyer auto-approved), set auth state
    if (response.data.token) {
      localStorage.setItem('token', response.data.token);
      setUser(response.data.user);
    }
    return response.data;
  };

  const resendOTP = async (email: string, role?: string) => {
    const response = await api.post('/auth/resend-otp', { email, role });
    return response.data;
  };

  const updateProfile = async (data: Partial<User>) => {
    const response = await api.put('/auth/profile', data);
    await refreshUser();
    return response.data;
  };

  const uploadAvatar = async (file: File) => {
    const fd = new FormData();
    fd.append('image', file);
    const response = await api.post('/auth/upload-avatar', fd, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    await refreshUser();
    return response.data;
  };

  const changePassword = async (currentPassword: string, newPassword: string) => {
    const response = await api.put('/auth/change-password', { currentPassword, newPassword });
    return response.data;
  };

  const addRole = async (data: any) => {
    const response = await api.post('/auth/add-role', data);
    return response.data;
  };

  const getMyRoles = async () => {
    const response = await api.get('/auth/my-roles');
    return response.data;
  };

  const logout = () => {
    localStorage.removeItem('token');
    setUser(null);
  };

  const value: AuthContextType = {
    user,
    loading,
    login,
    loginWithRole,
    register,
    googleAuth,
    verifyOTP,
    resendOTP,
    logout,
    updateProfile,
    uploadAvatar,
    changePassword,
    addRole,
    getMyRoles,
    isBuyer: user?.role === 'buyer',
    isSeller: user?.role === 'seller',
    isMechanic: user?.role === 'mechanic',
    isAdmin: user?.role === 'admin',
    isDeliveryAgent: user?.role === 'delivery_agent'
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
