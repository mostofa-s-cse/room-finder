import React, { useState, useEffect } from 'react';
import { MetricsCard } from './MetricsCard';
import { AnalyticsChart } from './AnalyticsChart';
import { ChartData, ChartType, AnalyticsPeriod } from '@/lib/analytics/types';

interface BachelorDashboardProps {
  bachelorId?: string;
  className?: string;
}

export function BachelorDashboard({ bachelorId, className = '' }: BachelorDashboardProps) {
  const [period, setPeriod] = useState<AnalyticsPeriod>(AnalyticsPeriod.LAST_30_DAYS);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [analytics, setAnalytics] = useState<Record<string, number> | null>(null);

  // Sample chart data for bachelor-specific metrics
  const sampleSearchActivityData: ChartData = {
    labels: ['Week 1', 'Week 2', 'Week 3', 'Week 4'],
    datasets: [
      {
        label: 'Searches',
        data: [15, 23, 18, 32],
        borderColor: 'rgb(59, 130, 246)',
        backgroundColor: 'rgba(59, 130, 246, 0.1)',
      },
      {
        label: 'Favorites',
        data: [3, 5, 4, 8],
        borderColor: 'rgb(239, 68, 68)',
        backgroundColor: 'rgba(239, 68, 68, 0.1)',
      },
      {
        label: 'Inquiries',
        data: [2, 4, 3, 6],
        borderColor: 'rgb(16, 185, 129)',
        backgroundColor: 'rgba(16, 185, 129, 0.1)',
      },
    ],
  };

  const sampleBudgetDistributionData: ChartData = {
    labels: ['Under 10k', '10k-15k', '15k-20k', '20k-25k', '25k+'],
    datasets: [
      {
        label: 'Search Preferences',
        data: [25, 35, 20, 15, 5],
        backgroundColor: [
          'rgba(239, 68, 68, 0.8)',
          'rgba(245, 158, 11, 0.8)',
          'rgba(34, 197, 94, 0.8)',
          'rgba(59, 130, 246, 0.8)',
          'rgba(147, 51, 234, 0.8)',
        ],
        borderWidth: 1,
      },
    ],
  };

  const sampleLocationPreferencesData: ChartData = {
    labels: ['Dhanmondi', 'Gulshan', 'Banani', 'Mohammadpur', 'Uttara', 'Others'],
    datasets: [
      {
        label: 'Search by Area',
        data: [25, 20, 15, 12, 18, 10],
        backgroundColor: 'rgba(59, 130, 246, 0.8)',
        borderColor: 'rgb(59, 130, 246)',
        borderWidth: 1,
      },
    ],
  };

  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        setLoading(true);
        const response = await fetch(`/api/analytics/overview?period=${period}&role=bachelor${bachelorId ? `&userId=${bachelorId}` : ''}`);
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
  }, [period, bachelorId]);

  const refetchAnalytics = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/analytics/overview?period=${period}&role=bachelor${bachelorId ? `&userId=${bachelorId}` : ''}`);
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
          <h1 className="text-2xl font-bold text-gray-900">My Activity Dashboard</h1>
          <p className="text-gray-600">Track your room searching journey and preferences</p>
        </div>
        
        <select
          value={period}
          onChange={(e) => setPeriod(e.target.value as AnalyticsPeriod)}
          className="bg-white border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value={AnalyticsPeriod.LAST_7_DAYS}>Last 7 Days</option>
          <option value={AnalyticsPeriod.LAST_30_DAYS}>Last 30 Days</option>
          <option value={AnalyticsPeriod.LAST_90_DAYS}>Last 90 Days</option>
        </select>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricsCard
          title="Total Searches"
          value={analytics?.totalSearches || 88}
          change={{
            value: 12,
            percentage: 15.8,
            trend: 'up',
          }}
          icon={
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          }
          valueFormatter={(val) => val.toLocaleString()}
        />
        <MetricsCard
          title="Favorites"
          value={analytics?.totalFavorites || 20}
          change={{
            value: 5,
            percentage: 33.3,
            trend: 'up',
          }}
          icon={
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
            </svg>
          }
          valueFormatter={(val) => val.toLocaleString()}
        />
        <MetricsCard
          title="Inquiries Sent"
          value={analytics?.totalInquiries || 15}
          change={{
            value: 3,
            percentage: 25.0,
            trend: 'up',
          }}
          icon={
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            </svg>
          }
          valueFormatter={(val) => val.toLocaleString()}
        />
        <MetricsCard
          title="Bookings Made"
          value={analytics?.totalBookings || 3}
          change={{
            value: 2,
            percentage: 200.0,
            trend: 'up',
          }}
          icon={
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
            </svg>
          }
          valueFormatter={(val) => val.toLocaleString()}
        />
      </div>

      {/* Secondary Metrics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <MetricsCard
          title="Avg Budget"
          value={`৳${(analytics?.averageBudget || 18500).toLocaleString()}`}
          icon={
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
            </svg>
          }
        />
        <MetricsCard
          title="Response Rate"
          value={`${((analytics?.responseRate || 0.73) * 100).toFixed(0)}%`}
          icon={
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
          }
        />
        <MetricsCard
          title="Time on Platform"
          value={`${(analytics?.averageSessionTime || 15).toFixed(0)}min`}
          icon={
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          }
        />
        <MetricsCard
          title="Profile Views"
          value={analytics?.profileViews || 45}
          icon={
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
          }
          valueFormatter={(val) => val.toLocaleString()}
        />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <AnalyticsChart
          data={sampleSearchActivityData}
          type={ChartType.LINE}
          title="Search Activity"
          height={300}
        />
        <AnalyticsChart
          data={sampleBudgetDistributionData}
          type={ChartType.DOUGHNUT}
          title="Budget Preferences"
          height={300}
        />
        <AnalyticsChart
          data={sampleLocationPreferencesData}
          type={ChartType.BAR}
          title="Location Preferences"
          height={300}
        />
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Activity</h3>
          <div className="space-y-3">
            {[
              { action: 'Searched for rooms in Dhanmondi', time: '2 hours ago', type: 'search' },
              { action: 'Added listing to favorites', time: '1 day ago', type: 'favorite' },
              { action: 'Sent inquiry to landlord', time: '2 days ago', type: 'inquiry' },
              { action: 'Updated budget preferences', time: '3 days ago', type: 'profile' },
              { action: 'Viewed listing details', time: '4 days ago', type: 'view' },
            ].map((activity, index) => (
              <div key={index} className="flex items-center gap-3 py-2">
                <div className={`w-2 h-2 rounded-full ${
                  activity.type === 'search' ? 'bg-blue-500' :
                  activity.type === 'favorite' ? 'bg-red-500' :
                  activity.type === 'inquiry' ? 'bg-green-500' :
                  activity.type === 'profile' ? 'bg-purple-500' :
                  'bg-gray-500'
                }`}></div>
                <div className="flex-1">
                  <span className="text-sm text-gray-900">{activity.action}</span>
                </div>
                <span className="text-xs text-gray-500">{activity.time}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Recommendations */}
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Personalized Recommendations</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[
            {
              title: 'Complete Your Profile',
              description: 'Add more details to get better matches',
              progress: 60,
              action: 'Complete Profile',
            },
            {
              title: 'Set Search Alerts',
              description: 'Get notified when new rooms match your criteria',
              progress: 0,
              action: 'Create Alert',
            },
            {
              title: 'Verify Your Identity',
              description: 'Verified users get faster responses',
              progress: 100,
              action: 'Verified ✓',
            },
          ].map((rec, index) => (
            <div key={index} className="bg-gray-50 rounded-lg p-4">
              <h4 className="text-sm font-medium text-gray-900 mb-2">{rec.title}</h4>
              <p className="text-sm text-gray-600 mb-3">{rec.description}</p>
              <div className="flex items-center justify-between">
                <div className="flex-1 mr-3">
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-blue-600 h-2 rounded-full transition-all" 
                      style={{ width: `${rec.progress}%` }}
                    ></div>
                  </div>
                </div>
                <button className={`text-sm font-medium ${
                  rec.progress === 100 ? 'text-green-600' : 'text-blue-600 hover:text-blue-700'
                }`}>
                  {rec.action}
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}