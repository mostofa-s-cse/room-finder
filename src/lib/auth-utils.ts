import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { UserRole } from '@prisma/client';
import { NextRequest } from 'next/server';

export async function getSession() {
  return await getServerSession(authOptions);
}

export async function getCurrentUser() {
  const session = await getSession();
  return session?.user;
}

export async function requireAuth(allowedRoles?: UserRole | UserRole[]) {
  const session = await getSession();
  
  if (!session || !session.user) {
    throw new Error('Unauthorized');
  }

  if (allowedRoles) {
    const roles = Array.isArray(allowedRoles) ? allowedRoles : [allowedRoles];
    if (!roles.includes(session.user.role)) {
      throw new Error('Forbidden');
    }
  }

  return session.user;
}

export async function requireBachelor() {
  return await requireAuth('BACHELOR');
}

export async function requireLandlord() {
  return await requireAuth('LANDLORD');
}

export async function requireAdmin() {
  return await requireAuth('ADMIN');
}

export async function requireAnyRole() {
  return await requireAuth(['BACHELOR', 'LANDLORD', 'ADMIN']);
}

export function extractTokenFromRequest(request: NextRequest): string | null {
  const authHeader = request.headers.get('authorization');
  if (authHeader && authHeader.startsWith('Bearer ')) {
    return authHeader.substring(7);
  }
  return null;
}

export function hasPermission(userRole: UserRole, requiredRole: UserRole | UserRole[]): boolean {
  if (userRole === 'ADMIN') return true; // Admins have all permissions
  
  const roles = Array.isArray(requiredRole) ? requiredRole : [requiredRole];
  return roles.includes(userRole);
}

export function isOwner(userId: string, resourceOwnerId: string): boolean {
  return userId === resourceOwnerId;
}

export function canAccessResource(
  userRole: UserRole,
  userId: string,
  resourceOwnerId?: string,
  requiredRole?: UserRole | UserRole[]
): boolean {
  // Admins can access everything
  if (userRole === 'ADMIN') return true;
  
  // Check role permission
  if (requiredRole && !hasPermission(userRole, requiredRole)) {
    return false;
  }
  
  // Check ownership if resource owner is specified
  if (resourceOwnerId && !isOwner(userId, resourceOwnerId)) {
    return false;
  }
  
  return true;
}