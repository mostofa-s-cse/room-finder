import React, { useState, useEffect } from 'react';
import { 
  MetricsCard, 
  RevenueMetricCard, 
  ListingMetricCard, 
  ConversionRateCard
} from './MetricsCard';
import { 
  AnalyticsChart, 
  ListingPerformanceChart
} from './AnalyticsChart';
import { ChartData, ChartType, AnalyticsPeriod, LandlordAnalytics } from '@/lib/analytics/types';


interface LandlordDashboardProps {
  landlordId?: string;
  className?: string;
}

export function LandlordDashboard({ landlordId, className = '' }: LandlordDashboardProps) {
  const [analytics, setAnalytics] = useState<LandlordAnalytics | null>(null);
  const [period, setPeriod] = useState<AnalyticsPeriod>(AnalyticsPeriod.LAST_30_DAYS);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Sample chart data for landlord-specific metrics
  const sampleListingPerformanceData: ChartData = {
    labels: ['Week 1', 'Week 2', 'Week 3', 'Week 4'],
    datasets: [
      {
        label: 'Views',
        data: [120, 190, 300, 250],
        borderColor: 'rgb(59, 130, 246)',
        backgroundColor: 'rgba(59, 130, 246, 0.1)',
      },
      {
        label: 'Inquiries',
        data: [20, 35, 45, 38],
        borderColor: 'rgb(16, 185, 129)',
        backgroundColor: 'rgba(16, 185, 129, 0.1)',
      },
    ],
  };

  const sampleBookingTrendsData: ChartData = {
    labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
    datasets: [
      {
        label: 'Bookings',
        data: [5, 8, 12, 15, 18, 22],
        backgroundColor: 'rgba(34, 197, 94, 0.8)',
        borderColor: 'rgb(34, 197, 94)',
        borderWidth: 1,
      },
    ],
  };

  const sampleRatingDistributionData: ChartData = {
    labels: ['5 Stars', '4 Stars', '3 Stars', '2 Stars', '1 Star'],
    datasets: [
      {
        label: 'Rating Distribution',
        data: [45, 25, 15, 10, 5],
        backgroundColor: [
          'rgba(34, 197, 94, 0.8)',
          'rgba(59, 130, 246, 0.8)',
          'rgba(245, 158, 11, 0.8)',
          'rgba(239, 68, 68, 0.8)',
          'rgba(107, 114, 128, 0.8)',
        ],
        borderWidth: 1,
      },
    ],
  };

  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        setLoading(true);
        const response = await fetch(`/api/analytics/overview?period=${period}&role=landlord${landlordId ? `&userId=${landlordId}` : ''}`);
        if (!response.ok) {
          throw new Error('Failed to fetch analytics');
        }
        const data = await response.json();
        setAnalytics(data.data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred');
      } finally {
        setLoading(false);
      }
    };

    fetchAnalytics();
  }, [period, landlordId]);

  const refetchAnalytics = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/analytics/overview?period=${period}&role=landlord${landlordId ? `&userId=${landlordId}` : ''}`);
      if (!response.ok) {
        throw new Error('Failed to fetch analytics');
      }
      const data = await response.json();
      setAnalytics(data.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className={`space-y-6 ${className}`}>
        <div className="animate-pulse space-y-4">
          <div className="h-32 bg-gray-200 rounded-lg"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-32 bg-gray-200 rounded-lg"></div>
            ))}
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-80 bg-gray-200 rounded-lg"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`bg-red-50 border border-red-200 rounded-lg p-6 ${className}`}>
        <div className="flex items-center gap-2 text-red-800">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span className="font-medium">Error loading analytics</span>
        </div>
        <p className="text-red-700 mt-2">{error}</p>
        <button
          onClick={refetchAnalytics}
          className="mt-3 bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700 transition-colors"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Landlord Dashboard</h1>
          <p className="text-gray-600">Track your listings performance and earnings</p>
        </div>
        
        <select
          value={period}
          onChange={(e) => setPeriod(e.target.value as AnalyticsPeriod)}
          className="bg-white border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value={AnalyticsPeriod.LAST_7_DAYS}>Last 7 Days</option>
          <option value={AnalyticsPeriod.LAST_30_DAYS}>Last 30 Days</option>
          <option value={AnalyticsPeriod.LAST_90_DAYS}>Last 90 Days</option>
          <option value={AnalyticsPeriod.LAST_YEAR}>Last Year</option>
        </select>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <RevenueMetricCard
          revenue={analytics?.totalRevenue || 45000}
          change={{
            value: 5200,
            percentage: 13.1,
            trend: 'up',
          }}
        />
        <ListingMetricCard
          listingCount={analytics?.totalListings || 12}
          change={{
            value: 2,
            percentage: 20.0,
            trend: 'up',
          }}
        />
        <MetricsCard
          title="Total Bookings"
          value={analytics?.totalBookings || 68}
          change={{
            value: 12,
            percentage: 21.4,
            trend: 'up',
          }}
          icon={
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
            </svg>
          }
          valueFormatter={(val) => val.toLocaleString()}
        />
        <ConversionRateCard
          rate={analytics?.conversionRate || 12.5}
          change={{
            value: 1.2,
            percentage: 10.6,
            trend: 'up',
          }}
        />
      </div>

      {/* Secondary Metrics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <MetricsCard
          title="Avg Rating"
          value={`${(analytics?.averageRating || 4.3).toFixed(1)}`}
          icon={
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
            </svg>
          }
        />
        <MetricsCard
          title="Response Rate"
          value={`${((analytics?.responseRate || 0.89) * 100).toFixed(0)}%`}
          icon={
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            </svg>
          }
        />
        <MetricsCard
          title="Avg Response Time"
          value={`${(analytics && 'averageResponseTime' in analytics ? (analytics as { averageResponseTime: number }).averageResponseTime : 2.5).toFixed(1)}h`}
          icon={
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          }
        />
        <MetricsCard
          title="Total Views"
          value={analytics?.totalViews || 234}
          icon={
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
            </svg>
          }
          valueFormatter={(val) => val.toLocaleString()}
        />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ListingPerformanceChart data={sampleListingPerformanceData} />
        <AnalyticsChart
          data={sampleBookingTrendsData}
          type={ChartType.BAR}
          title="Booking Trends"
          height={300}
        />
        <AnalyticsChart
          data={sampleRatingDistributionData}
          type={ChartType.PIE}
          title="Rating Distribution"
          height={300}
        />
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Top Performing Listings</h3>
          <div className="space-y-3">
            {[
              { title: 'Modern 2BR in Gulshan', views: 145, bookings: 8, revenue: 12000 },
              { title: 'Cozy Studio in Dhanmondi', views: 98, bookings: 5, revenue: 7500 },
              { title: 'Luxury 3BR in Banani', views: 89, bookings: 4, revenue: 16000 },
              { title: 'Budget Room in Mohammadpur', views: 76, bookings: 6, revenue: 4500 },
            ].map((listing, index) => (
              <div key={index} className="flex items-center justify-between py-2 border-b border-gray-100 last:border-b-0">
                <div className="flex-1">
                  <h4 className="text-sm font-medium text-gray-900">{listing.title}</h4>
                  <p className="text-xs text-gray-500">{listing.views} views • {listing.bookings} bookings</p>
                </div>
                <div className="text-sm font-medium text-green-600">
                  ৳{listing.revenue.toLocaleString()}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Recommendations */}
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Recommendations</h3>
        <div className="space-y-3">
          {[
            {
              type: 'optimization',
              title: 'Optimize listing photos',
              description: 'Listings with high-quality photos get 40% more views',
              action: 'Update Photos',
              priority: 'high',
            },
            {
              type: 'pricing',
              title: 'Adjust pricing for peak season',
              description: 'Consider increasing rates by 15% for the upcoming semester',
              action: 'Review Pricing',
              priority: 'medium',
            },
            {
              type: 'response',
              title: 'Improve response time',
              description: 'Faster responses lead to higher booking rates',
              action: 'Enable Notifications',
              priority: 'low',
            },
          ].map((rec, index) => (
            <div key={index} className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
              <div className={`w-2 h-2 rounded-full mt-2 ${
                rec.priority === 'high' ? 'bg-red-500' :
                rec.priority === 'medium' ? 'bg-yellow-500' :
                'bg-green-500'
              }`}></div>
              <div className="flex-1">
                <h4 className="text-sm font-medium text-gray-900">{rec.title}</h4>
                <p className="text-sm text-gray-600 mt-1">{rec.description}</p>
              </div>
              <button className="text-sm text-blue-600 hover:text-blue-700 font-medium">
                {rec.action}
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}