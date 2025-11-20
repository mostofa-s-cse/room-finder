import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

interface AdminSettings {
  platform: {
    siteName: string;
    siteDescription: string;
    maintenanceMode: boolean;
    registrationEnabled: boolean;
    approvalRequired: boolean;
    maxListingsPerUser: number;
    defaultCurrency: string;
    supportEmail: string;
  };
  security: {
    passwordMinLength: number;
    sessionTimeout: number;
    maxLoginAttempts: number;
    requireEmailVerification: boolean;
    enableTwoFactorAuth: boolean;
    allowPasswordReset: boolean;
    ipWhitelist: string[];
  };
  notifications: {
    emailNotifications: boolean;
    pushNotifications: boolean;
    smsNotifications: boolean;
    adminAlerts: boolean;
    newUserNotifications: boolean;
    reportNotifications: boolean;
    systemAlerts: boolean;
  };
  moderation: {
    autoApproveListings: boolean;
    autoModerateReviews: boolean;
    requirePhoneVerification: boolean;
    allowGuestBookings: boolean;
    flaggedContentThreshold: number;
    reviewModerationEnabled: boolean;
  };
  system: {
    backupFrequency: 'daily' | 'weekly' | 'monthly';
    logRetentionDays: number;
    maxFileUploadSize: number;
    enableAnalytics: boolean;
    enableDebugMode: boolean;
    cacheTimeout: number;
  };
}

// Default settings
const DEFAULT_SETTINGS: AdminSettings = {
  platform: {
    siteName: 'Room Finder BD',
    siteDescription: 'Find your perfect room in Bangladesh',
    maintenanceMode: false,
    registrationEnabled: true,
    approvalRequired: false,
    maxListingsPerUser: 10,
    defaultCurrency: 'BDT',
    supportEmail: 'support@roomfinder.com'
  },
  security: {
    passwordMinLength: 8,
    sessionTimeout: 30,
    maxLoginAttempts: 5,
    requireEmailVerification: true,
    enableTwoFactorAuth: false,
    allowPasswordReset: true,
    ipWhitelist: []
  },
  notifications: {
    emailNotifications: true,
    pushNotifications: true,
    smsNotifications: false,
    adminAlerts: true,
    newUserNotifications: true,
    reportNotifications: true,
    systemAlerts: true
  },
  moderation: {
    autoApproveListings: false,
    autoModerateReviews: true,
    requirePhoneVerification: false,
    allowGuestBookings: true,
    flaggedContentThreshold: 3,
    reviewModerationEnabled: true
  },
  system: {
    backupFrequency: 'daily',
    logRetentionDays: 90,
    maxFileUploadSize: 10,
    enableAnalytics: true,
    enableDebugMode: false,
    cacheTimeout: 3600
  }
};

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Unauthorized - Admin access required' },
        { status: 401 }
      );
    }

    // In a real implementation, you would fetch from your database
    // For now, return default settings
    // const settings = await prisma.adminSettings.findFirst() || DEFAULT_SETTINGS;

    return NextResponse.json({
      success: true,
      data: DEFAULT_SETTINGS
    });

  } catch (error) {
    console.error('Error fetching admin settings:', error);
    return NextResponse.json(
      { 
        error: 'Failed to fetch admin settings',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Unauthorized - Admin access required' },
        { status: 401 }
      );
    }

    const settings: AdminSettings = await request.json();

    // Validate settings
    if (!settings || typeof settings !== 'object') {
      return NextResponse.json(
        { error: 'Invalid settings data' },
        { status: 400 }
      );
    }

    // Validate required fields and constraints
    const validationErrors: string[] = [];

    if (settings.security.passwordMinLength < 6 || settings.security.passwordMinLength > 32) {
      validationErrors.push('Password minimum length must be between 6 and 32 characters');
    }

    if (settings.security.sessionTimeout < 5 || settings.security.sessionTimeout > 1440) {
      validationErrors.push('Session timeout must be between 5 and 1440 minutes');
    }

    if (settings.security.maxLoginAttempts < 3 || settings.security.maxLoginAttempts > 10) {
      validationErrors.push('Max login attempts must be between 3 and 10');
    }

    if (settings.platform.maxListingsPerUser < 1 || settings.platform.maxListingsPerUser > 100) {
      validationErrors.push('Max listings per user must be between 1 and 100');
    }

    if (settings.moderation.flaggedContentThreshold < 1 || settings.moderation.flaggedContentThreshold > 10) {
      validationErrors.push('Flagged content threshold must be between 1 and 10');
    }

    if (settings.system.logRetentionDays < 7 || settings.system.logRetentionDays > 365) {
      validationErrors.push('Log retention days must be between 7 and 365');
    }

    if (settings.system.maxFileUploadSize < 1 || settings.system.maxFileUploadSize > 100) {
      validationErrors.push('Max file upload size must be between 1 and 100 MB');
    }

    if (settings.system.cacheTimeout < 300 || settings.system.cacheTimeout > 86400) {
      validationErrors.push('Cache timeout must be between 300 and 86400 seconds');
    }

    if (validationErrors.length > 0) {
      return NextResponse.json(
        { 
          error: 'Validation failed',
          details: validationErrors
        },
        { status: 400 }
      );
    }

    // In a real implementation, you would save to your database
    // await prisma.adminSettings.upsert({
    //   where: { id: 1 },
    //   update: settings,
    //   create: { id: 1, ...settings }
    // });

    console.log('Admin settings updated:', {
      adminId: session.user.id,
      adminEmail: session.user.email,
      timestamp: new Date().toISOString(),
      settingsUpdated: Object.keys(settings)
    });

    return NextResponse.json({
      success: true,
      message: 'Admin settings updated successfully',
      data: settings
    });

  } catch (error) {
    console.error('Error updating admin settings:', error);
    return NextResponse.json(
      { 
        error: 'Failed to update admin settings',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}