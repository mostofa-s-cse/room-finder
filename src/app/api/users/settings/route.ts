import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

interface UserSettings {
  notifications: {
    email: boolean;
    push: boolean;
    sms: boolean;
    newMessages: boolean;
    bookingUpdates: boolean;
    recommendations: boolean;
    marketing: boolean;
  };
  privacy: {
    profileVisibility: 'PUBLIC' | 'PRIVATE' | 'FRIENDS_ONLY';
    showContactInfo: boolean;
    showOnlineStatus: boolean;
  };
  preferences: {
    language: string;
    timezone: string;
    currency: string;
    theme: string;
  };
}

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || !session.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized - Please sign in' },
        { status: 401 }
      );
    }

    // Get user settings from database
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        // Add settings fields if they exist in your schema
        // For now, we'll return default settings
      }
    });

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Default settings structure
    const defaultSettings: UserSettings = {
      notifications: {
        email: true,
        push: true,
        sms: false,
        newMessages: true,
        bookingUpdates: true,
        recommendations: true,
        marketing: false
      },
      privacy: {
        profileVisibility: 'PUBLIC',
        showContactInfo: true,
        showOnlineStatus: true
      },
      preferences: {
        language: 'en',
        timezone: 'Asia/Dhaka',
        currency: 'BDT',
        theme: 'light'
      }
    };

    return NextResponse.json({
      success: true,
      data: {
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          phone: user.phone
        },
        settings: defaultSettings
      }
    });

  } catch (error) {
    console.error('Error fetching user settings:', error);
    return NextResponse.json(
      { 
        error: 'Failed to fetch user settings',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || !session.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized - Please sign in' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { profile, settings, notifications, privacy, preferences } = body;

    // Handle direct settings structure (when settings are sent at root level)
    const settingsData = settings || { notifications, privacy, preferences };

    // Validate input
    if (!profile && !settingsData.notifications && !settingsData.privacy && !settingsData.preferences) {
      return NextResponse.json(
        { error: 'No data provided to update' },
        { status: 400 }
      );
    }

    // Validate settings structure if provided
    if (settingsData.notifications || settingsData.privacy || settingsData.preferences) {
      if (settingsData.privacy && settingsData.privacy.profileVisibility) {
        const validVisibility = ['PUBLIC', 'PRIVATE', 'FRIENDS_ONLY'];
        if (!validVisibility.includes(settingsData.privacy.profileVisibility)) {
          return NextResponse.json(
            { error: 'Invalid profile visibility setting' },
            { status: 400 }
          );
        }
      }

      if (settingsData.preferences) {
        if (settingsData.preferences.theme && !['light', 'dark', 'system'].includes(settingsData.preferences.theme)) {
          return NextResponse.json(
            { error: 'Invalid theme setting' },
            { status: 400 }
          );
        }
        if (settingsData.preferences.language && typeof settingsData.preferences.language !== 'string') {
          return NextResponse.json(
            { error: 'Invalid language setting' },
            { status: 400 }
          );
        }
      }
    }

    // Start building the update data
    const updateData: {
      name?: string;
      phone?: string;
    } = {};

    if (profile) {
      // Validate profile data
      if (profile.name && typeof profile.name !== 'string') {
        return NextResponse.json(
          { error: 'Invalid name format' },
          { status: 400 }
        );
      }

      if (profile.phone && typeof profile.phone !== 'string') {
        return NextResponse.json(
          { error: 'Invalid phone format' },
          { status: 400 }
        );
      }

      if (profile.name) updateData.name = profile.name.trim();
      if (profile.phone) updateData.phone = profile.phone.trim();
    }

    // Update user profile
    const updatedUser = await prisma.user.update({
      where: { id: session.user.id },
      data: updateData,
      select: {
        id: true,
        name: true,
        email: true,
        phone: true
      }
    });

    // Log settings update (in a real implementation, you'd save to database)
    if (settingsData.notifications || settingsData.privacy || settingsData.preferences) {
      console.log('Settings update requested:', {
        userId: session.user.id,
        settings: settingsData,
        timestamp: new Date().toISOString()
      });
    }

    return NextResponse.json({
      success: true,
      message: 'Settings updated successfully',
      data: {
        user: updatedUser,
        settings: settingsData
      }
    });

  } catch (error) {
    console.error('Error updating user settings:', error);

    // Handle specific Prisma errors
    if (error instanceof Error && error.message.includes('Unique constraint failed')) {
      return NextResponse.json(
        { error: 'Phone number already in use' },
        { status: 409 }
      );
    }

    return NextResponse.json(
      { 
        error: 'Failed to update user settings',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}