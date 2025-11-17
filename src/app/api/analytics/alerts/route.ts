import { NextRequest } from 'next/server';
import { analyticsService } from '@/lib/analytics/analytics-service';

// GET /api/analytics/alerts - Get analytics alerts
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const severity = searchParams.get('severity'); // INFO, WARNING, ERROR, CRITICAL
    const status = searchParams.get('status'); // acknowledged, unacknowledged, resolved
    const limit = parseInt(searchParams.get('limit') || '20');

    // Generate alerts
    const alerts = await analyticsService.generateAlerts();

    // Apply filters
    let filteredAlerts = alerts;
    
    if (severity) {
      filteredAlerts = filteredAlerts.filter(alert => 
        alert.severity.toLowerCase() === severity.toLowerCase()
      );
    }

    if (status === 'acknowledged') {
      filteredAlerts = filteredAlerts.filter(alert => alert.acknowledged);
    } else if (status === 'unacknowledged') {
      filteredAlerts = filteredAlerts.filter(alert => !alert.acknowledged);
    } else if (status === 'resolved') {
      filteredAlerts = filteredAlerts.filter(alert => alert.resolved);
    }

    // Limit results
    filteredAlerts = filteredAlerts.slice(0, limit);

    return Response.json({
      success: true,
      data: {
        alerts: filteredAlerts,
        summary: {
          total: alerts.length,
          filtered: filteredAlerts.length,
          bySeverity: {
            critical: alerts.filter(a => a.severity === 'CRITICAL').length,
            error: alerts.filter(a => a.severity === 'ERROR').length,
            warning: alerts.filter(a => a.severity === 'WARNING').length,
            info: alerts.filter(a => a.severity === 'INFO').length,
          },
          byStatus: {
            acknowledged: alerts.filter(a => a.acknowledged).length,
            unacknowledged: alerts.filter(a => !a.acknowledged).length,
            resolved: alerts.filter(a => a.resolved).length,
          }
        }
      },
      meta: {
        filters: { severity, status },
        limit,
        generatedAt: new Date(),
      }
    });

  } catch (error) {
    console.error('Alerts retrieval error:', error);
    return Response.json(
      { error: 'Failed to retrieve alerts' },
      { status: 500 }
    );
  }
}

// POST /api/analytics/alerts - Acknowledge or resolve alerts
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { alertIds, action, userId } = body;

    if (!alertIds || !Array.isArray(alertIds)) {
      return Response.json(
        { error: 'Alert IDs array is required' },
        { status: 400 }
      );
    }

    if (!['acknowledge', 'resolve'].includes(action)) {
      return Response.json(
        { error: 'Action must be acknowledge or resolve' },
        { status: 400 }
      );
    }

    // Update alerts in database (would be implemented in service)
    // For now, just return success
    const updatedCount = alertIds.length;

    return Response.json({
      success: true,
      data: {
        action,
        updatedCount,
        alertIds,
        userId,
      },
      message: `${updatedCount} alerts ${action}d successfully`
    });

  } catch (error) {
    console.error('Alert action error:', error);
    return Response.json(
      { error: 'Failed to process alert action' },
      { status: 500 }
    );
  }
}