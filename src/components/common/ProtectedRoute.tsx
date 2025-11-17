'use client';

import { useAuth } from '@/hooks/useAuth';
import { UserRole } from '@prisma/client';
import { ReactNode } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Loader2 } from 'lucide-react';

interface ProtectedRouteProps {
  children: ReactNode;
  requiredRole?: UserRole | UserRole[];
  fallback?: ReactNode;
}

export function ProtectedRoute({ children, requiredRole, fallback }: ProtectedRouteProps) {
  const { user, isLoading, isAuthenticated } = useAuth(requiredRole);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="flex flex-col items-center justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin mb-4" />
            <p className="text-sm text-muted-foreground">Loading...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!isAuthenticated || !user) {
    if (fallback) {
      return <>{fallback}</>;
    }
    
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="flex flex-col items-center justify-center py-8">
            <p className="text-lg font-medium mb-2">Access Denied</p>
            <p className="text-sm text-muted-foreground text-center">
              You need to be logged in to access this page.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return <>{children}</>;
}

export function RoleGuard({ 
  children, 
  allowedRoles, 
  fallback, 
  userRole 
}: {
  children: ReactNode;
  allowedRoles: UserRole[];
  fallback?: ReactNode;
  userRole: UserRole;
}) {
  const hasAccess = allowedRoles.includes(userRole) || userRole === 'ADMIN';

  if (!hasAccess) {
    if (fallback) {
      return <>{fallback}</>;
    }
    
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="flex flex-col items-center justify-center py-8">
            <p className="text-lg font-medium mb-2">Insufficient Permissions</p>
            <p className="text-sm text-muted-foreground text-center">
              You don&apos;t have permission to access this resource.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return <>{children}</>;
}