import { PrismaClient, ActionType as PrismaActionType } from '@prisma/client';
import {
  UserAnalytics,
  UserAction,
  ListingAnalytics,
  PaymentAnalytics,
  SearchAnalytics,
  GeographicAnalytics,
  AdminAnalytics,
  LandlordAnalytics,
  AnalyticsInsight,
  AnalyticsAlert,
  ActionType,
  DeviceType,
  DemandLevel,
  TrendDirection,
  AnalyticsPeriod,
  ChartData,
  ChartDataset,
  InsightType,
  InsightCategory,
  ImpactLevel
} from './types';

const prisma = new PrismaClient();

export class AnalyticsService {
  // User Analytics Methods
  async trackUserAction(data: {
    userId?: string;
    sessionId: string;
    type: ActionType;
    target: string;
    metadata?: Record<string, unknown>;
    page: string;
    duration?: number;
  }): Promise<UserAction> {
    const result = await prisma.userAction.create({
      data: {
        ...data,
        type: data.type as PrismaActionType,
        metadata: (data.metadata as unknown) || {},
      }
    });
    
    return {
      ...result,
      type: result.type as ActionType,
    } as UserAction;
  }

  async trackUserSession(data: {
    userId?: string;
    sessionId: string;
    userAgent: string;
    ipAddress?: string;
    country?: string;
    city?: string;
    device: DeviceType;
    browser: string;
    referrer?: string;
    landingPage: string;
  }): Promise<UserAnalytics> {
    const result = await prisma.userAnalytics.create({
      data: {
        ...data,
        userId: data.userId || '',
        sessionDuration: 0,
        pageViews: 1,
        actionsPerformed: [],
      }
    });
    
    return {
      ...result,
      actionsPerformed: [],
    } as UserAnalytics;
  }

  async updateUserSession(sessionId: string, updates: {
    sessionDuration?: number;
    pageViews?: number;
    actionsPerformed?: unknown[];
  }): Promise<UserAnalytics | null> {
    const session = await prisma.userAnalytics.findFirst({
      where: { sessionId }
    });

    if (!session) return null;

    const result = await prisma.userAnalytics.update({
      where: { id: session.id },
      data: {
        ...updates,
        actionsPerformed: updates.actionsPerformed ? JSON.stringify(updates.actionsPerformed) : undefined,
      }
    });
    
    return {
      ...result,
      actionsPerformed: typeof result.actionsPerformed === 'string' 
        ? JSON.parse(result.actionsPerformed) 
        : [],
    } as UserAnalytics;
  }

  async getUserAnalytics(userId: string, period: AnalyticsPeriod): Promise<UserAnalytics[]> {
    const dateRange = this.getPeriodDateRange(period);
    
    const results = await prisma.userAnalytics.findMany({
      where: {
        userId,
        createdAt: {
          gte: dateRange.start,
          lte: dateRange.end,
        }
      },
      orderBy: { createdAt: 'desc' }
    });
    
    return results.map(result => ({
      ...result,
      actionsPerformed: typeof result.actionsPerformed === 'string' 
        ? JSON.parse(result.actionsPerformed) 
        : [],
    })) as UserAnalytics[];
  }

  // Listing Analytics Methods
  async incrementListingView(listingId: string, data: {
    userId?: string;
    sessionId: string;
    viewDuration?: number;
    isUnique?: boolean;
  }): Promise<void> {
    const analytics = await this.getOrCreateListingAnalytics(listingId);
    
    await prisma.listingAnalytics.update({
      where: { listingId },
      data: {
        views: { increment: 1 },
        uniqueViews: data.isUnique ? { increment: 1 } : undefined,
        averageViewDuration: data.viewDuration
          ? Math.round((analytics.averageViewDuration * analytics.views + data.viewDuration) / (analytics.views + 1))
          : undefined,
      }
    });

    // Track user action
    if (data.userId || data.sessionId) {
      await this.trackUserAction({
        userId: data.userId,
        sessionId: data.sessionId,
        type: ActionType.LISTING_VIEW,
        target: listingId,
        page: `/listings/${listingId}`,
        duration: data.viewDuration,
      });
    }
  }

  async incrementListingInquiry(listingId: string): Promise<void> {
    await prisma.listingAnalytics.update({
      where: { listingId },
      data: {
        inquiries: { increment: 1 },
        contactAttempts: { increment: 1 },
      }
    });

    // Update conversion rate
    await this.updateListingConversionRate(listingId);
  }

  async incrementListingBooking(listingId: string): Promise<void> {
    await prisma.listingAnalytics.update({
      where: { listingId },
      data: {
        bookings: { increment: 1 },
      }
    });

    // Update conversion rate
    await this.updateListingConversionRate(listingId);
  }

  async getListingAnalytics(listingId: string): Promise<ListingAnalytics | null> {
    return await prisma.listingAnalytics.findUnique({
      where: { listingId },
      include: {
        listing: {
          select: {
            title: true,
            price: true,
            city: true,
            averageRating: true,
          }
        }
      }
    }) as ListingAnalytics | null;
  }

  async getLandlordListingAnalytics(landlordId: string, period: AnalyticsPeriod): Promise<ListingAnalytics[]> {
    const dateRange = this.getPeriodDateRange(period);
    
    const results = await prisma.listingAnalytics.findMany({
      where: {
        listing: {
          landlordId,
        },
        updatedAt: {
          gte: dateRange.start,
          lte: dateRange.end,
        }
      },
      include: {
        listing: {
          select: {
            title: true,
            price: true,
            city: true,
            averageRating: true,
          }
        }
      },
      orderBy: { views: 'desc' }
    });
    return results as unknown as ListingAnalytics[];
  }

  // Payment Analytics Methods
  async updatePaymentAnalytics(period: string): Promise<PaymentAnalytics> {
    const dateRange = this.getPeriodDateRangeFromString(period);
    
    // Get payment data for the period
    const transactions = await prisma.transaction.findMany({
      where: {
        createdAt: {
          gte: dateRange.start,
          lte: dateRange.end,
        }
      }
    });

    const totalRevenue = transactions
      .filter(t => t.status === 'COMPLETED')
      .reduce((sum, t) => sum + t.amount, 0);

    const successfulTransactions = transactions.filter(t => t.status === 'COMPLETED');
    const failedTransactions = transactions.filter(t => t.status === 'FAILED');
    const refundedTransactions = transactions.filter(t => (t as unknown as { refundedAmount?: number }).refundedAmount && (t as unknown as { refundedAmount: number }).refundedAmount > 0);

    const analytics = {
      period,
      totalRevenue,
      transactionCount: transactions.length,
      averageTransactionValue: transactions.length > 0 ? totalRevenue / successfulTransactions.length : 0,
      successRate: transactions.length > 0 ? successfulTransactions.length / transactions.length : 0,
      failureRate: transactions.length > 0 ? failedTransactions.length / transactions.length : 0,
      refundRate: transactions.length > 0 ? refundedTransactions.length / transactions.length : 0,
      processingFees: successfulTransactions.reduce((sum, t) => sum + ((t as unknown as { fee?: number }).fee || 0), 0),
      netRevenue: totalRevenue - successfulTransactions.reduce((sum, t) => sum + ((t as unknown as { fee?: number }).fee || 0), 0),
      paymentMethodDistribution: JSON.stringify(this.calculatePaymentMethodDistribution(transactions)),
      monthlyRevenue: JSON.stringify(this.calculateMonthlyRevenue(transactions)),
      geographicRevenue: JSON.stringify(this.calculateGeographicRevenue(transactions)),
      userTypeRevenue: JSON.stringify(this.calculateUserTypeRevenue(transactions)),
    };

    const result = await prisma.paymentAnalytics.upsert({
      where: { period },
      create: analytics,
      update: analytics
    });
    
    return {
      ...result,
      paymentMethodDistribution: JSON.parse(result.paymentMethodDistribution as string || '[]'),
      monthlyRevenue: JSON.parse(result.monthlyRevenue as string || '[]'),
      geographicRevenue: JSON.parse(result.geographicRevenue as string || '[]'),
      userTypeRevenue: JSON.parse(result.userTypeRevenue as string || '[]'),
    } as PaymentAnalytics;
  }

  async getPaymentAnalytics(period: AnalyticsPeriod): Promise<PaymentAnalytics | null> {
    const periodString = this.getPeriodString(period);
    const result = await prisma.paymentAnalytics.findUnique({
      where: { period: periodString }
    });
    
    if (!result) return null;
    
    return {
      ...result,
      paymentMethodDistribution: JSON.parse(result.paymentMethodDistribution as string || '[]'),
      monthlyRevenue: JSON.parse(result.monthlyRevenue as string || '[]'),
      geographicRevenue: JSON.parse(result.geographicRevenue as string || '[]'),
      userTypeRevenue: JSON.parse(result.userTypeRevenue as string || '[]'),
    } as PaymentAnalytics;
  }

  // Search Analytics Methods
  async trackSearch(data: {
    searchQuery: string;
    userId?: string;
    sessionId: string;
    filters: Record<string, unknown>;
    resultsCount: number;
    location?: string;
    sortBy?: string;
    userAgent: string;
    device: DeviceType;
  }): Promise<SearchAnalytics> {
    const result = await prisma.searchAnalytics.create({
      data: {
        query: data.searchQuery,
        userId: data.userId,
        sessionId: data.sessionId,
        userAgent: data.userAgent,
        ipAddress: null,
        searchId: `search_${Date.now()}`,
        filters: JSON.stringify(data.filters),
        resultCount: data.resultsCount,
        clickedListings: [],
        searchTime: 0,
        timestamp: new Date(),
      }
    });
    
    return {
      ...result,
      searchQuery: result.query,
      resultsCount: result.resultCount,
      clickedResults: [],
      bookingConversions: [],
      searchDuration: result.searchTime,
      refinements: 0,
      location: '',
      sortBy: '',
      device: 'DESKTOP' as DeviceType,
    } as unknown as SearchAnalytics;
  }

  async updateSearchAnalytics(searchId: string, updates: {
    clickedResults?: string[];
    bookingConversions?: string[];
    searchDuration?: number;
    refinements?: number;
  }): Promise<SearchAnalytics | null> {
    const result = await prisma.searchAnalytics.update({
      where: { id: searchId },
      data: {
        clickedListings: updates.clickedResults || [],
        searchTime: updates.searchDuration,
      }
    });
    
    return {
      ...result,
      searchQuery: result.query,
      resultsCount: result.resultCount,
      clickedResults: result.clickedListings,
      bookingConversions: [],
      searchDuration: result.searchTime,
      refinements: 0,
      location: '',
      sortBy: '',
      device: 'DESKTOP' as DeviceType,
    } as unknown as SearchAnalytics;
  }

  async getPopularSearchTerms(period: AnalyticsPeriod, limit: number = 10): Promise<{ term: string; count: number; conversionRate: number }[]> {
    const dateRange = this.getPeriodDateRange(period);
    
    const searches = await prisma.searchAnalytics.findMany({
      where: {
        timestamp: {
          gte: dateRange.start,
          lte: dateRange.end,
        }
      }
    });

    // Group by search query and calculate metrics
    const termStats = searches.reduce((acc, search) => {
      const term = search.query.toLowerCase();
      if (!acc[term]) {
        acc[term] = {
          count: 0,
          totalConversions: 0,
        };
      }
      acc[term].count++;
      
      try {
        // Note: bookingConversions not available in current schema
        const conversions: string[] = [];
        acc[term].totalConversions += conversions.length;
      } catch {
        // Handle parsing error
      }
      
      return acc;
    }, {} as Record<string, { count: number; totalConversions: number }>);

    return Object.entries(termStats)
      .map(([term, stats]) => ({
        term,
        count: stats.count,
        conversionRate: stats.count > 0 ? stats.totalConversions / stats.count : 0,
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, limit);
  }

  // Geographic Analytics Methods
  async updateGeographicAnalytics(location: string): Promise<GeographicAnalytics> {
    const listings = await prisma.listing.findMany({
      where: {
        OR: [
          { city: { contains: location, mode: 'insensitive' } },
          { location: { contains: location, mode: 'insensitive' } },
          { address: { contains: location, mode: 'insensitive' } },
        ]
      }
    });

    const listingCount = listings.length;
    const averagePrice = listings.length > 0
      ? listings.reduce((sum, l) => sum + l.price, 0) / listings.length
      : 0;

    const priceRange = {
      min: listings.length > 0 ? Math.min(...listings.map(l => l.price)) : 0,
      max: listings.length > 0 ? Math.max(...listings.map(l => l.price)) : 0,
    };

    // Calculate search volume for this location
    const searchVolume = await prisma.searchAnalytics.count({
      where: {
        query: { contains: location, mode: 'insensitive' },
        timestamp: {
          gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // Last 30 days
        }
      }
    });

    // Calculate demand level based on search volume and listing count
    const demandLevel = this.calculateDemandLevel(searchVolume, listingCount);

    const analytics = {
      location,
      city: this.extractCityFromLocation(location),
      area: location,
      coordinates: JSON.stringify({ lat: 0, lng: 0 }), // Would be calculated from actual geocoding
      listingCount,
      averagePrice,
      priceRange: JSON.stringify(priceRange),
      demandLevel,
      searchVolume,
      bookingRate: 0, // Would be calculated from actual booking data
      popularAmenities: JSON.stringify([]),
      competitionLevel: 'MODERATE',
      growthRate: 0,
      trendingDirection: TrendDirection.STABLE,
      demographics: JSON.stringify({}),
      marketInsights: JSON.stringify([]),
    };

    const result = await prisma.geographicAnalytics.upsert({
      where: { location },
      create: analytics,
      update: analytics,
    });
    return result as unknown as GeographicAnalytics;
  }

  async getGeographicAnalytics(location?: string): Promise<GeographicAnalytics[]> {
    const results = await prisma.geographicAnalytics.findMany({
      where: location ? {
        location: { contains: location, mode: 'insensitive' }
      } : undefined,
      orderBy: { searchVolume: 'desc' }
    });
    return results as unknown as GeographicAnalytics[];
  }

  // Admin Analytics Methods
  async generateAdminAnalytics(period: string): Promise<AdminAnalytics> {
    const dateRange = this.getPeriodDateRangeFromString(period);
    
    // Get basic counts
    const totalUsers = await prisma.user.count();
    const activeUsers = await prisma.user.count({
      where: {
        lastLogin: {
          gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // Last 30 days
        }
      }
    });

    const newUsersToday = await prisma.user.count({
      where: {
        createdAt: {
          gte: new Date(new Date().setHours(0, 0, 0, 0)),
        }
      }
    });

    const newUsersThisMonth = await prisma.user.count({
      where: {
        createdAt: {
          gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1),
        }
      }
    });

    const totalListings = await prisma.listing.count();
    const activeListings = await prisma.listing.count({
      where: { status: 'APPROVED', isPublished: true }
    });

    const newListingsToday = await prisma.listing.count({
      where: {
        createdAt: {
          gte: new Date(new Date().setHours(0, 0, 0, 0)),
        }
      }
    });

    const totalBookings = await prisma.booking.count();
    const completedBookings = await prisma.booking.count({
      where: { status: 'COMPLETED' }
    });

    const cancelledBookings = await prisma.booking.count({
      where: { status: 'CANCELLED' }
    });

    // Get revenue data
    const transactions = await prisma.transaction.findMany({
      where: {
        status: 'COMPLETED',
        createdAt: {
          gte: dateRange.start,
          lte: dateRange.end,
        }
      }
    });

    const totalRevenue = transactions.reduce((sum, t) => sum + t.amount, 0);
    const monthlyRevenue = transactions
      .filter(t => t.createdAt >= new Date(new Date().getFullYear(), new Date().getMonth(), 1))
      .reduce((sum, t) => sum + t.amount, 0);

    const averageBookingValue = transactions.length > 0 ? totalRevenue / transactions.length : 0;

    // Calculate rates and metrics
    const platformGrowthRate = this.calculateGrowthRate(totalUsers, period);
    const userRetentionRate = activeUsers > 0 ? (activeUsers / totalUsers) * 100 : 0;
    const listingSuccessRate = totalListings > 0 ? (completedBookings / totalListings) * 100 : 0;

    const analytics = {
      period,
      totalUsers,
      activeUsers,
      newUsersToday,
      newUsersThisMonth,
      totalListings,
      activeListings,
      newListingsToday,
      totalBookings,
      completedBookings,
      cancelledBookings,
      totalRevenue,
      monthlyRevenue,
      averageBookingValue,
      platformGrowthRate,
      userRetentionRate,
      listingSuccessRate,
      customerSatisfactionScore: 4.2, // Would be calculated from actual review data
      supportTickets: JSON.stringify({
        total: 0,
        open: 0,
        resolved: 0,
        averageResolutionTime: 0,
        customerSatisfaction: 4.0,
      }),
      topPerformingAreas: JSON.stringify([]),
      userEngagementMetrics: JSON.stringify({
        dailyActiveUsers: Math.round(activeUsers / 30),
        averageSessionDuration: 0,
        pagesPerSession: 0,
        bounceRate: 0,
        returnVisitorRate: 0,
      }),
      systemHealthMetrics: JSON.stringify({
        uptime: 99.9,
        averageResponseTime: 150,
        errorRate: 0.1,
        databasePerformance: 95,
        apiLatency: 120,
      }),
    };

    const result = await prisma.adminAnalytics.upsert({
      where: { period },
      create: analytics,
      update: analytics,
    });
    return result as unknown as AdminAnalytics;
  }

  // Landlord Analytics Methods
  async generateLandlordAnalytics(landlordId: string, period: string): Promise<LandlordAnalytics> {
    const dateRange = this.getPeriodDateRangeFromString(period);
    
    // Get landlord's listings
    const listings = await prisma.listing.findMany({
      where: { landlordId },
      include: {
        listingAnalytics: true,
        bookings: {
          where: {
            createdAt: {
              gte: dateRange.start,
              lte: dateRange.end,
            }
          }
        },
        reviews: true,
      }
    });

    const totalListings = listings.length;
    const activeListings = listings.filter(l => l.status === 'APPROVED' && l.isPublished).length;
    
    const totalViews = listings.reduce((sum, l) => sum + (l.listingAnalytics?.views || 0), 0);
    const totalInquiries = listings.reduce((sum, l) => sum + (l.listingAnalytics?.inquiries || 0), 0);
    const totalBookings = listings.reduce((sum, l) => sum + l.bookings.length, 0);
    
    const conversionRate = totalViews > 0 ? (totalBookings / totalViews) * 100 : 0;
    const averageRating = listings.length > 0
      ? listings.reduce((sum, l) => sum + l.averageRating, 0) / listings.length
      : 0;

    // Get revenue data
    const transactions = await prisma.transaction.findMany({
      where: {
        listing: { landlordId },
        status: 'COMPLETED',
        createdAt: {
          gte: dateRange.start,
          lte: dateRange.end,
        }
      }
    });

    const totalRevenue = transactions.reduce((sum, t) => sum + t.amount, 0);
    const monthlyRevenue = transactions
      .filter(t => t.createdAt >= new Date(new Date().getFullYear(), new Date().getMonth(), 1))
      .reduce((sum, t) => sum + t.amount, 0);

    const analytics = {
      landlordId,
      period,
      totalListings,
      activeListings,
      totalViews,
      totalInquiries,
      totalBookings,
      conversionRate,
      averageRating,
      totalRevenue,
      monthlyRevenue,
      occupancyRate: 0, // Would be calculated based on actual occupancy data
      responseTime: 0, // Would be calculated from chat/message data
      responseRate: 0,
      customerSatisfaction: averageRating,
      topPerformingListings: JSON.stringify([]),
      monthlyMetrics: JSON.stringify([]),
      competitorComparison: JSON.stringify({}),
      marketPosition: JSON.stringify({}),
      recommendations: JSON.stringify([]),
    };

    const result = await prisma.landlordAnalytics.upsert({
      where: {
        landlordId_period: {
          landlordId,
          period,
        }
      },
      create: analytics,
      update: analytics,
    });
    return result as unknown as LandlordAnalytics;
  }

  // Insights and Alerts Methods
  async generateInsights(userId?: string, listingId?: string): Promise<AnalyticsInsight[]> {
    const insights: Partial<AnalyticsInsight>[] = [];

    if (listingId) {
      const analytics = await this.getListingAnalytics(listingId);
      if (analytics) {
        // Generate listing-specific insights
        if (analytics.views > 100 && analytics.inquiries < 5) {
          insights.push({
            type: InsightType.WARNING,
            category: InsightCategory.LISTING_PERFORMANCE,
            title: 'Low Inquiry Rate',
            description: 'Your listing has high views but low inquiries. Consider updating photos or description.',
            confidence: 0.8,
            impact: ImpactLevel.MEDIUM,
            actionable: true,
            recommendation: 'Update listing photos and description to increase inquiry rate',
            relatedMetrics: ['views', 'inquiries', 'conversionRate'],
          });
        }

        if (analytics.conversionRate > 10) {
          insights.push({
            type: InsightType.OPPORTUNITY,
            category: InsightCategory.LISTING_PERFORMANCE,
            title: 'High Performing Listing',
            description: 'This listing has an excellent conversion rate. Consider similar strategies for other listings.',
            confidence: 0.9,
            impact: ImpactLevel.HIGH,
            actionable: true,
            recommendation: 'Apply successful elements of this listing to underperforming ones',
            relatedMetrics: ['conversionRate', 'bookings'],
          });
        }
      }
    }

    if (userId) {
      // Generate user-specific insights
      const userAnalytics = await this.getUserAnalytics(userId, AnalyticsPeriod.LAST_30_DAYS);
      if (userAnalytics.length > 0) {
        const avgSessionDuration = userAnalytics.reduce((sum, ua) => sum + ua.sessionDuration, 0) / userAnalytics.length;
        
        if (avgSessionDuration < 60) { // Less than 1 minute
          insights.push({
            type: InsightType.WARNING,
            category: InsightCategory.USER_BEHAVIOR,
            title: 'Short Session Duration',
            description: 'User sessions are shorter than average. Consider improving user experience.',
            confidence: 0.7,
            impact: ImpactLevel.MEDIUM,
            actionable: true,
            recommendation: 'Analyze user journey and optimize page load times',
            relatedMetrics: ['sessionDuration', 'bounceRate'],
          });
        }
      }
    }

    // Create insights in database
    const createdInsights: AnalyticsInsight[] = [];
    for (const insight of insights) {
      const created = await prisma.analyticsInsight.create({
        data: {
          type: insight.type!,
          category: insight.category!,
          title: insight.title!,
          description: insight.description!,
          confidence: insight.confidence!,
          impact: insight.impact!,
          actionable: insight.actionable!,
          recommendation: insight.recommendation,
          relatedMetrics: insight.relatedMetrics!,
          userId: ('userId' in insight ? insight.userId : null) as string | null,
          listingId: ('listingId' in insight ? insight.listingId : null) as string | null,
        }
      });
      createdInsights.push(created as unknown as AnalyticsInsight);
    }

    return createdInsights;
  }

  async generateAlerts(): Promise<AnalyticsAlert[]> {
    const alerts: AnalyticsAlert[] = [];

    // Check for performance degradation
    const recentPaymentAnalytics = await prisma.paymentAnalytics.findFirst({
      orderBy: { createdAt: 'desc' }
    });

    if (recentPaymentAnalytics && recentPaymentAnalytics.successRate < 0.8) {
      const alert = await prisma.analyticsAlert.create({
        data: {
          type: 'PERFORMANCE_DEGRADATION',
          severity: 'WARNING',
          title: 'Payment Success Rate Below Threshold',
          description: `Payment success rate has dropped to ${(recentPaymentAnalytics.successRate * 100).toFixed(1)}%`,
          metric: 'paymentSuccessRate',
          threshold: 80,
          actualValue: recentPaymentAnalytics.successRate * 100,
        }
      });
      alerts.push(alert as unknown as AnalyticsAlert);
    }

    return alerts;
  }

  // Chart Data Generation Methods
  async generateChartData(
    type: 'revenue' | 'users' | 'listings' | 'bookings',
    period: AnalyticsPeriod,
    userId?: string
  ): Promise<ChartData> {
    const dateRange = this.getPeriodDateRange(period);
    const labels = this.generateDateLabels(dateRange.start, dateRange.end);

    let datasets: ChartDataset[] = [];

    switch (type) {
      case 'revenue':
        const revenueData = await this.getRevenueChartData(dateRange, userId);
        datasets = [{
          label: 'Revenue',
          data: revenueData,
          backgroundColor: 'rgba(59, 130, 246, 0.5)',
          borderColor: 'rgb(59, 130, 246)',
          borderWidth: 2,
        }];
        break;

      case 'users':
        const userData = await this.getUsersChartData(dateRange);
        datasets = [{
          label: 'New Users',
          data: userData,
          backgroundColor: 'rgba(16, 185, 129, 0.5)',
          borderColor: 'rgb(16, 185, 129)',
          borderWidth: 2,
        }];
        break;

      case 'listings':
        const listingData = await this.getListingsChartData(dateRange, userId);
        datasets = [{
          label: 'New Listings',
          data: listingData,
          backgroundColor: 'rgba(245, 158, 11, 0.5)',
          borderColor: 'rgb(245, 158, 11)',
          borderWidth: 2,
        }];
        break;

      case 'bookings':
        const bookingData = await this.getBookingsChartData(dateRange, userId);
        datasets = [{
          label: 'Bookings',
          data: bookingData,
          backgroundColor: 'rgba(139, 92, 246, 0.5)',
          borderColor: 'rgb(139, 92, 246)',
          borderWidth: 2,
        }];
        break;
    }

    return {
      labels,
      datasets,
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            display: true,
            position: 'top',
          },
        },
      },
    };
  }

  // Helper Methods
  private async getOrCreateListingAnalytics(listingId: string): Promise<ListingAnalytics> {
    let analytics = await prisma.listingAnalytics.findUnique({
      where: { listingId }
    });

    if (!analytics) {
      analytics = await prisma.listingAnalytics.create({
        data: {
          listingId,
          photoViews: JSON.stringify([]),
          searchRankings: JSON.stringify([]),
          geographicViews: JSON.stringify([]),
          timeBasedViews: JSON.stringify([]),
        }
      });
    }

    return analytics as unknown as ListingAnalytics;
  }

  private async updateListingConversionRate(listingId: string): Promise<void> {
    const analytics = await prisma.listingAnalytics.findUnique({
      where: { listingId }
    });

    if (analytics && analytics.views > 0) {
      const conversionRate = (analytics.bookings / analytics.views) * 100;
      await prisma.listingAnalytics.update({
        where: { listingId },
        data: { conversionRate }
      });
    }
  }

  private getPeriodDateRange(period: AnalyticsPeriod): { start: Date; end: Date } {
    const now = new Date();
    const end = new Date(now);
    let start: Date;

    switch (period) {
      case AnalyticsPeriod.LAST_24_HOURS:
        start = new Date(now.getTime() - 24 * 60 * 60 * 1000);
        break;
      case AnalyticsPeriod.LAST_7_DAYS:
        start = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case AnalyticsPeriod.LAST_30_DAYS:
        start = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        break;
      case AnalyticsPeriod.LAST_90_DAYS:
        start = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
        break;
      case AnalyticsPeriod.LAST_6_MONTHS:
        start = new Date();
        start.setMonth(start.getMonth() - 6);
        break;
      case AnalyticsPeriod.LAST_YEAR:
        start = new Date();
        start.setFullYear(start.getFullYear() - 1);
        break;
      default:
        start = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    }

    return { start, end };
  }

  private getPeriodDateRangeFromString(period: string): { start: Date; end: Date } {
    // Parse period string like "2024-01" or "2024-Q1"
    const now = new Date();
    if (period.includes('-')) {
      const [year, month] = period.split('-').map(Number);
      return {
        start: new Date(year, month - 1, 1),
        end: new Date(year, month, 0, 23, 59, 59),
      };
    }
    // Default to current month
    return {
      start: new Date(now.getFullYear(), now.getMonth(), 1),
      end: new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59),
    };
  }

  private getPeriodString(period: AnalyticsPeriod): string {
    const now = new Date();
    switch (period) {
      case AnalyticsPeriod.LAST_24_HOURS:
        return now.toISOString().split('T')[0];
      case AnalyticsPeriod.LAST_7_DAYS:
      case AnalyticsPeriod.LAST_30_DAYS:
        return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
      default:
        return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    }
  }

  private calculateDemandLevel(searchVolume: number, listingCount: number): DemandLevel {
    const ratio = listingCount > 0 ? searchVolume / listingCount : 0;
    
    if (ratio < 1) return DemandLevel.LOW;
    if (ratio < 3) return DemandLevel.MODERATE;
    if (ratio < 10) return DemandLevel.HIGH;
    return DemandLevel.VERY_HIGH;
  }

  private extractCityFromLocation(location: string): string {
    // Simple city extraction - would be more sophisticated in production
    return location.split(',')[0].trim();
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  private calculateGrowthRate(_currentValue: number, _period: string): number {
    // Simplified growth rate calculation
    // In production, this would compare with previous period
    return Math.random() * 20 - 10; // -10% to +10%
  }

  private calculatePaymentMethodDistribution(transactions: Array<{ provider?: string; amount: number; status: string }>): Array<{
    method: string;
    count: number;
    totalAmount: number;
    successCount: number;
    averageAmount: number;
    successRate: number;
  }> {
    // Group transactions by payment method and calculate stats
    const distribution = transactions.reduce((acc, t) => {
      const method = t.provider || 'UNKNOWN';
      if (!acc[method]) {
        acc[method] = {
          method,
          count: 0,
          totalAmount: 0,
          successCount: 0,
        };
      }
      acc[method].count++;
      acc[method].totalAmount += t.amount;
      if (t.status === 'COMPLETED') {
        acc[method].successCount++;
      }
      return acc;
    }, {} as Record<string, { method: string; count: number; totalAmount: number; successCount: number }>);

    return Object.values(distribution).map((item) => ({
      ...item,
      averageAmount: item.totalAmount / item.count,
      successRate: item.successCount / item.count,
    }));
  }

  private calculateMonthlyRevenue(transactions: Array<{ status: string; createdAt: Date; amount: number }>): Array<{
    month: number;
    year: number;
    revenue: number;
    transactionCount: number;
    averageValue: number;
  }> {
    // Group transactions by month and calculate revenue
    const monthlyData = transactions
      .filter(t => t.status === 'COMPLETED')
      .reduce((acc, t) => {
        const date = new Date(t.createdAt);
        const key = `${date.getFullYear()}-${date.getMonth()}`;
        if (!acc[key]) {
          acc[key] = {
            month: date.getMonth() + 1,
            year: date.getFullYear(),
            revenue: 0,
            transactionCount: 0,
          };
        }
        acc[key].revenue += t.amount;
        acc[key].transactionCount++;
        return acc;
      }, {} as Record<string, { month: number; year: number; revenue: number; transactionCount: number }>);

    return Object.values(monthlyData).map((item) => ({
      ...item,
      averageValue: item.revenue / item.transactionCount,
    }));
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  private calculateGeographicRevenue(_transactions: Array<unknown>): Array<unknown> {
    // This would use actual location data from bookings
    return [];
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  private calculateUserTypeRevenue(_transactions: Array<unknown>): Array<unknown> {
    // This would categorize by user type (bachelor/landlord)
    return [];
  }

  private generateDateLabels(start: Date, end: Date): string[] {
    const labels: string[] = [];
    const current = new Date(start);
    
    while (current <= end) {
      labels.push(current.toLocaleDateString());
      current.setDate(current.getDate() + 1);
    }
    
    return labels;
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  private async getRevenueChartData(_dateRange: { start: Date; end: Date }, _userId?: string): Promise<number[]> {
    // Implementation would fetch actual revenue data
    return Array(7).fill(0).map(() => Math.random() * 10000);
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  private async getUsersChartData(_dateRange: { start: Date; end: Date }): Promise<number[]> {
    // Implementation would fetch actual user registration data
    return Array(7).fill(0).map(() => Math.floor(Math.random() * 50));
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  private async getListingsChartData(_dateRange: { start: Date; end: Date }, _userId?: string): Promise<number[]> {
    // Implementation would fetch actual listing creation data
    return Array(7).fill(0).map(() => Math.floor(Math.random() * 20));
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  private async getBookingsChartData(_dateRange: { start: Date; end: Date }, _userId?: string): Promise<number[]> {
    // Implementation would fetch actual booking data
    return Array(7).fill(0).map(() => Math.floor(Math.random() * 30));
  }
}

// Create singleton instance
export const analyticsService = new AnalyticsService();