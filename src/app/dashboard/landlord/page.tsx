'use client';

import { useSession } from 'next-auth/react';
import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { ListingCard } from '@/components/ui/ListingCard';
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
  Mail
} from 'lucide-react';
import Link from 'next/link';
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
  rent: number;
  images: string[];
  isAvailable: boolean;
  roomType: string;
  views: number;
  favorites: number;
  bookings: number;
  rating: number;
  createdAt: string;
}

interface Booking {
  id: string;
  status: 'PENDING' | 'CONFIRMED' | 'CANCELLED' | 'COMPLETED';
  startDate: string;
  endDate: string;
  totalAmount: number;
  bachelor: {
    name: string;
    phone?: string;
    email: string;
    profilePicture?: string;
  };
  listing: {
    id: string;
    title: string;
    location: string;
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

export default function LandlordDashboard() {
  const { data: session, status } = useSession();
  const [profile, setProfile] = useState<LandlordProfile | null>(null);
  const [listings, setListings] = useState<Listing[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [analytics, setAnalytics] = useState<Analytics | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    if (status === 'loading') return;
    if (!session || session.user.role !== 'LANDLORD') {
      redirect('/auth/signin');
    }
    fetchDashboardData();
  }, [session, status]);

  const fetchDashboardData = async () => {
    try {
      setIsLoading(true);
      const [profileRes, listingsRes, bookingsRes, analyticsRes] = await Promise.all([
        fetch('/api/users/profile'),
        fetch('/api/listings/my-listings'),
        fetch('/api/bookings/landlord'),
        fetch('/api/analytics/landlord')
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
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setIsLoading(false);
    }
  };

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
      <div className="container mx-auto py-8">
        <LoadingSpinner size="lg" text="Loading your dashboard..." />
      </div>
    );
  }

  return (
    <div className="container mx-auto py-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold">Landlord Dashboard</h1>
          <p className="text-muted-foreground mt-1">
            Manage your listings, bookings, and track your performance
          </p>
        </div>
        <div className="flex gap-2 mt-4 md:mt-0">
          <Link href="/dashboard/landlord/listings/new">
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Add Listing
            </Button>
          </Link>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <Building className="h-8 w-8 text-blue-500" />
              <div className="ml-4">
                <p className="text-2xl font-bold">{listings.length}</p>
                <p className="text-sm text-muted-foreground">Total Listings</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <Calendar className="h-8 w-8 text-green-500" />
              <div className="ml-4">
                <p className="text-2xl font-bold">{bookings.length}</p>
                <p className="text-sm text-muted-foreground">Active Bookings</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <DollarSign className="h-8 w-8 text-yellow-500" />
              <div className="ml-4">
                <p className="text-2xl font-bold">
                  ৳{analytics?.totalRevenue?.toLocaleString() || '0'}
                </p>
                <p className="text-sm text-muted-foreground">Total Revenue</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <Star className="h-8 w-8 text-purple-500" />
              <div className="ml-4">
                <p className="text-2xl font-bold">
                  {analytics?.averageRating?.toFixed(1) || '0.0'}
                </p>
                <p className="text-sm text-muted-foreground">Avg Rating</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="listings">My Listings</TabsTrigger>
          <TabsTrigger value="bookings">Bookings</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>

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
                        <AvatarImage src={booking.bachelor.profilePicture} />
                        <AvatarFallback>{booking.bachelor.name?.charAt(0) || 'B'}</AvatarFallback>
                      </Avatar>
                      <div className="flex-1">
                        <div className="flex items-center justify-between">
                          <h4 className="font-medium">{booking.bachelor.name}</h4>
                          <Badge className={getStatusColor(booking.status)}>
                            {booking.status}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground">
                          {booking.listing.title}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          ৳{booking.totalAmount ? booking.totalAmount.toLocaleString() : 'N/A'}
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
                      <img
                        src={listing.images[0]}
                        alt={listing.title}
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
                      <h3 className="font-semibold line-clamp-1">{listing.title}</h3>
                      <p className="text-sm text-muted-foreground flex items-center gap-1">
                        <MapPin className="h-3 w-3" />
                        {listing.location}
                      </p>
                    </div>
                    <div className="flex justify-between items-center">
                      <div className="text-lg font-bold">৳{listing.rent ? listing.rent.toLocaleString() : 'N/A'}</div>
                      <Badge variant="outline">{listing.roomType}</Badge>
                    </div>
                    <div className="grid grid-cols-3 gap-2 text-center text-sm">
                      <div>
                        <p className="font-medium">{listing.views}</p>
                        <p className="text-xs text-muted-foreground">Views</p>
                      </div>
                      <div>
                        <p className="font-medium">{listing.favorites}</p>
                        <p className="text-xs text-muted-foreground">Favorites</p>
                      </div>
                      <div>
                        <p className="font-medium">{listing.bookings}</p>
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
                        <AvatarImage src={booking.bachelor.profilePicture} />
                        <AvatarFallback>{booking.bachelor.name?.charAt(0) || 'B'}</AvatarFallback>
                      </Avatar>
                      <div>
                        <h3 className="font-semibold">{booking.bachelor.name}</h3>
                        <p className="text-sm text-muted-foreground">
                          {booking.listing.title}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {booking.listing.location}
                        </p>
                        <div className="flex items-center gap-2 mt-1">
                          <Mail className="h-3 w-3" />
                          <span className="text-xs">{booking.bachelor.email}</span>
                        </div>
                      </div>
                    </div>
                    <div className="mt-4 md:mt-0 text-right">
                      <Badge className={getStatusColor(booking.status)}>
                        {booking.status}
                      </Badge>
                      <p className="text-lg font-semibold mt-2">
                        ৳{booking.totalAmount ? booking.totalAmount.toLocaleString() : 'N/A'}
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
                        {booking.bachelor.phone && (
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
                        <img
                          src={listing.images[0]}
                          alt={listing.title}
                          className="w-12 h-12 rounded object-cover"
                        />
                      ) : (
                        <div className="w-12 h-12 bg-muted rounded flex items-center justify-center">
                          <Building className="h-6 w-6 text-muted-foreground" />
                        </div>
                      )}
                      <div>
                        <h4 className="font-medium">{listing.title}</h4>
                        <p className="text-sm text-muted-foreground">{listing.location}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="flex items-center gap-4 text-sm">
                        <div className="text-center">
                          <p className="font-medium">{listing.views}</p>
                          <p className="text-xs text-muted-foreground">Views</p>
                        </div>
                        <div className="text-center">
                          <p className="font-medium">{listing.favorites}</p>
                          <p className="text-xs text-muted-foreground">Saves</p>
                        </div>
                        <div className="text-center">
                          <p className="font-medium">{listing.bookings}</p>
                          <p className="text-xs text-muted-foreground">Bookings</p>
                        </div>
                        <div className="text-center">
                          <p className="font-medium">{listing.rating.toFixed(1)}</p>
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
  );
}