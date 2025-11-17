import { NextRequest } from 'next/server';
import { analyticsService } from '@/lib/analytics/analytics-service';
import { AnalyticsPeriod, DeviceType } from '@/lib/analytics/types';

// POST /api/analytics/search - Track search analytics
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      searchQuery,
      userId,
      sessionId,
      filters,
      resultsCount,
      location,
      sortBy,
      clickedResults,
      bookingConversions,
      searchDuration,
      refinements
    } = body;

    if (!searchQuery || !sessionId) {
      return Response.json(
        { error: 'Search query and session ID are required' },
        { status: 400 }
      );
    }

    // Initial search tracking
    const searchData = await analyticsService.trackSearch({
      searchQuery,
      userId,
      sessionId,
      filters: filters || {},
      resultsCount: resultsCount || 0,
      location,
      sortBy,
      userAgent: request.headers.get('user-agent') || 'Unknown',
      device: detectDevice(request.headers.get('user-agent') || ''),
    });

    // If additional data is provided, update the search record
    if (clickedResults || bookingConversions || searchDuration || refinements) {
      await analyticsService.updateSearchAnalytics(searchData.id, {
        clickedResults,
        bookingConversions,
        searchDuration,
        refinements,
      });
    }

    return Response.json({
      success: true,
      data: searchData,
      message: 'Search analytics tracked successfully'
    });

  } catch (error) {
    console.error('Search analytics error:', error);
    return Response.json(
      { error: 'Failed to track search analytics' },
      { status: 500 }
    );
  }
}

// GET /api/analytics/search - Get search analytics and insights
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const period = (searchParams.get('period') as AnalyticsPeriod) || AnalyticsPeriod.LAST_30_DAYS;
    const limit = parseInt(searchParams.get('limit') || '10');
    const type = searchParams.get('type') || 'popular';

    const data: Record<string, unknown> = {};

    switch (type) {
      case 'popular':
        // Get popular search terms
        const popularTerms = await analyticsService.getPopularSearchTerms(period, limit);
        data.popularTerms = popularTerms;
        break;

      case 'trends':
        // Get search trends (would be implemented with time-series data)
        data.trends = {
          period,
          totalSearches: 0, // Would be calculated from actual data
          averageResultsPerSearch: 0,
          conversionRate: 0,
          topLocations: [],
          topFilters: [],
        };
        break;

      case 'performance':
        // Get search performance metrics
        data.performance = {
          period,
          zeroResultsRate: 0, // Percentage of searches with no results
          averageSearchTime: 0, // Average time to find and click a result
          refinementRate: 0, // Percentage of searches that were refined
          exitRate: 0, // Percentage of searches that ended without action
        };
        break;

      default:
        return Response.json({ error: 'Invalid analytics type' }, { status: 400 });
    }

    return Response.json({
      success: true,
      data,
      meta: {
        period,
        type,
        limit,
        generatedAt: new Date(),
      }
    });

  } catch (error) {
    console.error('Search analytics retrieval error:', error);
    return Response.json(
      { error: 'Failed to retrieve search analytics' },
      { status: 500 }
    );
  }
}

// Helper function
function detectDevice(userAgent: string): DeviceType {
  const ua = userAgent.toLowerCase();
  if (ua.includes('mobile') || ua.includes('android') || ua.includes('iphone')) {
    return DeviceType.MOBILE;
  } else if (ua.includes('tablet') || ua.includes('ipad')) {
    return DeviceType.TABLET;
  }
  return DeviceType.DESKTOP;
}