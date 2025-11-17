import { NextRequest } from 'next/server';
import { analyticsService } from '@/lib/analytics/analytics-service';
import { AnalyticsPeriod, ActionType } from '@/lib/analytics/types';

// GET /api/analytics/listings/[id] - Get analytics for specific listing
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: listingId } = await params;
    const { searchParams } = new URL(request.url);
    const include = searchParams.get('include')?.split(',') || ['basic'];

    // Get basic listing analytics
    const analytics = await analyticsService.getListingAnalytics(listingId);
    
    if (!analytics) {
      return Response.json({ error: 'Listing analytics not found' }, { status: 404 });
    }

    const data: Record<string, unknown> = { basic: analytics };

    // Include additional data based on query parameters
    if (include.includes('insights')) {
      const insights = await analyticsService.generateInsights(undefined, listingId);
      data.insights = insights;
    }

    if (include.includes('charts')) {
      // Generate chart data for listing performance
      const chartData = {
        views: await analyticsService.generateChartData('listings', AnalyticsPeriod.LAST_30_DAYS),
        // Add more chart types as needed
      };
      data.charts = chartData;
    }

    return Response.json({
      success: true,
      data,
      meta: {
        listingId,
        generatedAt: new Date(),
        includes: include,
      }
    });

  } catch (error) {
    console.error('Listing analytics error:', error);
    return Response.json(
      { error: 'Failed to fetch listing analytics' },
      { status: 500 }
    );
  }
}

// POST /api/analytics/listings/[id] - Track listing interactions
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: listingId } = await params;
    const body = await request.json();
    const { type, userId, sessionId, duration, data: additionalData } = body;

    switch (type) {
      case 'view':
        await analyticsService.incrementListingView(listingId, {
          userId,
          sessionId: sessionId || 'anonymous',
          viewDuration: duration,
          isUnique: body.isUnique || false,
        });
        break;

      case 'inquiry':
        await analyticsService.incrementListingInquiry(listingId);
        break;

      case 'booking':
        await analyticsService.incrementListingBooking(listingId);
        break;

      case 'favorite':
        // Track favorite action
        await analyticsService.trackUserAction({
          userId,
          sessionId: sessionId || 'anonymous',
          type: ActionType.SAVE_LISTING,
          target: listingId,
          page: `/listings/${listingId}`,
          metadata: additionalData,
        });
        break;

      case 'share':
        // Track share action
        await analyticsService.trackUserAction({
          userId,
          sessionId: sessionId || 'anonymous',
          type: ActionType.SHARE_LISTING,
          target: listingId,
          page: `/listings/${listingId}`,
          metadata: { platform: additionalData?.platform || 'unknown' },
        });
        break;

      default:
        return Response.json({ error: 'Invalid tracking type' }, { status: 400 });
    }

    return Response.json({
      success: true,
      message: `${type} tracked successfully for listing ${listingId}`
    });

  } catch (error) {
    console.error('Listing tracking error:', error);
    return Response.json(
      { error: 'Failed to track listing interaction' },
      { status: 500 }
    );
  }
}