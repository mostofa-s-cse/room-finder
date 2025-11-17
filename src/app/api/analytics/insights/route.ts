import { NextRequest } from 'next/server';
import { analyticsService } from '@/lib/analytics/analytics-service';

// GET /api/analytics/insights - Get analytics insights and recommendations
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    const listingId = searchParams.get('listingId');
    const type = searchParams.get('type') || 'all'; // all, warnings, opportunities, trends
    const limit = parseInt(searchParams.get('limit') || '10');

    // Generate insights based on parameters
    const insights = await analyticsService.generateInsights(
      userId || undefined,
      listingId || undefined
    );

    // Filter insights by type if specified
    let filteredInsights = insights;
    if (type !== 'all') {
      filteredInsights = insights.filter(insight => 
        insight.type.toLowerCase() === type.toLowerCase()
      );
    }

    // Limit results
    filteredInsights = filteredInsights.slice(0, limit);

    return Response.json({
      success: true,
      data: {
        insights: filteredInsights,
        summary: {
          total: insights.length,
          filtered: filteredInsights.length,
          byType: {
            warnings: insights.filter(i => i.type === 'WARNING').length,
            opportunities: insights.filter(i => i.type === 'OPPORTUNITY').length,
            trends: insights.filter(i => i.type === 'TREND').length,
            recommendations: insights.filter(i => i.type === 'RECOMMENDATION').length,
          },
          byImpact: {
            high: insights.filter(i => i.impact === 'HIGH').length,
            medium: insights.filter(i => i.impact === 'MEDIUM').length,
            low: insights.filter(i => i.impact === 'LOW').length,
          }
        }
      },
      meta: {
        userId,
        listingId,
        type,
        limit,
        generatedAt: new Date(),
      }
    });

  } catch (error) {
    console.error('Insights retrieval error:', error);
    return Response.json(
      { error: 'Failed to retrieve insights' },
      { status: 500 }
    );
  }
}

// POST /api/analytics/insights - Acknowledge or dismiss insights
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { insightIds, action } = body;

    if (!insightIds || !Array.isArray(insightIds)) {
      return Response.json(
        { error: 'Insight IDs array is required' },
        { status: 400 }
      );
    }

    if (!['acknowledge', 'dismiss'].includes(action)) {
      return Response.json(
        { error: 'Action must be acknowledge or dismiss' },
        { status: 400 }
      );
    }

    // Update insights in database (would be implemented in service)
    // For now, just return success
    const updatedCount = insightIds.length;

    return Response.json({
      success: true,
      data: {
        action,
        updatedCount,
        insightIds,
      },
      message: `${updatedCount} insights ${action}d successfully`
    });

  } catch (error) {
    console.error('Insight action error:', error);
    return Response.json(
      { error: 'Failed to process insight action' },
      { status: 500 }
    );
  }
}