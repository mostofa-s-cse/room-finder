'use client';

import { useSession } from 'next-auth/react';
import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
// Form components moved to edit page
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Building, 
  DollarSign, 
  Users, 
  MessageCircle, 
  Calendar, 
  Star, 
  Eye,
  Plus,
  Edit,
  BarChart3,
  TrendingUp,
  MapPin,
  Phone,
  Mail,
  Settings,
  Download,
  Bell
} from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import { redirect } from 'next/navigation';

interface LandlordProfile {
  id: string;
  name: string;
  email: string;
  phone?: string;
  bio?: string;
  profilePicture?: string;
  verifiedLandlord: boolean;
  totalListings: number;
  totalBookings: number;
  averageRating: number;
  totalEarnings: number;
}

interface Listing {
  id: string;
  title: string;
  location: string;
  address?: string;
  rent: number;
  price?: number; // For compatibility with new listing form
  images: string[];
  isAvailable: boolean;
  roomType: string;
  views: number;
  favorites: number;
  bookings: number;
  rating?: number;
  description?: string;
  amenities?: string[];
  size?: number;
  deposit?: number;
  createdAt: string;
  updatedAt?: string;
  status: 'DRAFT' | 'ACTIVE' | 'INACTIVE' | 'PENDING' | 'REJECTED';
}

interface Tenant {
  id: string;
  name: string;
  email: string;
  phone?: string;
  profilePicture?: string;
  joinedAt: string;
  totalBookings: number;
  totalReviews: number;
  currentStatus: 'ACTIVE' | 'INACTIVE';
  currentListing?: {
    id: string;
    title: string;
    address: string;
  } | null;
  recentBookings: {
    id: string;
    status: string;
    startDate: string;
    endDate: string;
    totalAmount: number;
    listing: {
      id: string;
      title: string;
      address: string;
    };
  }[];
}

interface MaintenanceRequest {
  id: string;
  listingId: string;
  listingTitle: string;
  tenantId: string;
  tenantName: string;
  title: string;
  description: string;
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
  status: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';
  category: 'PLUMBING' | 'ELECTRICAL' | 'HVAC' | 'APPLIANCE' | 'STRUCTURAL' | 'OTHER';
  createdAt: string;
  completedAt?: string;
  estimatedCost?: number;
  actualCost?: number;
  images?: string[];
}

interface FinancialData {
  monthlyRevenue: number;
  yearlyRevenue: number;
  totalEarnings: number;
  totalRevenue: number;
  pendingPayments: number;
  expenses: number;
  netIncome: number;
  occupancyRate: number;
  averageRent: number;
  revenueGrowth: number;
  recentTransactions?: {
    id: string;
    amount: number;
    status: string;
    date: string;
    tenant: string;
    listing: string;
  }[];
}

interface Review {
  id: string;
  listingId: string;
  listingTitle: string;
  reviewerName: string;
  rating: number;
  comment: string;
  createdAt: string;
  response?: string;
  respondedAt?: string;
}

interface Booking {
  id: string;
  status: 'PENDING' | 'CONFIRMED' | 'PAID' | 'CANCELLED' | 'COMPLETED';
  startDate: string;
  endDate: string;
  amount: number;
  totalAmount?: number;
  user: {
    name: string;
    phone?: string;
    email: string;
  };
  listing: {
    id: string;
    title: string;
    location?: string;
    address?: string;
    price?: number;
  };
  createdAt: string;
}

interface Analytics {
  totalRevenue: number;
  totalViews: number;
  totalBookings: number;
  averageRating: number;
  monthlyData: {
    month: string;
    revenue: number;
    bookings: number;
    views: number;
  }[];
}

// Helper function to safely render values
const safeRender = (value: unknown, fallback: string | number = 'N/A'): string | number => {
  if (value === null || value === undefined) return fallback;
  if (typeof value === 'object') {
    if (Array.isArray(value)) return value.length;
    return fallback;
  }
  return value as string | number;
};

export default function LandlordDashboard() {
  const { data: session, status } = useSession();
  
  // Core state
  const [profile, setProfile] = useState<LandlordProfile | null>(null);
  const [listings, setListings] = useState<Listing[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [analytics, setAnalytics] = useState<Analytics | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  
  // Extended management state
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [maintenanceRequests, setMaintenanceRequests] = useState<MaintenanceRequest[]>([]);
  const [financialData, setFinancialData] = useState<FinancialData | null>(null);
  const [reviews, setReviews] = useState<Review[]>([]);
  
  // UI state
  const [searchTerm] = useState('');
  const [filterStatus] = useState<string>('all');
  
  // Form states - keeping minimal interface
  interface ListingFormType {
    title: string;
    description: string;
    rent: string;
    deposit: string;
    location: string;
    address: string;
    roomType: string;
    size: string;
    amenities: string[];
    images: string[];
    isAvailable: boolean;
  }
  
  // Alerts and notifications
  const [alerts, setAlerts] = useState<Array<{
    id: string;
    type: 'success' | 'error' | 'warning' | 'info';
    message: string;
  }>>([]);

  const fetchDashboardData = async () => {
    try {
      setIsLoading(true);
      const [
        profileRes, 
        listingsRes, 
        bookingsRes, 
        analyticsRes,
        tenantsRes,
        maintenanceRes,
        financialRes,
        reviewsRes
      ] = await Promise.all([
        fetch('/api/users/profile'),
        fetch('/api/listings/my-listings'),
        fetch('/api/bookings/landlord'),
        fetch('/api/analytics/landlord'),
        fetch('/api/landlord/tenants'),
        fetch('/api/landlord/maintenance'),
        fetch('/api/landlord/financial'),
        fetch('/api/landlord/reviews')
      ]);

      if (profileRes.ok) {
        const profileData = await profileRes.json();
        setProfile(profileData.data || profileData);
      }
      if (listingsRes.ok) {
        const listingsData = await listingsRes.json();
        setListings(Array.isArray(listingsData.data) ? listingsData.data : Array.isArray(listingsData) ? listingsData : []);
      }
      if (bookingsRes.ok) {
        const bookingsData = await bookingsRes.json();
        setBookings(Array.isArray(bookingsData.data) ? bookingsData.data : Array.isArray(bookingsData) ? bookingsData : []);
      }
      if (analyticsRes.ok) {
        const analyticsData = await analyticsRes.json();
        setAnalytics(analyticsData.data || analyticsData);
      }
      if (tenantsRes.ok) {
        const tenantsData = await tenantsRes.json();
        const tenantsList = Array.isArray(tenantsData.data) ? tenantsData.data : [];
        console.log('Tenants data:', tenantsList); // Debug log
        setTenants(tenantsList);
      } else {
        console.error('Failed to fetch tenants:', tenantsRes.status);
      }
      if (maintenanceRes.ok) {
        const maintenanceData = await maintenanceRes.json();
        setMaintenanceRequests(Array.isArray(maintenanceData.data) ? maintenanceData.data : []);
      }
      if (financialRes.ok) {
        const financialData = await financialRes.json();
        setFinancialData(financialData.data || financialData);
      }
      if (reviewsRes.ok) {
        const reviewsData = await reviewsRes.json();
        setReviews(Array.isArray(reviewsData.data) ? reviewsData.data : []);
      }
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      addAlert('error', 'Failed to load dashboard data');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (status === 'loading') return;
    if (!session || session.user.role !== 'LANDLORD') {
      redirect('/auth/signin');
    }
    
    // Read tab from URL parameters
    const urlParams = new URLSearchParams(window.location.search);
    const tabParam = urlParams.get('tab');
    if (tabParam && ['overview', 'listings', 'tenants', 'bookings', 'maintenance', 'financial', 'reviews', 'analytics'].includes(tabParam)) {
      setActiveTab(tabParam);
    }
    
    fetchDashboardData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session, status]);

  // CRUD Operations
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const createListing = async (formData: ListingFormType) => {
    try {
      const response = await fetch('/api/listings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });
      
      if (response.ok) {
        const newListing = await response.json();
        setListings(prev => [newListing.data, ...prev]);
        addAlert('success', 'Listing created successfully');
      } else {
        addAlert('error', 'Failed to create listing');
      }
    } catch {
      addAlert('error', 'Error creating listing');
    }
  };

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const updateListing = async (id: string, updates: Partial<Listing>) => {
    try {
      const response = await fetch(`/api/listings/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates)
      });
      
      if (response.ok) {
        const updatedListing = await response.json();
        setListings(prev => prev.map(listing => 
          listing.id === id ? updatedListing.data : listing
        ));
        addAlert('success', 'Listing updated successfully');
      } else {
        addAlert('error', 'Failed to update listing');
      }
    } catch {
      addAlert('error', 'Error updating listing');
    }
  };

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const deleteListing = async (id: string) => {
    try {
      const response = await fetch(`/api/listings/${id}`, { method: 'DELETE' });
      
      if (response.ok) {
        setListings(prev => prev.filter(listing => listing.id !== id));
        addAlert('success', 'Listing deleted successfully');
      } else {
        addAlert('error', 'Failed to delete listing');
      }
    } catch {
      addAlert('error', 'Error deleting listing');
    }
  };

  const updateMaintenanceRequest = async (id: string, status: MaintenanceRequest['status']) => {
    try {
      const response = await fetch(`/api/landlord/maintenance/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status })
      });
      
      if (response.ok) {
        setMaintenanceRequests(prev => prev.map(request => 
          request.id === id ? { ...request, status } : request
        ));
        addAlert('success', 'Maintenance request updated');
      }
    } catch {
      addAlert('error', 'Error updating maintenance request');
    }
  };

  const respondToReview = async (reviewId: string, response: string) => {
    try {
      const res = await fetch(`/api/landlord/reviews/${reviewId}/respond`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ response })
      });
      
      if (res.ok) {
        setReviews(prev => prev.map(review => 
          review.id === reviewId ? { ...review, response, respondedAt: new Date().toISOString() } : review
        ));
        addAlert('success', 'Response added successfully');
      }
    } catch {
      addAlert('error', 'Error responding to review');
    }
  };

  // Tenant management functions
  const handleCallTenant = (phone: string, name: string) => {
    if (phone) {
      window.open(`tel:${phone}`, '_self');
    } else {
      addAlert('warning', `No phone number available for ${name}`);
    }
  };

  const handleMessageTenant = async (tenantId: string, name: string) => {
    try {
      // Create or get existing chat thread
      const response = await fetch('/api/chat/threads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          participantId: tenantId,
          initialMessage: `Hello ${name}, I wanted to get in touch with you regarding your tenancy.`
        })
      });
      
      if (response.ok) {
        const data = await response.json();
        // Navigate to the chat thread
        window.open(`/chat/${data.data.threadId}`, '_blank');
        addAlert('success', `Opening chat with ${name}...`);
      } else {
        addAlert('error', 'Failed to open chat. Please try again.');
      }
    } catch (error) {
      console.error('Error opening chat:', error);
      addAlert('error', 'Failed to open chat. Please try again.');
    }
  };

  const handleViewTenantDetails = (tenant: Tenant) => {
    // Open tenant details modal or navigate to tenant profile
    addAlert('info', `Viewing details for ${tenant.name}...`);
    // TODO: Implement tenant details modal or page
  };

  const handleSendNotification = (tenantId: string, name: string) => {
    const message = prompt(`Send notification to ${name}:`);
    if (message) {
      // TODO: Implement notification sending
      addAlert('success', `Notification sent to ${name}`);
    }
  };

  // Utility functions
  const addAlert = (type: 'success' | 'error' | 'warning' | 'info', message: string) => {
    const id = Math.random().toString(36).substr(2, 9);
    setAlerts(prev => [...prev, { id, type, message }]);
    setTimeout(() => {
      setAlerts(prev => prev.filter(alert => alert.id !== id));
    }, 5000);
  };

  // resetListingForm removed - not used in current implementation

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const filteredListings = listings.filter(listing => {
    const matchesSearch = listing.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         listing.location.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = filterStatus === 'all' || listing.status === filterStatus;
    return matchesSearch && matchesFilter;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'CONFIRMED': return 'bg-green-100 text-green-800';
      case 'PENDING': return 'bg-yellow-100 text-yellow-800';
      case 'CANCELLED': return 'bg-red-100 text-red-800';
      case 'COMPLETED': return 'bg-blue-100 text-blue-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getAvailabilityColor = (isAvailable: boolean) => {
    return isAvailable ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800';
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center">
        <LoadingSpinner size="lg" text="Loading your dashboard..." />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      {/* Header */}
      <div className="bg-white border-b border-slate-200 sticky top-0 z-10">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <Building className="h-8 w-8 text-blue-600" />
                <div>
                  <h1 className="text-2xl font-bold text-slate-900">Landlord Dashboard</h1>
                  <p className="text-sm text-slate-600">Complete Property Management System</p>
                </div>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <Link href="/dashboard/landlord/listings/new">
                <Button className="bg-blue-600 hover:bg-blue-700">
                  <Plus className="h-4 w-4 mr-2" />
                  Create Listing
                </Button>
              </Link>
              <Button variant="outline" size="sm">
                <Download className="h-4 w-4 mr-2" />
                Export Data
              </Button>
              <div className="relative">
                <Bell className="h-5 w-5 text-slate-600" />
                {maintenanceRequests.filter(r => r.status === 'PENDING').length > 0 && (
                  <div className="absolute -top-1 -right-1 h-3 w-3 bg-red-500 rounded-full"></div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-6 py-8 space-y-8">
        {/* Alerts */}
        {alerts.length > 0 && (
          <div className="space-y-2">
            {alerts.map(alert => (
              <Alert key={alert.id} className={`
                ${alert.type === 'success' ? 'border-green-200 bg-green-50' : ''}
                ${alert.type === 'error' ? 'border-red-200 bg-red-50' : ''}
                ${alert.type === 'warning' ? 'border-yellow-200 bg-yellow-50' : ''}
                ${alert.type === 'info' ? 'border-blue-200 bg-blue-50' : ''}
              `}>
                <AlertDescription>{alert.message}</AlertDescription>
              </Alert>
            ))}
          </div>
        )}

        {/* Quick Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card className="border-0 shadow-lg bg-gradient-to-r from-blue-500 to-blue-600 text-white">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-blue-100 text-sm font-medium">Total Revenue</p>
                  <p className="text-3xl font-bold">৳{financialData?.monthlyRevenue?.toLocaleString() || '0'}</p>
                  <p className="text-blue-100 text-xs mt-1">This month</p>
                </div>
                <DollarSign className="h-12 w-12 text-blue-200" />
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-lg bg-gradient-to-r from-green-500 to-green-600 text-white">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-green-100 text-sm font-medium">Active Listings</p>
                  <p className="text-3xl font-bold">{listings.filter(l => l.status === 'ACTIVE').length}</p>
                  <p className="text-green-100 text-xs mt-1">
                    {((listings.filter(l => l.status === 'ACTIVE').length / listings.length) * 100).toFixed(0)}% occupancy
                  </p>
                </div>
                <Building className="h-12 w-12 text-green-200" />
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-lg bg-gradient-to-r from-purple-500 to-purple-600 text-white">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-purple-100 text-sm font-medium">Total Tenants</p>
                  <p className="text-3xl font-bold">{tenants.length}</p>
                  <p className="text-purple-100 text-xs mt-1">
                    {tenants.filter(t => t.currentStatus === 'ACTIVE').length} active
                  </p>
                </div>
                <Users className="h-12 w-12 text-purple-200" />
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-lg bg-gradient-to-r from-orange-500 to-orange-600 text-white">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-orange-100 text-sm font-medium">Pending Tasks</p>
                  <p className="text-3xl font-bold">
                    {maintenanceRequests.filter(r => r.status === 'PENDING').length}
                  </p>
                  <p className="text-orange-100 text-xs mt-1">Maintenance requests</p>
                </div>
                <Settings className="h-12 w-12 text-orange-200" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Comprehensive Management Tabs */}
        <Tabs value={activeTab} onValueChange={(value) => {
          setActiveTab(value);
          // Update URL without page reload
          const url = new URL(window.location.href);
          url.searchParams.set('tab', value);
          window.history.pushState({}, '', url.toString());
        }} className="space-y-6">
          <Card className="border-0 shadow-lg bg-white">
            <CardContent className="p-6">
              <TabsList className="grid w-full grid-cols-7 bg-slate-100 p-1 rounded-lg">
                <TabsTrigger value="overview" className="flex items-center space-x-2 data-[state=active]:bg-white data-[state=active]:shadow-sm">
                  <BarChart3 className="h-4 w-4" />
                  <span>Overview</span>
                </TabsTrigger>
                <TabsTrigger value="listings" className="flex items-center space-x-2 data-[state=active]:bg-white data-[state=active]:shadow-sm">
                  <Building className="h-4 w-4" />
                  <span>Listings</span>
                </TabsTrigger>
                <TabsTrigger value="tenants" className="flex items-center space-x-2 data-[state=active]:bg-white data-[state=active]:shadow-sm">
                  <Users className="h-4 w-4" />
                  <span>Tenants</span>
                </TabsTrigger>
                <TabsTrigger value="bookings" className="flex items-center space-x-2 data-[state=active]:bg-white data-[state=active]:shadow-sm">
                  <Calendar className="h-4 w-4" />
                  <span>Bookings</span>
                </TabsTrigger>
                <TabsTrigger value="maintenance" className="flex items-center space-x-2 data-[state=active]:bg-white data-[state=active]:shadow-sm">
                  <Settings className="h-4 w-4" />
                  <span>Maintenance</span>
                </TabsTrigger>
                <TabsTrigger value="financial" className="flex items-center space-x-2 data-[state=active]:bg-white data-[state=active]:shadow-sm">
                  <DollarSign className="h-4 w-4" />
                  <span>Financial</span>
                </TabsTrigger>
                <TabsTrigger value="reviews" className="flex items-center space-x-2 data-[state=active]:bg-white data-[state=active]:shadow-sm">
                  <Star className="h-4 w-4" />
                  <span>Reviews</span>
                </TabsTrigger>
              </TabsList>
            </CardContent>
          </Card>

          {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Profile Summary */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  Profile Summary
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center space-x-4">
                  <Avatar className="h-16 w-16">
                    <AvatarImage src={profile?.profilePicture} />
                    <AvatarFallback>{profile?.name?.charAt(0)}</AvatarFallback>
                  </Avatar>
                  <div>
                    <h3 className="text-lg font-semibold flex items-center gap-2">
                      {profile?.name}
                      {profile?.verifiedLandlord && (
                        <Badge variant="secondary" className="text-xs">
                          Verified
                        </Badge>
                      )}
                    </h3>
                    <p className="text-sm text-muted-foreground">Landlord</p>
                  </div>
                </div>
                <div className="space-y-2 text-sm">
                  <div className="flex items-center gap-2">
                    <Mail className="h-4 w-4" />
                    <span>{profile?.email}</span>
                  </div>
                  {profile?.phone && (
                    <div className="flex items-center gap-2">
                      <Phone className="h-4 w-4" />
                      <span>{profile?.phone}</span>
                    </div>
                  )}
                </div>
                <div className="grid grid-cols-2 gap-4 text-center">
                  <div>
                    <p className="text-lg font-semibold">{profile?.totalListings || 0}</p>
                    <p className="text-xs text-muted-foreground">Listings</p>
                  </div>
                  <div>
                    <p className="text-lg font-semibold">{profile?.averageRating?.toFixed(1) || '0.0'}</p>
                    <p className="text-xs text-muted-foreground">Rating</p>
                  </div>
                </div>
                <Link href="/profile/edit">
                  <Button className="w-full" variant="outline">
                    <Edit className="h-4 w-4 mr-2" />
                    Edit Profile
                  </Button>
                </Link>
              </CardContent>
            </Card>

            {/* Recent Activity */}
            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle>Recent Bookings</CardTitle>
                <CardDescription>Latest booking requests and confirmations</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {Array.isArray(bookings) && bookings.slice(0, 5).map((booking) => (
                    <div key={booking.id} className="flex items-center space-x-4 p-4 border rounded-lg">
                      <Avatar>
                        <AvatarFallback>{booking.user?.name?.charAt(0) || 'U'}</AvatarFallback>
                      </Avatar>
                      <div className="flex-1">
                        <div className="flex items-center justify-between">
                          <h4 className="font-medium">{safeRender(booking.user?.name, 'Unknown User')}</h4>
                          <Badge className={getStatusColor(booking.status)}>
                            {booking.status}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground">
                          {booking.listing?.title || 'Untitled Listing'}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          ৳{(booking.totalAmount || booking.amount || 0).toLocaleString()}
                        </p>
                      </div>
                    </div>
                  ))}
                  {bookings.length === 0 && (
                    <p className="text-center text-muted-foreground py-8">
                      No bookings yet. Promote your listings to get more visibility!
                    </p>
                  )}
                  <div className="text-center">
                    <Button variant="outline" size="sm" onClick={() => setActiveTab('bookings')}>
                      View All Bookings
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Listings Tab */}
        <TabsContent value="listings" className="space-y-4">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-2xl font-bold">Your Listings</h2>
              <p className="text-muted-foreground">Manage your room listings</p>
            </div>
            <Link href="/dashboard/landlord/listings/new">
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Add New Listing
              </Button>
            </Link>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {Array.isArray(listings) && listings.map((listing) => (
              <Card key={listing.id} className="relative">
                <CardContent className="p-0">
                  <div className="relative">
                    {listing.images.length > 0 ? (
                      <Image
                        src={listing.images[0]}
                        alt={listing.title}
                        width={400}
                        height={192}
                        className="w-full h-48 object-cover rounded-t-lg"
                      />
                    ) : (
                      <div className="w-full h-48 bg-muted flex items-center justify-center rounded-t-lg">
                        <Building className="h-12 w-12 text-muted-foreground" />
                      </div>
                    )}
                    <Badge 
                      className={`${getAvailabilityColor(listing.isAvailable)} absolute top-2 left-2`}
                    >
                      {listing.isAvailable ? 'Available' : 'Unavailable'}
                    </Badge>
                  </div>
                  <div className="p-4 space-y-3">
                    <div>
                      <h3 className="font-semibold line-clamp-1">{listing.title || 'Untitled Listing'}</h3>
                      <p className="text-sm text-muted-foreground flex items-center gap-1">
                        <MapPin className="h-3 w-3" />
                        {listing.location || 'Location not specified'}
                      </p>
                    </div>
                    <div className="flex justify-between items-center">
                      <div className="text-lg font-bold">৳{safeRender(listing.rent || (listing as { price?: number }).price, 'N/A')}</div>
                      <Badge variant="outline">{listing.roomType || 'Standard Room'}</Badge>
                    </div>
                    <div className="grid grid-cols-3 gap-2 text-center text-sm">
                      <div>
                        <p className="font-medium">{safeRender(listing.views, 0)}</p>
                        <p className="text-xs text-muted-foreground">Views</p>
                      </div>
                      <div>
                        <p className="font-medium">{safeRender(listing.favorites, 0)}</p>
                        <p className="text-xs text-muted-foreground">Favorites</p>
                      </div>
                      <div>
                        <p className="font-medium">{safeRender(listing.bookings, 0)}</p>
                        <p className="text-xs text-muted-foreground">Bookings</p>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Link href={`/rooms/${listing.id}`} className="flex-1">
                        <Button variant="outline" size="sm" className="w-full">
                          <Eye className="h-4 w-4 mr-1" />
                          View
                        </Button>
                      </Link>
                      <Link href={`/dashboard/landlord/listings/${listing.id}/edit`} className="flex-1">
                        <Button size="sm" className="w-full">
                          <Edit className="h-4 w-4 mr-1" />
                          Edit
                        </Button>
                      </Link>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
            {listings.length === 0 && (
              <div className="col-span-full text-center py-12">
                <Building className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <p className="text-muted-foreground">No listings yet.</p>
                <Link href="/dashboard/landlord/listings/new">
                  <Button className="mt-4">
                    <Plus className="h-4 w-4 mr-2" />
                    Create Your First Listing
                  </Button>
                </Link>
              </div>
            )}
          </div>
        </TabsContent>

        {/* Bookings Tab */}
        <TabsContent value="bookings" className="space-y-4">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-2xl font-bold">Booking Management</h2>
              <p className="text-muted-foreground">Review and manage booking requests</p>
            </div>
          </div>
          <div className="space-y-4">
            {Array.isArray(bookings) && bookings.map((booking) => (
              <Card key={booking.id}>
                <CardContent className="p-6">
                  <div className="flex flex-col md:flex-row md:items-center md:justify-between">
                    <div className="flex items-center space-x-4">
                      <Avatar className="h-12 w-12">
                        <AvatarFallback>{booking.user?.name?.charAt(0) || 'U'}</AvatarFallback>
                      </Avatar>
                      <div>
                        <h3 className="font-semibold">{safeRender(booking.user?.name, 'Unknown User')}</h3>
                        <p className="text-sm text-muted-foreground">
                          {booking.listing?.title || 'Untitled Listing'}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {booking.listing?.location || booking.listing?.address || 'Location not specified'}
                        </p>
                        <div className="flex items-center gap-2 mt-1">
                          <Mail className="h-3 w-3" />
                          <span className="text-xs">{safeRender(booking.user?.email, 'No email')}</span>
                        </div>
                      </div>
                    </div>
                    <div className="mt-4 md:mt-0 text-right">
                      <Badge className={getStatusColor(booking.status)}>
                        {booking.status}
                      </Badge>
                      <p className="text-lg font-semibold mt-2">
                        ৳{(booking.totalAmount || booking.amount || 0).toLocaleString()}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {booking.totalAmount ? 'Total Amount' : 'Deposit Amount'}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {new Date(booking.startDate).toLocaleDateString()} - {new Date(booking.endDate).toLocaleDateString()}
                      </p>
                      <div className="flex gap-2 mt-2">
                        {booking.status === 'PENDING' && (
                          <>
                            <Button size="sm" variant="outline">
                              Accept
                            </Button>
                            <Button size="sm" variant="destructive">
                              Decline
                            </Button>
                          </>
                        )}
                        {booking.user?.phone && (
                          <Button size="sm" variant="outline">
                            <Phone className="h-4 w-4 mr-1" />
                            Call
                          </Button>
                        )}
                        <Button size="sm" variant="outline">
                          <MessageCircle className="h-4 w-4 mr-1" />
                          Chat
                        </Button>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
            {bookings.length === 0 && (
              <div className="text-center py-12">
                <Calendar className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <p className="text-muted-foreground">No bookings yet.</p>
                <p className="text-sm text-muted-foreground mt-2">
                  Your listings will start receiving bookings once they&apos;re live.
                </p>
              </div>
            )}
          </div>
        </TabsContent>

        {/* Tenants Tab */}
        <TabsContent value="tenants" className="space-y-4">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-2xl font-bold">Tenant Management</h2>
              <p className="text-muted-foreground">Manage your tenants and rental agreements</p>
            </div>
          </div>
          <div className="space-y-4">
            {Array.isArray(tenants) && tenants.map((tenant) => (
              <Card key={tenant.id}>
                <CardContent className="p-6">
                  <div className="flex flex-col lg:flex-row lg:items-start space-y-4 lg:space-y-0 lg:space-x-6">
                    {/* Tenant Avatar and Basic Info */}
                    <div className="flex items-center space-x-4">
                      <Avatar className="h-16 w-16">
                        <AvatarImage src={tenant.profilePicture} />
                        <AvatarFallback className="bg-blue-100 text-blue-600 font-semibold">
                          {tenant.name?.charAt(0) || 'T'}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900">{tenant.name}</h3>
                        <p className="text-sm text-gray-600 flex items-center gap-1">
                          <Mail className="h-3 w-3" />
                          {tenant.email}
                        </p>
                        {tenant.phone && (
                          <p className="text-sm text-gray-600 flex items-center gap-1 mt-1">
                            <Phone className="h-3 w-3" />
                            {tenant.phone}
                          </p>
                        )}
                        <p className="text-xs text-gray-500 mt-1">
                          Joined: {new Date(tenant.joinedAt).toLocaleDateString()}
                        </p>
                      </div>
                    </div>

                    {/* Tenant Status and Stats */}
                    <div className="flex-1">
                      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                        <div className="text-center p-3 bg-gray-50 rounded-lg">
                          <p className="text-lg font-bold text-gray-900">{tenant.totalBookings}</p>
                          <p className="text-xs text-gray-600">Total Bookings</p>
                        </div>
                        <div className="text-center p-3 bg-gray-50 rounded-lg">
                          <p className="text-lg font-bold text-gray-900">{tenant.totalReviews}</p>
                          <p className="text-xs text-gray-600">Reviews</p>
                        </div>
                        <div className="text-center p-3 bg-gray-50 rounded-lg">
                          <Badge className={tenant.currentStatus === 'ACTIVE' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}>
                            {tenant.currentStatus}
                          </Badge>
                          <p className="text-xs text-gray-600 mt-1">Status</p>
                        </div>
                        <div className="text-center p-3 bg-gray-50 rounded-lg">
                          <p className="text-lg font-bold text-gray-900">{tenant.recentBookings.length}</p>
                          <p className="text-xs text-gray-600">Recent Stays</p>
                        </div>
                      </div>

                      {/* Current Listing Info */}
                      {tenant.currentListing && (
                        <div className="mt-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
                          <h4 className="font-medium text-blue-900">Current Property</h4>
                          <p className="text-sm text-blue-700">{tenant.currentListing.title}</p>
                          <p className="text-xs text-blue-600">{tenant.currentListing.address}</p>
                        </div>
                      )}

                      {/* Recent Bookings Summary */}
                      {tenant.recentBookings.length > 0 && (
                        <div className="mt-4">
                          <h4 className="font-medium text-gray-900 mb-2">Recent Bookings</h4>
                          <div className="space-y-2">
                            {tenant.recentBookings.slice(0, 2).map((booking) => (
                              <div key={booking.id} className="flex justify-between items-center text-sm p-2 bg-gray-50 rounded">
                                <div>
                                  <p className="font-medium">{booking.listing.title}</p>
                                  <p className="text-gray-600">
                                    {new Date(booking.startDate).toLocaleDateString()} - {new Date(booking.endDate).toLocaleDateString()}
                                  </p>
                                </div>
                                <div className="text-right">
                                  <p className="font-semibold">৳{booking.totalAmount.toLocaleString()}</p>
                                  <Badge className={getStatusColor(booking.status)}>
                                    {booking.status}
                                  </Badge>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Action Buttons */}
                    <div className="flex flex-col gap-2 min-w-[140px]">
                      <Button 
                        size="sm" 
                        variant="outline"
                        onClick={() => handleCallTenant(tenant.phone || '', tenant.name)}
                        className="w-full justify-start"
                      >
                        <Phone className="h-4 w-4 mr-2" />
                        Call
                      </Button>
                      <Button 
                        size="sm" 
                        variant="outline"
                        onClick={() => handleMessageTenant(tenant.id, tenant.name)}
                        className="w-full justify-start"
                      >
                        <MessageCircle className="h-4 w-4 mr-2" />
                        Message
                      </Button>
                      <Button 
                        size="sm" 
                        variant="outline"
                        onClick={() => handleViewTenantDetails(tenant)}
                        className="w-full justify-start"
                      >
                        <Eye className="h-4 w-4 mr-2" />
                        View Details
                      </Button>
                      <Button 
                        size="sm" 
                        variant="outline"
                        onClick={() => handleSendNotification(tenant.id, tenant.name)}
                        className="w-full justify-start"
                      >
                        <Bell className="h-4 w-4 mr-2" />
                        Notify
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
            {tenants.length === 0 && (
              <div className="text-center py-12">
                <Users className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <p className="text-muted-foreground">No tenants yet.</p>
                <p className="text-sm text-muted-foreground mt-2">
                  Tenants will appear here once they book your listings.
                </p>
              </div>
            )}
          </div>
        </TabsContent>

        {/* Maintenance Tab */}
        <TabsContent value="maintenance" className="space-y-4">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-2xl font-bold">Maintenance Requests</h2>
              <p className="text-muted-foreground">Manage property maintenance and repairs</p>
            </div>
          </div>
          <div className="space-y-4">
            {Array.isArray(maintenanceRequests) && maintenanceRequests.map((request) => (
              <Card key={request.id}>
                <CardContent className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <h3 className="text-lg font-semibold">{request.title}</h3>
                        <Badge className={
                          request.priority === 'URGENT' ? 'bg-red-100 text-red-800' :
                          request.priority === 'HIGH' ? 'bg-orange-100 text-orange-800' :
                          request.priority === 'MEDIUM' ? 'bg-yellow-100 text-yellow-800' :
                          'bg-blue-100 text-blue-800'
                        }>
                          {request.priority}
                        </Badge>
                        <Badge className={
                          request.status === 'COMPLETED' ? 'bg-green-100 text-green-800' :
                          request.status === 'IN_PROGRESS' ? 'bg-blue-100 text-blue-800' :
                          request.status === 'PENDING' ? 'bg-yellow-100 text-yellow-800' :
                          'bg-gray-100 text-gray-800'
                        }>
                          {request.status}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground mb-2">{request.description}</p>
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <span>Property: {request.listingTitle || 'Unknown'}</span>
                        <span>Tenant: {request.tenantName || 'Unknown'}</span>
                        <span>Created: {new Date(request.createdAt).toLocaleDateString()}</span>
                      </div>
                      {(request.estimatedCost || request.actualCost) && (
                        <div className="mt-2 text-sm">
                          {request.estimatedCost && <span>Estimated: ৳{request.estimatedCost.toLocaleString()}</span>}
                          {request.actualCost && <span className="ml-4">Actual: ৳{request.actualCost.toLocaleString()}</span>}
                        </div>
                      )}
                    </div>
                    <div className="flex flex-col gap-2">
                      {request.status === 'PENDING' && (
                        <Button size="sm" onClick={() => updateMaintenanceRequest(request.id, 'IN_PROGRESS')}>
                          Start Work
                        </Button>
                      )}
                      {request.status === 'IN_PROGRESS' && (
                        <Button size="sm" onClick={() => updateMaintenanceRequest(request.id, 'COMPLETED')}>
                          Mark Complete
                        </Button>
                      )}
                      <Button size="sm" variant="outline">
                        View Details
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
            {maintenanceRequests.length === 0 && (
              <div className="text-center py-12">
                <Settings className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <p className="text-muted-foreground">No maintenance requests.</p>
                <p className="text-sm text-muted-foreground mt-2">
                  Maintenance requests will appear here when tenants report issues.
                </p>
              </div>
            )}
          </div>
        </TabsContent>

        {/* Financial Tab */}
        <TabsContent value="financial" className="space-y-6">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-2xl font-bold">Financial Overview</h2>
              <p className="text-muted-foreground">Track your income, expenses, and financial performance</p>
            </div>
            <Button variant="outline">
              <Download className="h-4 w-4 mr-2" />
              Export Report
            </Button>
          </div>

          {/* Financial Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Monthly Revenue</CardTitle>
                <DollarSign className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">৳{financialData?.monthlyRevenue?.toLocaleString() || '0'}</div>
                <p className="text-xs text-muted-foreground">Current month earnings</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">৳{financialData?.totalRevenue?.toLocaleString() || '0'}</div>
                <p className="text-xs text-muted-foreground">All-time earnings</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Average Rent</CardTitle>
                <Building className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">৳{financialData?.averageRent?.toLocaleString() || '0'}</div>
                <p className="text-xs text-muted-foreground">Per property</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Occupancy Rate</CardTitle>
                <BarChart3 className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{financialData?.occupancyRate?.toFixed(1) || '0'}%</div>
                <p className="text-xs text-muted-foreground">Current occupancy</p>
              </CardContent>
            </Card>
          </div>

          {/* Recent Transactions */}
          <Card>
            <CardHeader>
              <CardTitle>Recent Transactions</CardTitle>
              <CardDescription>Latest payments and transactions</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {financialData?.recentTransactions?.slice(0, 10).map((transaction) => (
                  <div key={transaction.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div>
                      <h4 className="font-medium">{transaction.tenant}</h4>
                      <p className="text-sm text-muted-foreground">{transaction.listing}</p>
                      <p className="text-xs text-muted-foreground">{new Date(transaction.date).toLocaleDateString()}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-green-600">+৳{transaction.amount?.toLocaleString()}</p>
                      <Badge className={getStatusColor(transaction.status)}>
                        {transaction.status}
                      </Badge>
                    </div>
                  </div>
                )) || (
                  <p className="text-center text-muted-foreground py-8">
                    No transactions yet.
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Reviews Tab */}
        <TabsContent value="reviews" className="space-y-4">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-2xl font-bold">Reviews & Ratings</h2>
              <p className="text-muted-foreground">Manage tenant reviews and feedback</p>
            </div>
          </div>
          
          {/* Reviews Summary */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card>
              <CardHeader className="text-center">
                <CardTitle className="text-3xl font-bold">{analytics?.averageRating?.toFixed(1) || '0.0'}</CardTitle>
                <CardDescription>Average Rating</CardDescription>
              </CardHeader>
              <CardContent className="text-center">
                <div className="flex justify-center">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <Star 
                      key={star} 
                      className={`h-5 w-5 ${
                        star <= (analytics?.averageRating || 0) 
                          ? 'text-yellow-400 fill-yellow-400' 
                          : 'text-gray-300'
                      }`} 
                    />
                  ))}
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="text-center">
                <CardTitle className="text-3xl font-bold">{reviews.length}</CardTitle>
                <CardDescription>Total Reviews</CardDescription>
              </CardHeader>
            </Card>
            <Card>
              <CardHeader className="text-center">
                <CardTitle className="text-3xl font-bold">
                  {reviews.filter(r => !r.response).length}
                </CardTitle>
                <CardDescription>Pending Responses</CardDescription>
              </CardHeader>
            </Card>
          </div>

          {/* Reviews List */}
          <div className="space-y-4">
            {Array.isArray(reviews) && reviews.map((review) => (
              <Card key={review.id}>
                <CardContent className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <h3 className="font-semibold">{review.reviewerName}</h3>
                        <div className="flex">
                          {[1, 2, 3, 4, 5].map((star) => (
                            <Star 
                              key={star} 
                              className={`h-4 w-4 ${
                                star <= review.rating 
                                  ? 'text-yellow-400 fill-yellow-400' 
                                  : 'text-gray-300'
                              }`} 
                            />
                          ))}
                        </div>
                        <span className="text-sm text-muted-foreground">•</span>
                        <span className="text-sm text-muted-foreground">
                          {new Date(review.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                      <p className="text-sm text-muted-foreground mb-2">
                        Property: {review.listingTitle}
                      </p>
                      <p className="mb-4">{review.comment}</p>
                      {review.response && (
                        <div className="bg-muted p-4 rounded-lg">
                          <p className="text-sm font-medium mb-1">Your Response:</p>
                          <p className="text-sm">{review.response}</p>
                          <p className="text-xs text-muted-foreground mt-2">
                            Responded on {review.respondedAt && new Date(review.respondedAt).toLocaleDateString()}
                          </p>
                        </div>
                      )}
                    </div>
                    <div>
                      {!review.response && (
                        <Button 
                          size="sm" 
                          onClick={() => {
                            const response = prompt('Enter your response to this review:');
                            if (response) {
                              respondToReview(review.id, response);
                            }
                          }}
                        >
                          <MessageCircle className="h-4 w-4 mr-1" />
                          Respond
                        </Button>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
            {reviews.length === 0 && (
              <div className="text-center py-12">
                <Star className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <p className="text-muted-foreground">No reviews yet.</p>
                <p className="text-sm text-muted-foreground mt-2">
                  Reviews from tenants will appear here after they stay at your properties.
                </p>
              </div>
            )}
          </div>
        </TabsContent>

        {/* Analytics Tab */}
        <TabsContent value="analytics" className="space-y-6">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-2xl font-bold">Performance Analytics</h2>
              <p className="text-muted-foreground">Track your listings performance and earnings</p>
            </div>
          </div>

          {/* Performance Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Views</CardTitle>
                <Eye className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{analytics?.totalViews?.toLocaleString() || '0'}</div>
                <p className="text-xs text-muted-foreground">
                  <TrendingUp className="h-3 w-3 inline mr-1" />
                  +12% from last month
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Booking Rate</CardTitle>
                <BarChart3 className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {(analytics?.totalViews || 0) > 0 
                    ? (((analytics?.totalBookings || 0) / (analytics?.totalViews || 1)) * 100).toFixed(1)
                    : '0'}%
                </div>
                <p className="text-xs text-muted-foreground">
                  {analytics?.totalBookings || 0} bookings from {analytics?.totalViews || 0} views
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Monthly Revenue</CardTitle>
                <DollarSign className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  ৳{analytics?.monthlyData?.[analytics.monthlyData.length - 1]?.revenue?.toLocaleString() || '0'}
                </div>
                <p className="text-xs text-muted-foreground">
                  Current month earnings
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Performance by Listing */}
          <Card>
            <CardHeader>
              <CardTitle>Listing Performance</CardTitle>
              <CardDescription>How your individual listings are performing</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {Array.isArray(listings) && listings.slice(0, 5).map((listing) => (
                  <div key={listing.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center space-x-4">
                      {listing.images.length > 0 ? (
                        <Image
                          src={listing.images[0]}
                          alt={listing.title}
                          width={48}
                          height={48}
                          className="w-12 h-12 rounded object-cover"
                        />
                      ) : (
                        <div className="w-12 h-12 bg-muted rounded flex items-center justify-center">
                          <Building className="h-6 w-6 text-muted-foreground" />
                        </div>
                      )}
                      <div>
                        <h4 className="font-medium">{listing.title || 'Untitled Listing'}</h4>
                        <p className="text-sm text-muted-foreground">{listing.location || 'Location not specified'}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="flex items-center gap-4 text-sm">
                        <div className="text-center">
                          <p className="font-medium">{safeRender(listing.views, 0)}</p>
                          <p className="text-xs text-muted-foreground">Views</p>
                        </div>
                        <div className="text-center">
                          <p className="font-medium">{safeRender(listing.favorites, 0)}</p>
                          <p className="text-xs text-muted-foreground">Saves</p>
                        </div>
                        <div className="text-center">
                          <p className="font-medium">{safeRender(listing.bookings, 0)}</p>
                          <p className="text-xs text-muted-foreground">Bookings</p>
                        </div>
                        <div className="text-center">
                          <p className="font-medium">{listing.rating ? listing.rating.toFixed(1) : 'N/A'}</p>
                          <p className="text-xs text-muted-foreground">Rating</p>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
                {listings.length === 0 && (
                  <p className="text-center text-muted-foreground py-8">
                    No listings to analyze yet.
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}