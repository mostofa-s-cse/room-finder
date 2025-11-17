import { NextRequest } from 'next/server';
import { analyticsService } from '@/lib/analytics/analytics-service';
import { ActionType, DeviceType } from '@/lib/analytics/types';

// POST /api/analytics/track - Track user actions and behavior
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { type, action, sessionId, userId, target, metadata, page, duration } = body;

    if (!sessionId) {
      return Response.json({ error: 'Session ID is required' }, { status: 400 });
    }

    switch (type) {
      case 'session':
        // Track user session start
        const sessionData = await analyticsService.trackUserSession({
          userId: userId || undefined,
          sessionId,
          userAgent: request.headers.get('user-agent') || 'Unknown',
          ipAddress: request.headers.get('x-forwarded-for') || 
                    request.headers.get('x-real-ip') || 
                    'Unknown',
          country: request.headers.get('cf-ipcountry') || undefined,
          city: request.headers.get('cf-ipcity') || undefined,
          device: detectDevice(request.headers.get('user-agent') || ''),
          browser: detectBrowser(request.headers.get('user-agent') || ''),
          referrer: request.headers.get('referer') || undefined,
          landingPage: body.landingPage || '/',
        });
        
        return Response.json({
          success: true,
          data: sessionData,
          message: 'Session tracked successfully'
        });

      case 'action':
        // Track specific user action
        if (!action || !Object.values(ActionType).includes(action)) {
          return Response.json({ error: 'Valid action type is required' }, { status: 400 });
        }

        const actionData = await analyticsService.trackUserAction({
          userId: userId || undefined,
          sessionId,
          type: action as ActionType,
          target: target || '',
          metadata: metadata || {},
          page: page || '/',
          duration: duration || undefined,
        });

        return Response.json({
          success: true,
          data: actionData,
          message: 'Action tracked successfully'
        });

      case 'session_update':
        // Update session with duration and page views
        const updatedSession = await analyticsService.updateUserSession(sessionId, {
          sessionDuration: body.sessionDuration || 0,
          pageViews: body.pageViews || 1,
          actionsPerformed: body.actionsPerformed || [],
        });

        return Response.json({
          success: true,
          data: updatedSession,
          message: 'Session updated successfully'
        });

      default:
        return Response.json({ error: 'Invalid tracking type' }, { status: 400 });
    }

  } catch (error) {
    console.error('Analytics tracking error:', error);
    return Response.json(
      { error: 'Failed to track analytics data' },
      { status: 500 }
    );
  }
}

// Helper functions
function detectDevice(userAgent: string): DeviceType {
  const ua = userAgent.toLowerCase();
  if (ua.includes('mobile') || ua.includes('android') || ua.includes('iphone')) {
    return DeviceType.MOBILE;
  } else if (ua.includes('tablet') || ua.includes('ipad')) {
    return DeviceType.TABLET;
  }
  return DeviceType.DESKTOP;
}

function detectBrowser(userAgent: string): string {
  const ua = userAgent.toLowerCase();
  if (ua.includes('chrome')) return 'Chrome';
  if (ua.includes('firefox')) return 'Firefox';
  if (ua.includes('safari')) return 'Safari';
  if (ua.includes('edge')) return 'Edge';
  if (ua.includes('opera')) return 'Opera';
  return 'Unknown';
}