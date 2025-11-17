import { NextRequest } from 'next/server';
import { analyticsService } from '@/lib/analytics/analytics-service';
import { AnalyticsQuery, AnalyticsPeriod } from '@/lib/analytics/types';

// GET /api/analytics/overview - Get overview analytics for dashboard
export async function GET(request: NextRequest) {
  try {
    // Mock session for now - would be replaced with actual auth
    const session = { user: { id: 'test-user', role: 'ADMIN' } };
    if (!session?.user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const period = (searchParams.get('period') as AnalyticsPeriod) || AnalyticsPeriod.LAST_30_DAYS;
    const userId = searchParams.get('userId') || session.user.id;

    // Get different analytics based on user role
    let data: Record<string, unknown> = {};

    if (session.user.role === 'ADMIN') {
      // Admin gets comprehensive overview
      const adminAnalytics = await analyticsService.generateAdminAnalytics(
        analyticsService['getPeriodString'](period)
      );
      
      const paymentAnalytics = await analyticsService.getPaymentAnalytics(period);
      const geographicAnalytics = await analyticsService.getGeographicAnalytics();
      const popularSearches = await analyticsService.getPopularSearchTerms(period, 10);

      data = {
        admin: adminAnalytics,
        payment: paymentAnalytics,
        geographic: geographicAnalytics.slice(0, 10),
        popularSearches,
        insights: await analyticsService.generateInsights(),
        alerts: await analyticsService.generateAlerts(),
      };
    } else if (session.user.role === 'LANDLORD') {
      // Landlord gets their specific analytics
      const landlordAnalytics = await analyticsService.generateLandlordAnalytics(
        userId,
        analyticsService['getPeriodString'](period)
      );
      
      const listingAnalytics = await analyticsService.getLandlordListingAnalytics(userId, period);
      
      data = {
        landlord: landlordAnalytics,
        listings: listingAnalytics,
        insights: await analyticsService.generateInsights(userId),
      };
    } else {
      // Bachelor gets limited analytics
      const userAnalytics = await analyticsService.getUserAnalytics(userId, period);
      
      data = {
        user: userAnalytics,
        insights: await analyticsService.generateInsights(userId),
      };
    }

    return Response.json({
      success: true,
      data,
      meta: {
        period,
        generatedAt: new Date(),
        userId: userId,
        userRole: session.user.role,
      }
    });

  } catch (error) {
    console.error('Analytics overview error:', error);
    return Response.json(
      { error: 'Failed to fetch analytics overview' },
      { status: 500 }
    );
  }
}

// POST /api/analytics/overview - Query specific analytics with filters
export async function POST(request: NextRequest) {
  try {
    // Mock session for now - would be replaced with actual auth
    const session = { user: { id: 'test-user', role: 'ADMIN' } };
    if (!session?.user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const query: AnalyticsQuery = {
      period: body.period || AnalyticsPeriod.LAST_30_DAYS,
      startDate: body.startDate ? new Date(body.startDate) : undefined,
      endDate: body.endDate ? new Date(body.endDate) : undefined,
      filters: body.filters || {},
      groupBy: body.groupBy || [],
      metrics: body.metrics || [],
      limit: body.limit || 100,
      offset: body.offset || 0,
    };

    const data: Record<string, unknown> = {};

    // Process based on requested metrics
    if (query.metrics.includes('revenue')) {
      const paymentAnalytics = await analyticsService.getPaymentAnalytics(query.period);
      data.revenue = paymentAnalytics;
    }

    if (query.metrics.includes('users')) {
      if (session.user.role === 'ADMIN') {
        const adminAnalytics = await analyticsService.generateAdminAnalytics(
          analyticsService['getPeriodString'](query.period)
        );
        data.users = {
          total: adminAnalytics.totalUsers,
          active: adminAnalytics.activeUsers,
          new: adminAnalytics.newUsersThisMonth,
        };
      }
    }

    if (query.metrics.includes('listings')) {
      if (query.filters?.userId && session.user.role === 'LANDLORD') {
        const listingAnalytics = await analyticsService.getLandlordListingAnalytics(
          query.filters.userId as string,
          query.period
        );
        data.listings = listingAnalytics;
      }
    }

    if (query.metrics.includes('geographic')) {
      const geographicAnalytics = await analyticsService.getGeographicAnalytics(
        query.filters?.location as string
      );
      data.geographic = geographicAnalytics;
    }

    return Response.json({
      success: true,
      data,
      meta: {
        query,
        total: Object.keys(data).length,
        generatedAt: new Date(),
        processingTime: Date.now() % 1000, // Mock processing time
        cacheStatus: 'MISS',
      }
    });

  } catch (error) {
    console.error('Analytics query error:', error);
    return Response.json(
      { error: 'Failed to process analytics query' },
      { status: 500 }
    );
  }
}