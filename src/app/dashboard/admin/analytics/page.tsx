'use client';

import { useSession } from 'next-auth/react';
import { useEffect, useState, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { 
  BarChart3, 
  MapPin,
  ArrowLeft,
  Users,
  Home,
  DollarSign,
  MessageSquare
} from 'lucide-react';
import { redirect, useRouter } from 'next/navigation';

interface AdminStats {
  totalUsers: number;
  totalListings: number;
  totalBookings: number;
  totalRevenue: number;
  pendingReviews: number;
  reportedListings: number;
  activeUsers: number;
  newUsersThisMonth: number;
}

interface AnalyticsData {
  userGrowth?: { month: string; users: number }[];
  listingGrowth?: { month: string; listings: number }[];
  revenueGrowth?: { month: string; revenue: number }[];
  topCities?: { city: string; count: number }[];
  message?: string;
  stats?: AdminStats;
}

export default function AdminAnalyticsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingAnalytics, setIsLoadingAnalytics] = useState(false);

  const fetchData = useCallback(async () => {
    try {
      setIsLoading(true);
      setIsLoadingAnalytics(true);
      
      // Fetch both stats and analytics data
      const [statsRes, analyticsRes] = await Promise.all([
        fetch('/api/admin/stats'),
        fetch('/api/admin/analytics')
      ]);

      if (statsRes.ok) {
        const statsData = await statsRes.json();
        setStats(statsData);
      }

      if (analyticsRes.ok) {
        const analyticsData = await analyticsRes.json();
        setAnalyticsData(analyticsData);
      } else {
        console.error('Failed to fetch analytics data');
        // Use stats as fallback analytics data - we'll set this after stats are loaded
      }
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setIsLoading(false);
      setIsLoadingAnalytics(false);
    }
  }, []);

  useEffect(() => {
    if (status === 'loading') return;
    if (!session || session.user.role !== 'ADMIN') {
      redirect('/auth/signin');
    }
    fetchData();
  }, [session, status, fetchData]);

  if (status === 'loading' || isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <LoadingSpinner size="lg" text="Loading analytics..." />
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-4 mb-4">
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => router.back()}
            className="flex items-center gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Dashboard
          </Button>
        </div>
        <div>
          <h1 className="text-3xl font-bold">Platform Analytics</h1>
          <p className="text-muted-foreground">Comprehensive insights and performance metrics</p>
        </div>
      </div>

      {isLoadingAnalytics ? (
        <div className="flex items-center justify-center py-12">
          <LoadingSpinner size="lg" text="Loading analytics data..." />
        </div>
      ) : (
        <div className="space-y-8">
          {/* Key Metrics Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card className="border-blue-200 bg-blue-50/50">
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm font-medium text-blue-700">Total Users</CardTitle>
                  <Users className="h-5 w-5 text-blue-600" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-blue-800">{stats?.totalUsers?.toLocaleString() || 0}</div>
                <p className="text-sm text-green-600 mt-1">+{stats?.newUsersThisMonth || 0} this month</p>
              </CardContent>
            </Card>

            <Card className="border-green-200 bg-green-50/50">
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm font-medium text-green-700">Total Revenue</CardTitle>
                  <DollarSign className="h-5 w-5 text-green-600" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-green-800">৳{stats?.totalRevenue?.toLocaleString() || 0}</div>
                <p className="text-sm text-blue-600 mt-1">From {stats?.totalBookings || 0} bookings</p>
              </CardContent>
            </Card>

            <Card className="border-orange-200 bg-orange-50/50">
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm font-medium text-orange-700">Active Listings</CardTitle>
                  <Home className="h-5 w-5 text-orange-600" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-orange-800">{stats?.totalListings?.toLocaleString() || 0}</div>
                <p className="text-sm text-red-600 mt-1">{stats?.reportedListings || 0} reported</p>
              </CardContent>
            </Card>

            <Card className="border-purple-200 bg-purple-50/50">
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm font-medium text-purple-700">Pending Reviews</CardTitle>
                  <MessageSquare className="h-5 w-5 text-purple-600" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-purple-800">{stats?.pendingReviews || 0}</div>
                <p className="text-sm text-purple-600 mt-1">Awaiting moderation</p>
              </CardContent>
            </Card>
          </div>

          {/* Growth Charts and Analytics */}
          {analyticsData && (
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
              {/* User Growth */}
              <Card className="h-fit">
                <CardHeader>
                  <CardTitle className="text-xl flex items-center gap-2">
                    <BarChart3 className="h-5 w-5 text-blue-600" />
                    User Growth Trend
                  </CardTitle>
                  <CardDescription>Monthly user registration trends over time</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {analyticsData.userGrowth?.map((item, index: number) => (
                      <div key={index} className="flex justify-between items-center p-3 bg-blue-50 rounded-lg border border-blue-100">
                        <span className="font-semibold text-gray-700">{item.month}</span>
                        <div className="text-right">
                          <span className="text-blue-700 font-bold text-lg">{item.users?.toLocaleString()}</span>
                          <span className="text-blue-600 text-sm ml-1">users</span>
                        </div>
                      </div>
                    )) || (
                      <div className="text-center text-muted-foreground py-8">
                        <BarChart3 className="h-12 w-12 mx-auto mb-3 opacity-50" />
                        <p className="text-lg">Growth data will appear here</p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Top Cities */}
              <Card className="h-fit">
                <CardHeader>
                  <CardTitle className="text-xl flex items-center gap-2">
                    <MapPin className="h-5 w-5 text-green-600" />
                    Top Cities
                  </CardTitle>
                  <CardDescription>Geographic distribution of listings by city</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {analyticsData.topCities?.map((item, index: number) => (
                      <div key={index} className="flex justify-between items-center p-3 bg-green-50 rounded-lg border border-green-100">
                        <span className="font-semibold text-gray-700">{item.city}</span>
                        <div className="text-right">
                          <span className="text-green-700 font-bold text-lg">{item.count}</span>
                          <span className="text-green-600 text-sm ml-1">listings</span>
                        </div>
                      </div>
                    )) || (
                      <div className="text-center text-muted-foreground py-8">
                        <MapPin className="h-12 w-12 mx-auto mb-3 opacity-50" />
                        <p className="text-lg">City data will appear here</p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Revenue Growth */}
              {analyticsData.revenueGrowth && (
                <Card className="h-fit">
                  <CardHeader>
                    <CardTitle className="text-xl flex items-center gap-2">
                      <DollarSign className="h-5 w-5 text-emerald-600" />
                      Revenue Growth
                    </CardTitle>
                    <CardDescription>Monthly revenue trends and performance</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {analyticsData.revenueGrowth.map((item, index: number) => (
                        <div key={index} className="flex justify-between items-center p-3 bg-emerald-50 rounded-lg border border-emerald-100">
                          <span className="font-semibold text-gray-700">{item.month}</span>
                          <div className="text-right">
                            <span className="text-emerald-700 font-bold text-lg">৳{item.revenue?.toLocaleString()}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Listing Growth */}
              {analyticsData.listingGrowth && (
                <Card className="h-fit">
                  <CardHeader>
                    <CardTitle className="text-xl flex items-center gap-2">
                      <Home className="h-5 w-5 text-orange-600" />
                      Listing Growth
                    </CardTitle>
                    <CardDescription>New listings added over time</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {analyticsData.listingGrowth.map((item, index: number) => (
                        <div key={index} className="flex justify-between items-center p-3 bg-orange-50 rounded-lg border border-orange-100">
                          <span className="font-semibold text-gray-700">{item.month}</span>
                          <div className="text-right">
                            <span className="text-orange-700 font-bold text-lg">{item.listings?.toLocaleString()}</span>
                            <span className="text-orange-600 text-sm ml-1">listings</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          )}

          {/* System Overview */}
          <Card>
            <CardHeader>
              <CardTitle className="text-xl">System Overview</CardTitle>
              <CardDescription>Current platform health and activity status</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                <div className="text-center p-4 bg-green-50 rounded-lg border border-green-100">
                  <div className="text-3xl font-bold text-green-600">{stats?.activeUsers || 0}</div>
                  <p className="text-sm text-green-700 font-medium mt-1">Active Users</p>
                </div>
                <div className="text-center p-4 bg-yellow-50 rounded-lg border border-yellow-100">
                  <div className="text-3xl font-bold text-yellow-600">{stats?.totalBookings || 0}</div>
                  <p className="text-sm text-yellow-700 font-medium mt-1">Total Bookings</p>
                </div>
                <div className="text-center p-4 bg-blue-50 rounded-lg border border-blue-100">
                  <div className="text-3xl font-bold text-blue-600">{stats?.totalListings || 0}</div>
                  <p className="text-sm text-blue-700 font-medium mt-1">Total Listings</p>
                </div>
                <div className="text-center p-4 bg-red-50 rounded-lg border border-red-100">
                  <div className="text-3xl font-bold text-red-600">{stats?.reportedListings || 0}</div>
                  <p className="text-sm text-red-700 font-medium mt-1">Reported Items</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Analytics Message */}
          {analyticsData?.message && (
            <Card className="border-orange-200 bg-orange-50">
              <CardContent className="pt-6">
                <div className="flex items-center gap-3 text-orange-800">
                  <BarChart3 className="h-6 w-6 flex-shrink-0" />
                  <p className="font-medium text-lg">{analyticsData.message}</p>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Action Buttons */}
          <div className="flex justify-center pt-4">
            <Button 
              onClick={() => fetchData()}
              className="px-6 py-2"
              variant="outline"
            >
              <BarChart3 className="h-4 w-4 mr-2" />
              Refresh Analytics
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}