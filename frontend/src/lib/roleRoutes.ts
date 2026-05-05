import type { UserRole } from '../context/AuthContext';

export const getDefaultRouteForRole = (role?: UserRole | null): string => {
  switch (role) {
    case 'admin':
      return '/admin';
    case 'seller':
      return '/seller/dashboard';
    case 'mechanic':
      return '/mechanic/dashboard';
    case 'delivery_agent':
      return '/delivery/dashboard';
    case 'buyer':
    default:
      return '/login';
  }
};
