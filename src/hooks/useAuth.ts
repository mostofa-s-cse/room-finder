'use client';

import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { UserRole } from '@prisma/client';

export function useAuth(requiredRole?: UserRole | UserRole[]) {
  const { data: session, status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (status === 'loading') return; // Still loading

    if (!session) {
      router.push('/auth/signin');
      return;
    }

    if (requiredRole) {
      const allowedRoles = Array.isArray(requiredRole) ? requiredRole : [requiredRole];
      if (!allowedRoles.includes(session.user.role)) {
        router.push('/unauthorized');
        return;
      }
    }
  }, [session, status, router, requiredRole]);

  return {
    user: session?.user,
    isLoading: status === 'loading',
    isAuthenticated: !!session,
  };
}

export function useRequireAuth(requiredRole?: UserRole | UserRole[]) {
  const { user, isLoading, isAuthenticated } = useAuth(requiredRole);

  if (isLoading) {
    return { user: null, isLoading: true, isAuthenticated: false };
  }

  if (!isAuthenticated || !user) {
    return { user: null, isLoading: false, isAuthenticated: false };
  }

  return { user, isLoading: false, isAuthenticated: true };
}

export function useBachelorAuth() {
  return useRequireAuth('BACHELOR');
}

export function useLandlordAuth() {
  return useRequireAuth('LANDLORD');
}

export function useAdminAuth() {
  return useRequireAuth('ADMIN');
}

export function useAnyAuth() {
  return useRequireAuth(['BACHELOR', 'LANDLORD', 'ADMIN']);
}