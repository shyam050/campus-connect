import { Navigate, useLocation } from 'react-router-dom';
import type { ReactNode } from 'react';
import { useAuth } from '../context/AuthContext';
import { Spinner } from './ui';
import type { UserRole } from '../types';

/** Gate for authenticated + role-scoped routes. */
export function RequireRole({ roles, children }: { roles?: UserRole[]; children: ReactNode }) {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) return <div className="grid min-h-screen place-items-center"><Spinner label="Loading CampusConnect…" /></div>;

  if (!user) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  }

  if (roles && !roles.includes(user.role)) {
    return <Navigate to="/unauthorized" replace />;
  }

  return <>{children}</>;
}

/** Send authenticated users to their role's home. */
export function roleHome(role: UserRole): string {
  return role === 'student' ? '/student' : role === 'coordinator' ? '/coordinator' : '/admin';
}
