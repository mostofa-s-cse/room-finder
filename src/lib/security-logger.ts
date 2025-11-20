import { NextRequest } from 'next/server';

interface SecurityLogData {
  userId: string;
  userEmail: string;
  userName: string;
  action: string;
  details: string;
  category: 'AUTH' | 'USER_MANAGEMENT' | 'LISTING_MANAGEMENT' | 'SYSTEM' | 'SECURITY';
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  ipAddress?: string;
  userAgent?: string;
  metadata?: Record<string, unknown>;
}

export class SecurityLogger {
  /**
   * Log a security event
   */
  static async logEvent(data: SecurityLogData, request?: NextRequest): Promise<void> {
    try {
      const logEntry = {
        ...data,
        timestamp: new Date().toISOString(),
        ipAddress: data.ipAddress || this.getClientIP(request),
        userAgent: data.userAgent || this.getUserAgent(request),
      };

      // In a real implementation, you would save this to your database
      // For now, we'll just log to console in development
      if (process.env.NODE_ENV === 'development') {
        console.log('Security Event:', JSON.stringify(logEntry, null, 2));
      }

      // TODO: Implement database storage
      // await prisma.securityLog.create({ data: logEntry });
    } catch (error) {
      console.error('Failed to log security event:', error);
    }
  }

  /**
   * Get client IP address from request
   */
  private static getClientIP(request?: NextRequest): string {
    if (!request) return 'unknown';

    const forwarded = request.headers.get('x-forwarded-for');
    const realIP = request.headers.get('x-real-ip');
    
    if (forwarded) {
      return forwarded.split(',')[0].trim();
    }
    
    if (realIP) {
      return realIP;
    }

    // Fallback to a default IP
    return '127.0.0.1';
  }

  /**
   * Get user agent from request
   */
  private static getUserAgent(request?: NextRequest): string {
    if (!request) return 'unknown';
    return request.headers.get('user-agent') || 'unknown';
  }

  // Predefined logging methods for common events
  static async logUserLogin(userId: string, userEmail: string, userName: string, request?: NextRequest) {
    await this.logEvent({
      userId,
      userEmail,
      userName,
      action: 'USER_LOGIN',
      details: 'User successfully logged in',
      category: 'AUTH',
      severity: 'LOW'
    }, request);
  }

  static async logUserLogout(userId: string, userEmail: string, userName: string, request?: NextRequest) {
    await this.logEvent({
      userId,
      userEmail,
      userName,
      action: 'USER_LOGOUT',
      details: 'User logged out',
      category: 'AUTH',
      severity: 'LOW'
    }, request);
  }

  static async logFailedLogin(email: string, reason: string, request?: NextRequest) {
    await this.logEvent({
      userId: 'anonymous',
      userEmail: email,
      userName: 'Unknown',
      action: 'FAILED_LOGIN_ATTEMPT',
      details: `Failed login attempt: ${reason}`,
      category: 'SECURITY',
      severity: 'MEDIUM'
    }, request);
  }

  static async logUserSuspension(adminId: string, adminEmail: string, adminName: string, targetUserId: string, targetUserName: string, request?: NextRequest) {
    await this.logEvent({
      userId: adminId,
      userEmail: adminEmail,
      userName: adminName,
      action: 'USER_SUSPENDED',
      details: `User ${targetUserName} (${targetUserId}) was suspended`,
      category: 'USER_MANAGEMENT',
      severity: 'HIGH'
    }, request);
  }

  static async logUserActivation(adminId: string, adminEmail: string, adminName: string, targetUserId: string, targetUserName: string, request?: NextRequest) {
    await this.logEvent({
      userId: adminId,
      userEmail: adminEmail,
      userName: adminName,
      action: 'USER_ACTIVATED',
      details: `User ${targetUserName} (${targetUserId}) was activated`,
      category: 'USER_MANAGEMENT',
      severity: 'MEDIUM'
    }, request);
  }

  static async logUserBan(adminId: string, adminEmail: string, adminName: string, targetUserId: string, targetUserName: string, request?: NextRequest) {
    await this.logEvent({
      userId: adminId,
      userEmail: adminEmail,
      userName: adminName,
      action: 'USER_BANNED',
      details: `User ${targetUserName} (${targetUserId}) was permanently banned`,
      category: 'USER_MANAGEMENT',
      severity: 'CRITICAL'
    }, request);
  }

  static async logListingAction(adminId: string, adminEmail: string, adminName: string, listingId: string, listingTitle: string, action: 'APPROVED' | 'REJECTED', request?: NextRequest) {
    await this.logEvent({
      userId: adminId,
      userEmail: adminEmail,
      userName: adminName,
      action: `LISTING_${action}`,
      details: `Listing "${listingTitle}" (${listingId}) was ${action.toLowerCase()}`,
      category: 'LISTING_MANAGEMENT',
      severity: 'LOW'
    }, request);
  }

  static async logDataExport(adminId: string, adminEmail: string, adminName: string, exportType: string, recordCount: number, request?: NextRequest) {
    await this.logEvent({
      userId: adminId,
      userEmail: adminEmail,
      userName: adminName,
      action: 'DATA_EXPORT',
      details: `Exported ${recordCount} ${exportType} records to CSV`,
      category: 'USER_MANAGEMENT',
      severity: 'MEDIUM',
      metadata: { exportType, recordCount }
    }, request);
  }

  static async logSecurityBreach(details: string, severity: 'HIGH' | 'CRITICAL', request?: NextRequest) {
    await this.logEvent({
      userId: 'system',
      userEmail: 'system@internal',
      userName: 'System',
      action: 'SECURITY_BREACH_DETECTED',
      details,
      category: 'SECURITY',
      severity
    }, request);
  }

  static async logSystemEvent(action: string, details: string, severity: 'LOW' | 'MEDIUM' = 'LOW', request?: NextRequest) {
    await this.logEvent({
      userId: 'system',
      userEmail: 'system@internal',
      userName: 'System',
      action,
      details,
      category: 'SYSTEM',
      severity
    }, request);
  }
}

// Helper function to get request info in server components
export function getRequestInfo(request: NextRequest) {
  return {
    ipAddress: SecurityLogger['getClientIP'](request),
    userAgent: SecurityLogger['getUserAgent'](request)
  };
}