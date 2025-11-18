'use client';

import { useSession } from 'next-auth/react';
import { useEffect, useState, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { ListingCard } from '@/components/ui/ListingCard';
import { 
  User, 
  Heart, 
  MessageCircle, 
  Calendar, 
  Star, 
  MapPin,
  Phone,
  Mail,
  Edit,
  Search,
  Filter,
  Bell
} from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import { redirect } from 'next/navigation';
import { useSearchParams } from 'next/navigation';

interface Listing {
  id: string;
  title: string;
  description: string;
  rent: number;
  location: string;
  images: string[];
  amenities: string[];
  roomType: 'SINGLE' | 'SHARED' | 'ENTIRE_APARTMENT';
  isAvailable: boolean;
  availableFrom: string;
  landlord: {
    id: string;
    name: string;
    profilePicture?: string;
  };
  createdAt: string;
  matchScore?: number; // Custom property for dashboard
}

interface BachelorProfile {
  id: string;
  name: string;
  email: string;
  phone?: string;
  university?: string;
  profession?: string;
  monthlyIncome?: number;
  bio?: string;
  profilePicture?: string;
  preferences: {
    maxBudget?: number;
    preferredAreas?: string[];
    requiredAmenities?: string[];
    roomType?: string;
  };
}

interface Booking {
  id: string;
  status: 'PENDING' | 'CONFIRMED' | 'CANCELLED' | 'COMPLETED';
  startDate: string;
  endDate: string;
  totalAmount: number;
  listing: {
    id: string;
    title: string;
    location: string;
    images: string[];
    landlord: {
      name: string;
      phone?: string;
    };
  };
  createdAt: string;
}

interface ChatThread {
  id: string;
  // Real API structure from Prisma
  participants: Array<{
    user: {
      id: string;
      name: string;
    };
  }>;
  messages: Array<{
    content: string;
    createdAt: string;
    sender: {
      user: {
        id: string;
        name: string;
      };
    };
  }>;
  listing?: {
    id: string;
    title: string;
    price: number;
  };
  lastMessageAt: string;
  _count: {
    messages: number;
  };
  // Derived properties for display
  landlordName?: string;
  landlordAvatar?: string;
  lastMessage?: string;
  lastMessageTime?: string;
  unreadCount?: number;
  listingTitle?: string;
}

export default function BachelorDashboard() {
  const { data: session, status } = useSession();
  const searchParams = useSearchParams();
  const [profile, setProfile] = useState<BachelorProfile | null>(null);
  const [recommendations, setRecommendations] = useState<Listing[]>([]);
  const [favorites, setFavorites] = useState<Listing[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [chatThreads, setChatThreads] = useState<ChatThread[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');

  // Transform real API chat data to display format
  const transformChatThreads = (threads: ChatThread[], currentUserId: string): ChatThread[] => {
    return threads.map(thread => {
      // Find the other participant (not current user)
      const otherParticipant = thread.participants?.find(
        (p) => p.user.id !== currentUserId
      );
      
      // Get the last message
      const lastMessage = thread.messages?.[0];
      
      return {
        ...thread,
        landlordName: otherParticipant?.user.name || 'Unknown User',
        landlordAvatar: '',
        lastMessage: lastMessage?.content || 'No messages yet',
        lastMessageTime: lastMessage?.createdAt || thread.lastMessageAt,
        unreadCount: 0, // TODO: Calculate actual unread count
        listingTitle: thread.listing?.title || 'Property Discussion'
      };
    });
  };

  const fetchDashboardData = useCallback(async () => {
    try {
      setIsLoading(true);
      const [profileRes, recommendationsRes, favoritesRes, bookingsRes] = await Promise.all([
        fetch('/api/users/profile'),
        fetch('/api/listings/recommendations'),
        fetch('/api/users/favorites'),
        fetch('/api/bookings')
      ]);

      if (profileRes.ok) {
        const profileData = await profileRes.json();
        setProfile(profileData.data || profileData);
      } else {
        console.error('Failed to fetch profile data');
        setProfile(null);
      }
      if (recommendationsRes.ok) {
        const recommendationsResponse = await recommendationsRes.json();
        const recommendationsData = recommendationsResponse.data || recommendationsResponse;
        setRecommendations(Array.isArray(recommendationsData) ? recommendationsData : []);
      } else {
        console.error('Failed to fetch recommendations');
        setRecommendations([]);
      }
      if (favoritesRes.ok) {
        const favoritesResponse = await favoritesRes.json();
        const favoritesData = favoritesResponse.data || favoritesResponse;
        setFavorites(Array.isArray(favoritesData) ? favoritesData : []);
      } else {
        console.error('Failed to fetch favorites');
        setFavorites([]);
      }
      if (bookingsRes.ok) {
        const bookingsResponse = await bookingsRes.json();
        const bookingsData = bookingsResponse.data || bookingsResponse;
        setBookings(Array.isArray(bookingsData) ? bookingsData : []);
      } else {
        console.error('Failed to fetch bookings');
        setBookings([]);
      }
      // Fetch real chat threads data
      try {
        const chatRes = await fetch('/api/chat/threads');
        if (chatRes.ok) {
          const chatResponse = await chatRes.json();
          const chatData = chatResponse.data || chatResponse;
          if (Array.isArray(chatData) && session?.user?.id) {
            const transformedThreads = transformChatThreads(chatData, session.user.id);
            setChatThreads(transformedThreads);
          } else {
            setChatThreads([]);
          }
        } else {
          console.error('Failed to fetch chat threads');
          setChatThreads([]);
        }
      } catch (error) {
        console.error('Error fetching chat threads:', error);
        setChatThreads([]);
      }
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setIsLoading(false);
    }
  }, [session?.user?.id]);

  useEffect(() => {
    if (status === 'loading') return;
    if (!session || session.user.role !== 'BACHELOR') {
      redirect('/auth/signin');
    }
    fetchDashboardData();

    // Check for tab parameter in URL
    const tabParam = searchParams.get('tab');
    if (tabParam && ['overview', 'recommendations', 'favorites', 'bookings', 'chats'].includes(tabParam)) {
      setActiveTab(tabParam);
    }
  }, [session, status, searchParams, fetchDashboardData]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'CONFIRMED': return 'bg-green-100 text-green-800';
      case 'PENDING': return 'bg-yellow-100 text-yellow-800';
      case 'CANCELLED': return 'bg-red-100 text-red-800';
      case 'COMPLETED': return 'bg-blue-100 text-blue-800';
      default: return 'bg-gray-100 text-gray-800';
    }
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
          <h1 className="text-3xl font-bold">Welcome back, {profile?.name || 'Bachelor'}!</h1>
          <p className="text-muted-foreground mt-1">
            Manage your profile, bookings, and discover new rooms
          </p>
        </div>
        <div className="flex gap-2 mt-4 md:mt-0">
          <Button variant="outline" size="sm">
            <Bell className="h-4 w-4 mr-2" />
            Notifications
          </Button>
          <Link href="/profile/edit">
            <Button size="sm">
              <Edit className="h-4 w-4 mr-2" />
              Edit Profile
            </Button>
          </Link>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <Heart className="h-8 w-8 text-red-500" />
              <div className="ml-4">
                <p className="text-2xl font-bold">{Array.isArray(favorites) ? favorites.length : 0}</p>
                <p className="text-sm text-muted-foreground">Favorites</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <Calendar className="h-8 w-8 text-blue-500" />
              <div className="ml-4">
                <p className="text-2xl font-bold">{bookings.length}</p>
                <p className="text-sm text-muted-foreground">Bookings</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <MessageCircle className="h-8 w-8 text-green-500" />
              <div className="ml-4">
                <p className="text-2xl font-bold">{Array.isArray(chatThreads) ? chatThreads.length : 0}</p>
                <p className="text-sm text-muted-foreground">Active Chats</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <Star className="h-8 w-8 text-yellow-500" />
              <div className="ml-4">
                <p className="text-2xl font-bold">{recommendations.length}</p>
                <p className="text-sm text-muted-foreground">Recommendations</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="recommendations">Recommendations</TabsTrigger>
          <TabsTrigger value="favorites">Favorites</TabsTrigger>
          <TabsTrigger value="bookings">Bookings</TabsTrigger>
          <TabsTrigger value="chats">Messages</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Profile Summary */}
            <Card className="lg:col-span-1">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="h-5 w-5" />
                  Profile
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center space-x-4">
                  <Avatar className="h-16 w-16">
                    <AvatarImage src={profile?.profilePicture} />
                    <AvatarFallback>{profile?.name?.charAt(0)}</AvatarFallback>
                  </Avatar>
                  <div>
                    <h3 className="text-lg font-semibold">{profile?.name}</h3>
                    <p className="text-sm text-muted-foreground">{profile?.profession}</p>
                    {profile?.university && (
                      <p className="text-sm text-muted-foreground">{profile?.university}</p>
                    )}
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
                  {profile?.monthlyIncome && (
                    <div className="flex items-center gap-2">
                      <span className="text-muted-foreground">Budget:</span>
                      <span>৳{(profile.monthlyIncome * 0.3).toLocaleString()}/month</span>
                    </div>
                  )}
                </div>
                <Link href="/profile/edit">
                  <Button className="w-full" variant="outline">
                    <Edit className="h-4 w-4 mr-2" />
                    Update Profile
                  </Button>
                </Link>
              </CardContent>
            </Card>

            {/* Recent Activity */}
            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle>Recent Activity</CardTitle>
                <CardDescription>Your latest interactions and updates</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {Array.isArray(bookings) && bookings.slice(0, 3).map((booking) => (
                    <div key={booking.id} className="flex items-center space-x-4 p-4 border rounded-lg">
                      <div className="flex-1">
                        <div className="flex items-center justify-between">
                          <h4 className="font-medium">{booking.listing.title}</h4>
                          <Badge className={getStatusColor(booking.status)}>
                            {booking.status}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground mt-1">
                          {booking.listing.location}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          ৳{booking.totalAmount ? booking.totalAmount.toLocaleString() : 'N/A'}
                        </p>
                      </div>
                    </div>
                  ))}
                  {(!Array.isArray(bookings) || bookings.length === 0) && (
                    <p className="text-center text-muted-foreground py-8">
                      No recent bookings. Start exploring rooms!
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

          {/* Smart Recommendations Section */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Star className="h-5 w-5 text-yellow-500" />
                    Smart Recommendations
                  </CardTitle>
                  <CardDescription>Personalized room suggestions based on your preferences</CardDescription>
                </div>
                <Link href="/recommendations">
                  <Button size="sm">
                    View All
                  </Button>
                </Link>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {Array.isArray(recommendations) && recommendations.slice(0, 2).map((listing: Listing) => (
                  <div key={listing.id} className="border rounded-lg p-4 hover:shadow-md transition-shadow">
                    <div className="flex items-start justify-between mb-2">
                      <h4 className="font-medium line-clamp-1">{listing.title}</h4>
                      {listing.matchScore && (
                        <Badge variant="secondary" className="ml-2">
                          {Math.round(listing.matchScore)}% match
                        </Badge>
                      )}
                    </div>
                    <div className="flex items-center gap-2 mb-2">
                      <MapPin className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm text-muted-foreground line-clamp-1">{listing.location}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-lg">৳{listing.rent?.toLocaleString()}</span>
                      <Link href={`/listings/${listing.id}`}>
                        <Button size="sm" variant="outline">
                          View Details
                        </Button>
                      </Link>
                    </div>
                  </div>
                ))}
                {recommendations.length === 0 && (
                  <div className="col-span-full text-center py-8">
                    <p className="text-muted-foreground mb-4">
                      Complete your profile to get personalized recommendations
                    </p>
                    <Link href="/recommendations">
                      <Button>
                        Set Preferences
                      </Button>
                    </Link>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Recommendations Tab */}
        <TabsContent value="recommendations" className="space-y-4">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-2xl font-bold">Recommended for You</h2>
              <p className="text-muted-foreground">Rooms matching your preferences and budget</p>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm">
                <Filter className="h-4 w-4 mr-2" />
                Refine
              </Button>
              <Link href="/search">
                <Button size="sm">
                  <Search className="h-4 w-4 mr-2" />
                  Browse All
                </Button>
              </Link>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {Array.isArray(recommendations) && recommendations.map((listing: Listing) => (
              <ListingCard key={listing.id} listing={listing} />
            ))}
            {(!Array.isArray(recommendations) || recommendations.length === 0) && (
              <div className="col-span-full text-center py-12">
                <p className="text-muted-foreground">No recommendations available at the moment.</p>
                <Link href="/profile/edit">
                  <Button className="mt-4">
                    Update Preferences
                  </Button>
                </Link>
              </div>
            )}
          </div>
        </TabsContent>

        {/* Favorites Tab */}
        <TabsContent value="favorites" className="space-y-4">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-2xl font-bold">Saved Rooms</h2>
              <p className="text-muted-foreground">Your favorite listings</p>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {Array.isArray(favorites) && favorites.map((listing: Listing) => (
              <ListingCard key={listing.id} listing={listing} />
            ))}
            {(!Array.isArray(favorites) || favorites.length === 0) && (
              <div className="col-span-full text-center py-12">
                <Heart className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <p className="text-muted-foreground">No saved rooms yet.</p>
                <Link href="/search">
                  <Button className="mt-4">
                    Explore Rooms
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
              <h2 className="text-2xl font-bold">Your Bookings</h2>
              <p className="text-muted-foreground">Manage your room bookings</p>
            </div>
          </div>
          <div className="space-y-4">
            {Array.isArray(bookings) && bookings.map((booking) => (
              <Card key={booking.id}>
                <CardContent className="p-6">
                  <div className="flex flex-col md:flex-row md:items-center md:justify-between">
                    <div className="flex items-center space-x-4">
                      {booking.listing.images.length > 0 && (
                        <Image
                          src={booking.listing.images[0]}
                          alt={booking.listing.title}
                          width={64}
                          height={64}
                          className="w-16 h-16 rounded-lg object-cover"
                        />
                      )}
                      <div>
                        <h3 className="font-semibold">{booking.listing.title}</h3>
                        <p className="text-sm text-muted-foreground">
                          <MapPin className="h-4 w-4 inline mr-1" />
                          {booking.listing.location}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          Landlord: {booking.listing.landlord.name}
                        </p>
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
                        <Link href={`/rooms/${booking.listing.id}`}>
                          <Button size="sm" variant="outline">
                            View Room
                          </Button>
                        </Link>
                        {booking.listing.landlord.phone && (
                          <Button size="sm" variant="outline">
                            <Phone className="h-4 w-4 mr-1" />
                            Contact
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
            {(!Array.isArray(bookings) || bookings.length === 0) && (
              <div className="text-center py-12">
                <Calendar className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <p className="text-muted-foreground">No bookings yet.</p>
                <Link href="/search">
                  <Button className="mt-4">
                    Find Rooms
                  </Button>
                </Link>
              </div>
            )}
          </div>
        </TabsContent>

        {/* Messages Tab */}
        <TabsContent value="chats" className="space-y-4">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-2xl font-bold">Messages</h2>
              <p className="text-muted-foreground">Chat with landlords</p>
            </div>
          </div>
          <div className="space-y-4">
            {Array.isArray(chatThreads) && chatThreads.map((thread) => (
              <Link key={thread.id} href={`/chat/${thread.id}`}>
                <Card className="cursor-pointer hover:shadow-md transition-shadow">
                  <CardContent className="p-4">
                    <div className="flex items-center space-x-4">
                      <Avatar>
                        <AvatarImage src={thread.landlordAvatar} />
                        <AvatarFallback>{thread.landlordName?.charAt(0) || 'L'}</AvatarFallback>
                      </Avatar>
                      <div className="flex-1">
                        <div className="flex items-center justify-between">
                          <h3 className="font-semibold">{thread.landlordName}</h3>
                          <span className="text-sm text-muted-foreground">
                            {thread.lastMessageTime ? 
                              new Date(thread.lastMessageTime).toLocaleDateString('en-US', {
                                month: 'short',
                                day: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit'
                              }) : 'Recently'
                            }
                          </span>
                        </div>
                        <p className="text-sm text-muted-foreground">{thread.listingTitle}</p>
                        <p className="text-sm mt-1 line-clamp-2">{thread.lastMessage}</p>
                      </div>
                      {(thread.unreadCount ?? 0) > 0 && (
                        <Badge variant="destructive" className="ml-2">
                          {thread.unreadCount}
                        </Badge>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
            {(!Array.isArray(chatThreads) || chatThreads.length === 0) && (
              <div className="text-center py-12">
                <MessageCircle className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <p className="text-muted-foreground">No messages yet.</p>
                <p className="text-sm text-muted-foreground mt-2">
                  Start a conversation by contacting a landlord from a room listing.
                </p>
              </div>
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}