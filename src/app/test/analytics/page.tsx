'use client';

import React, { useState } from 'react';
import { AdminDashboard } from '@/components/analytics/AdminDashboard';
import { LandlordDashboard } from '@/components/analytics/LandlordDashboard';
import { AnalyticsChart } from '@/components/analytics/AnalyticsChart';
import { 
  UserMetricCard, 
  RevenueMetricCard, 
  ListingMetricCard, 
  BookingMetricCard 
} from '@/components/analytics/MetricsCard';
import { ChartData, ChartType } from '@/lib/analytics/types';

export default function AnalyticsTestPage() {
  const [activeTab, setActiveTab] = useState('admin');

  // Sample data for testing components
  const sampleChartData: ChartData = {
    labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
    datasets: [
      {
        label: 'Revenue',
        data: [12000, 19000, 15000, 25000, 22000, 30000],
        borderColor: 'rgb(59, 130, 246)',
        backgroundColor: 'rgba(59, 130, 246, 0.1)',
      },
      {
        label: 'Bookings',
        data: [65, 89, 120, 95, 140, 165],
        borderColor: 'rgb(16, 185, 129)',
        backgroundColor: 'rgba(16, 185, 129, 0.1)',
      },
    ],
  };

  const pieChartData: ChartData = {
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
      },
    ],
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Analytics Dashboard Test Page
          </h1>
          <p className="text-gray-600">
            Testing analytics components with sample data
          </p>
        </div>

        {/* Tab Navigation */}
        <div className="mb-8">
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex space-x-8">
              <button
                onClick={() => setActiveTab('admin')}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'admin'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Admin Dashboard
              </button>
              <button
                onClick={() => setActiveTab('landlord')}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'landlord'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Landlord Dashboard
              </button>
              <button
                onClick={() => setActiveTab('components')}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'components'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Individual Components
              </button>
            </nav>
          </div>
        </div>

        {/* Tab Content */}
        <div className="space-y-8">
          {activeTab === 'admin' && <AdminDashboard />}
          
          {activeTab === 'landlord' && <LandlordDashboard />}
          
          {activeTab === 'components' && (
            <div className="space-y-8">
              {/* Metrics Cards Test */}
              <div>
                <h2 className="text-xl font-semibold text-gray-900 mb-4">
                  Metrics Cards
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  <UserMetricCard
                    userCount={1250}
                    change={{
                      value: 85,
                      percentage: 7.3,
                      trend: 'up',
                    }}
                  />
                  <RevenueMetricCard
                    revenue={145000}
                    change={{
                      value: 12000,
                      percentage: 9.0,
                      trend: 'up',
                    }}
                  />
                  <ListingMetricCard
                    listingCount={340}
                    change={{
                      value: 25,
                      percentage: 8.0,
                      trend: 'up',
                    }}
                  />
                  <BookingMetricCard
                    bookingCount={890}
                    change={{
                      value: 45,
                      percentage: 5.3,
                      trend: 'up',
                    }}
                  />
                </div>
              </div>

              {/* Charts Test */}
              <div>
                <h2 className="text-xl font-semibold text-gray-900 mb-4">
                  Analytics Charts
                </h2>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <AnalyticsChart
                    data={sampleChartData}
                    type={ChartType.LINE}
                    title="Revenue & Bookings Trend"
                    height={300}
                  />
                  <AnalyticsChart
                    data={sampleChartData}
                    type={ChartType.BAR}
                    title="Monthly Comparison"
                    height={300}
                  />
                  <AnalyticsChart
                    data={pieChartData}
                    type={ChartType.PIE}
                    title="User Distribution"
                    height={300}
                  />
                  <AnalyticsChart
                    data={sampleChartData}
                    type={ChartType.AREA}
                    title="Growth Over Time"
                    height={300}
                  />
                </div>
              </div>

              {/* Interactive Features Test */}
              <div>
                <h2 className="text-xl font-semibold text-gray-900 mb-4">
                  Interactive Features
                </h2>
                <div className="bg-white rounded-lg shadow-sm border p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-medium">Real-time Data</h3>
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                      <span className="text-sm text-gray-600">Live updates</span>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-blue-600">1,247</div>
                      <div className="text-sm text-gray-500">Active Users</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-green-600">89%</div>
                      <div className="text-sm text-gray-500">Server Uptime</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-orange-600">156ms</div>
                      <div className="text-sm text-gray-500">Avg Response</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-purple-600">234</div>
                      <div className="text-sm text-gray-500">Active Sessions</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}