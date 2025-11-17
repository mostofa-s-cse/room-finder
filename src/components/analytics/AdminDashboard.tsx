import React, { useState, useEffect } from 'react';
import { 
  MetricsCard, 
  UserMetricCard, 
  RevenueMetricCard, 
  ListingMetricCard, 
  BookingMetricCard
} from './MetricsCard';
import { 
  AnalyticsChart, 
  RevenueChart, 
  UserGrowthChart, 
  ListingPerformanceChart
} from './AnalyticsChart';
import { ChartData, ChartType, AnalyticsPeriod, AdminAnalytics } from '@/lib/analytics/types';
import { RefreshCw, Download, Calendar } from 'lucide-react';

interface AdminDashboardProps {
  className?: string;
}

export function AdminDashboard({ className = '' }: AdminDashboardProps) {
  const [analytics, setAnalytics] = useState<AdminAnalytics | null>(null);
  const [period, setPeriod] = useState<AnalyticsPeriod>(AnalyticsPeriod.LAST_30_DAYS);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  // Sample chart data (replace with API data)
  const sampleRevenueData: ChartData = {
    labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
    datasets: [
      {
        label: 'Revenue',
        data: [12000, 19000, 15000, 25000, 22000, 30000],
        borderColor: 'rgb(59, 130, 246)',
        backgroundColor: 'rgba(59, 130, 246, 0.1)',
      },
    ],
  };

  const sampleUserGrowthData: ChartData = {
    labels: ['Week 1', 'Week 2', 'Week 3', 'Week 4'],
    datasets: [
      {
        label: 'New Users',
        data: [65, 89, 120, 95],
        backgroundColor: 'rgba(34, 197, 94, 0.8)',
        borderColor: 'rgb(34, 197, 94)',
        borderWidth: 1,
      },
    ],
  };

  const sampleUserTypeData: ChartData = {
    labels: ['Bachelors', 'Landlords', 'Admins'],
    datasets: [
      {
        label: 'User Distribution',
        data: [750, 200, 15],
        backgroundColor: [
          'rgba(59, 130, 246, 0.8)',
          'rgba(16, 185, 129, 0.8)',
          'rgba(245, 101, 101, 0.8)',
        ],
        borderWidth: 1,
      },
    ],
  };

  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        setLoading(true);
        const response = await fetch(`/api/analytics/overview?period=${period}&role=admin`);
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
  }, [period]);

  const refetchAnalytics = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/analytics/overview?period=${period}&role=admin`);
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
            {[...Array(4)].map((_, i) => (
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

  const handleRefresh = async () => {
    setRefreshing(true);
    await refetchAnalytics();
    setRefreshing(false);
  };

  const handleExportData = () => {
    // Implement data export functionality
    console.log('Exporting analytics data...');
  };

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Admin Analytics Dashboard</h1>
          <p className="text-gray-600">Comprehensive platform insights and metrics</p>
        </div>
        
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 bg-gray-50 rounded-lg p-1">
            <Calendar className="w-4 h-4 text-gray-500" />
            <select
              value={period}
              onChange={(e) => setPeriod(e.target.value as AnalyticsPeriod)}
              className="bg-transparent border-none text-sm focus:outline-none"
            >
              <option value={AnalyticsPeriod.LAST_7_DAYS}>Last 7 Days</option>
              <option value={AnalyticsPeriod.LAST_30_DAYS}>Last 30 Days</option>
              <option value={AnalyticsPeriod.LAST_90_DAYS}>Last 90 Days</option>
              <option value={AnalyticsPeriod.LAST_YEAR}>Last Year</option>
            </select>
          </div>
          
          <button
            onClick={handleExportData}
            className="flex items-center gap-2 bg-gray-100 text-gray-700 px-3 py-2 rounded-md hover:bg-gray-200 transition-colors text-sm"
          >
            <Download className="w-4 h-4" />
            Export
          </button>
          
          <button
            onClick={handleRefresh}
            disabled={refreshing}
            className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors text-sm disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <UserMetricCard
          userCount={analytics?.totalUsers || 965}
          change={{
            value: 48,
            percentage: 5.2,
            trend: 'up',
          }}
        />
        <RevenueMetricCard
          revenue={analytics?.totalRevenue || 125000}
          change={{
            value: 12000,
            percentage: 10.6,
            trend: 'up',
          }}
        />
        <ListingMetricCard
          listingCount={analytics?.activeListings || 234}
          change={{
            value: 15,
            percentage: 6.8,
            trend: 'up',
          }}
        />
        <BookingMetricCard
          bookingCount={analytics?.completedBookings || 156}
          change={{
            value: 23,
            percentage: 17.3,
            trend: 'up',
          }}
        />
      </div>

      {/* Secondary Metrics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <MetricsCard
          title="New Users Today"
          value={analytics?.newUsersToday || 12}
          icon={
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
            </svg>
          }
        />
        <MetricsCard
          title="Platform Growth"
          value={`${((analytics?.platformGrowthRate || 0.15) * 100).toFixed(1)}%`}
          icon={
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
            </svg>
          }
        />
        <MetricsCard
          title="User Retention"
          value={`${((analytics?.userRetentionRate || 0.78) * 100).toFixed(1)}%`}
          icon={
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
            </svg>
          }
        />
        <MetricsCard
          title="Avg Booking Value"
          value={`৳${(analytics?.averageBookingValue || 8500).toLocaleString()}`}
          icon={
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
          }
        />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <RevenueChart data={sampleRevenueData} />
        <UserGrowthChart data={sampleUserGrowthData} />
        <AnalyticsChart
          data={sampleUserTypeData}
          type={ChartType.PIE}
          title="User Type Distribution"
          height={300}
        />
        <ListingPerformanceChart 
          data={{
            labels: ['Week 1', 'Week 2', 'Week 3', 'Week 4'],
            datasets: [{
              label: 'Views',
              data: [1200, 1900, 1500, 2200],
              borderColor: 'rgb(99, 102, 241)',
              backgroundColor: 'rgba(99, 102, 241, 0.1)',
            }]
          }}
        />
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">System Health</h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Server Uptime</span>
              <span className="text-sm font-medium text-green-600">99.9%</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">API Response Time</span>
              <span className="text-sm font-medium text-blue-600">145ms</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Database Performance</span>
              <span className="text-sm font-medium text-green-600">Optimal</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Error Rate</span>
              <span className="text-sm font-medium text-red-600">0.2%</span>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Platform Activity</h3>
        <div className="space-y-3">
          {[
            { action: 'New user registration', user: 'john.doe@email.com', time: '2 minutes ago', type: 'user' },
            { action: 'Listing published', user: 'landlord123', time: '5 minutes ago', type: 'listing' },
            { action: 'Payment completed', user: 'bachelor456', time: '8 minutes ago', type: 'payment' },
            { action: 'Support ticket resolved', user: 'support-001', time: '12 minutes ago', type: 'support' },
          ].map((activity, index) => (
            <div key={index} className="flex items-center gap-3 py-2">
              <div className={`w-2 h-2 rounded-full ${
                activity.type === 'user' ? 'bg-blue-500' :
                activity.type === 'listing' ? 'bg-green-500' :
                activity.type === 'payment' ? 'bg-yellow-500' :
                'bg-purple-500'
              }`}></div>
              <div className="flex-1">
                <span className="text-sm text-gray-900">{activity.action}</span>
                <span className="text-sm text-gray-500 ml-2">by {activity.user}</span>
              </div>
              <span className="text-xs text-gray-500">{activity.time}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}