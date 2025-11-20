import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

interface SecurityLog {
  id: string;
  userId: string;
  userEmail: string;
  userName: string;
  action: string;
  details: string;
  ipAddress: string;
  userAgent: string;
  timestamp: string;
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  category: 'AUTH' | 'USER_MANAGEMENT' | 'LISTING_MANAGEMENT' | 'SYSTEM' | 'SECURITY';
}

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Unauthorized - Admin access required' },
        { status: 401 }
      );
    }

    const url = new URL(request.url);
    const page = parseInt(url.searchParams.get('page') || '1');
    const limit = parseInt(url.searchParams.get('limit') || '25');
    const category = url.searchParams.get('category');
    const severity = url.searchParams.get('severity');
    const userId = url.searchParams.get('userId');
    const sortBy = url.searchParams.get('sortBy') || 'timestamp';
    const sortOrder = url.searchParams.get('sortOrder') || 'desc';

    const skip = (page - 1) * limit;

    // Build where clause for filtering
    const where: Record<string, string> = {};
    if (category) where.category = category;
    if (severity) where.severity = severity;
    if (userId) where.userId = userId;

    // Get security logs from database (if you have a SecurityLog model)
    // For now, we'll generate sample data since the model might not exist yet
    const mockSecurityLogs: SecurityLog[] = [
      {
        id: '1',
        userId: session.user.id || 'admin',
        userEmail: session.user.email || 'admin@example.com',
        userName: session.user.name || 'Admin',
        action: 'USER_LOGIN',
        details: 'Successful admin login',
        ipAddress: '192.168.1.100',
        userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)',
        timestamp: new Date().toISOString(),
        severity: 'LOW',
        category: 'AUTH'
      },
      {
        id: '2',
        userId: session.user.id || 'admin',
        userEmail: session.user.email || 'admin@example.com',
        userName: session.user.name || 'Admin',
        action: 'USER_SUSPENDED',
        details: 'User account suspended for policy violation',
        ipAddress: '192.168.1.100',
        userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)',
        timestamp: new Date(Date.now() - 3600000).toISOString(),
        severity: 'HIGH',
        category: 'USER_MANAGEMENT'
      },
      {
        id: '3',
        userId: session.user.id || 'admin',
        userEmail: session.user.email || 'admin@example.com',
        userName: session.user.name || 'Admin',
        action: 'LISTING_APPROVED',
        details: 'Listing #12345 approved after review',
        ipAddress: '192.168.1.100',
        userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)',
        timestamp: new Date(Date.now() - 7200000).toISOString(),
        severity: 'LOW',
        category: 'LISTING_MANAGEMENT'
      },
      {
        id: '4',
        userId: 'user_123',
        userEmail: 'suspicious@example.com',
        userName: 'Suspicious User',
        action: 'FAILED_LOGIN_ATTEMPT',
        details: 'Multiple failed login attempts detected',
        ipAddress: '10.0.0.1',
        userAgent: 'curl/7.68.0',
        timestamp: new Date(Date.now() - 10800000).toISOString(),
        severity: 'CRITICAL',
        category: 'SECURITY'
      },
      {
        id: '5',
        userId: session.user.id || 'admin',
        userEmail: session.user.email || 'admin@example.com',
        userName: session.user.name || 'Admin',
        action: 'SYSTEM_BACKUP',
        details: 'Daily system backup completed successfully',
        ipAddress: '127.0.0.1',
        userAgent: 'System/1.0',
        timestamp: new Date(Date.now() - 86400000).toISOString(),
        severity: 'LOW',
        category: 'SYSTEM'
      },
      {
        id: '6',
        userId: session.user.id || 'admin',
        userEmail: session.user.email || 'admin@example.com',
        userName: session.user.name || 'Admin',
        action: 'DATA_EXPORT',
        details: 'User data exported to CSV',
        ipAddress: '192.168.1.100',
        userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)',
        timestamp: new Date(Date.now() - 172800000).toISOString(),
        severity: 'MEDIUM',
        category: 'USER_MANAGEMENT'
      },
      // Additional sample logs for better pagination testing
      {
        id: '7',
        userId: 'user_456',
        userEmail: 'john.doe@example.com',
        userName: 'John Doe',
        action: 'USER_REGISTRATION',
        details: 'New user account created',
        ipAddress: '203.0.113.15',
        userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
        timestamp: new Date(Date.now() - 259200000).toISOString(),
        severity: 'LOW',
        category: 'AUTH'
      },
      {
        id: '8',
        userId: session.user.id || 'admin',
        userEmail: session.user.email || 'admin@example.com',
        userName: session.user.name || 'Admin',
        action: 'LISTING_REJECTED',
        details: 'Listing #67890 rejected due to inappropriate content',
        ipAddress: '192.168.1.100',
        userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)',
        timestamp: new Date(Date.now() - 345600000).toISOString(),
        severity: 'MEDIUM',
        category: 'LISTING_MANAGEMENT'
      },
      {
        id: '9',
        userId: 'user_789',
        userEmail: 'malicious@example.com',
        userName: 'Malicious User',
        action: 'SECURITY_BREACH_ATTEMPT',
        details: 'Attempted SQL injection attack blocked',
        ipAddress: '198.51.100.42',
        userAgent: 'Python-requests/2.25.1',
        timestamp: new Date(Date.now() - 432000000).toISOString(),
        severity: 'CRITICAL',
        category: 'SECURITY'
      },
      {
        id: '10',
        userId: session.user.id || 'admin',
        userEmail: session.user.email || 'admin@example.com',
        userName: session.user.name || 'Admin',
        action: 'USER_BANNED',
        details: 'User permanently banned for repeated violations',
        ipAddress: '192.168.1.100',
        userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)',
        timestamp: new Date(Date.now() - 518400000).toISOString(),
        severity: 'CRITICAL',
        category: 'USER_MANAGEMENT'
      },
      {
        id: '11',
        userId: 'user_321',
        userEmail: 'jane.smith@example.com',
        userName: 'Jane Smith',
        action: 'PASSWORD_RESET',
        details: 'User requested password reset',
        ipAddress: '198.51.100.25',
        userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 15_0)',
        timestamp: new Date(Date.now() - 604800000).toISOString(),
        severity: 'LOW',
        category: 'AUTH'
      },
      {
        id: '12',
        userId: session.user.id || 'admin',
        userEmail: session.user.email || 'admin@example.com',
        userName: session.user.name || 'Admin',
        action: 'SYSTEM_MAINTENANCE',
        details: 'Scheduled system maintenance completed',
        ipAddress: '127.0.0.1',
        userAgent: 'System/1.0',
        timestamp: new Date(Date.now() - 691200000).toISOString(),
        severity: 'MEDIUM',
        category: 'SYSTEM'
      },
      {
        id: '13',
        userId: 'user_654',
        userEmail: 'attacker@malicious.com',
        userName: 'Unknown',
        action: 'BRUTE_FORCE_ATTEMPT',
        details: 'Multiple rapid login attempts from same IP',
        ipAddress: '203.0.113.99',
        userAgent: 'automated-script/1.0',
        timestamp: new Date(Date.now() - 777600000).toISOString(),
        severity: 'HIGH',
        category: 'SECURITY'
      },
      {
        id: '14',
        userId: session.user.id || 'admin',
        userEmail: session.user.email || 'admin@example.com',
        userName: session.user.name || 'Admin',
        action: 'BULK_DATA_EXPORT',
        details: 'Exported all user data for compliance audit',
        ipAddress: '192.168.1.100',
        userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)',
        timestamp: new Date(Date.now() - 864000000).toISOString(),
        severity: 'HIGH',
        category: 'USER_MANAGEMENT'
      },
      {
        id: '15',
        userId: 'user_987',
        userEmail: 'bob.wilson@example.com',
        userName: 'Bob Wilson',
        action: 'LISTING_CREATED',
        details: 'New property listing submitted for review',
        ipAddress: '198.51.100.50',
        userAgent: 'Mozilla/5.0 (X11; Linux x86_64)',
        timestamp: new Date(Date.now() - 950400000).toISOString(),
        severity: 'LOW',
        category: 'LISTING_MANAGEMENT'
      }
    ];

    // Apply filters
    let filteredLogs = mockSecurityLogs;
    if (category) {
      filteredLogs = filteredLogs.filter(log => log.category === category);
    }
    if (severity) {
      filteredLogs = filteredLogs.filter(log => log.severity === severity);
    }
    if (userId) {
      filteredLogs = filteredLogs.filter(log => log.userId === userId);
    }

    // Apply sorting
    filteredLogs.sort((a, b) => {
      let aValue: string | number;
      let bValue: string | number;

      switch (sortBy) {
        case 'timestamp':
          aValue = new Date(a.timestamp).getTime();
          bValue = new Date(b.timestamp).getTime();
          break;
        case 'severity':
          const severityOrder = { 'CRITICAL': 4, 'HIGH': 3, 'MEDIUM': 2, 'LOW': 1 };
          aValue = severityOrder[a.severity as keyof typeof severityOrder];
          bValue = severityOrder[b.severity as keyof typeof severityOrder];
          break;
        case 'category':
          aValue = a.category;
          bValue = b.category;
          break;
        case 'action':
          aValue = a.action;
          bValue = b.action;
          break;
        case 'userName':
          aValue = a.userName;
          bValue = b.userName;
          break;
        default:
          aValue = new Date(a.timestamp).getTime();
          bValue = new Date(b.timestamp).getTime();
      }

      if (sortOrder === 'asc') {
        return aValue < bValue ? -1 : aValue > bValue ? 1 : 0;
      } else {
        return aValue > bValue ? -1 : aValue < bValue ? 1 : 0;
      }
    });

    // Apply pagination
    const paginatedLogs = filteredLogs.slice(skip, skip + limit);
    const totalLogs = filteredLogs.length;
    const totalPages = Math.ceil(totalLogs / limit);

    // Get summary statistics
    const stats = {
      total: mockSecurityLogs.length,
      today: mockSecurityLogs.filter(log => {
        const logDate = new Date(log.timestamp);
        const today = new Date();
        return logDate.toDateString() === today.toDateString();
      }).length,
      thisWeek: mockSecurityLogs.filter(log => {
        const logDate = new Date(log.timestamp);
        const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
        return logDate >= weekAgo;
      }).length,
      critical: mockSecurityLogs.filter(log => log.severity === 'CRITICAL').length,
      high: mockSecurityLogs.filter(log => log.severity === 'HIGH').length,
      medium: mockSecurityLogs.filter(log => log.severity === 'MEDIUM').length,
      low: mockSecurityLogs.filter(log => log.severity === 'LOW').length,
      categories: {
        AUTH: mockSecurityLogs.filter(log => log.category === 'AUTH').length,
        USER_MANAGEMENT: mockSecurityLogs.filter(log => log.category === 'USER_MANAGEMENT').length,
        LISTING_MANAGEMENT: mockSecurityLogs.filter(log => log.category === 'LISTING_MANAGEMENT').length,
        SYSTEM: mockSecurityLogs.filter(log => log.category === 'SYSTEM').length,
        SECURITY: mockSecurityLogs.filter(log => log.category === 'SECURITY').length,
      }
    };

    return NextResponse.json({
      success: true,
      data: paginatedLogs,
      pagination: {
        currentPage: page,
        totalPages,
        totalItems: totalLogs,
        itemsPerPage: limit,
        hasNext: page < totalPages,
        hasPrev: page > 1
      },
      stats,
      filters: { category, severity, userId },
      sorting: { sortBy, sortOrder }
    });

  } catch (error) {
    console.error('Error fetching security logs:', error);
    return NextResponse.json(
      { 
        error: 'Failed to fetch security logs',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}