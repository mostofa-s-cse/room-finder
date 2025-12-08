'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { RatingStars } from '@/components/ui/RatingStars';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { AmenitiesSelector } from '@/components/ui/AmenitiesSelector';
import { ReviewForm } from '@/components/reviews/ReviewForm';
import { TenantRequestForm } from '@/components/forms/TenantRequestForm';
import { BookingForm } from '@/components/forms/BookingForm';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import dynamic from 'next/dynamic';
import { isAfter, startOfDay, parseISO, format } from 'date-fns';

// Dynamic import for LeafletMap to avoid SSR issues
const LeafletMapDisplay = dynamic(
  () => import('@/components/maps/LeafletMap'),
  { 
    ssr: false,
    loading: () => (
      <div className="w-full h-full bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
          <p className="text-sm text-gray-600">Loading map...</p>
        </div>
      </div>
    )
  }
);
import { Separator } from '@/components/ui/separator';
import { 
  MapPin, 
  Phone, 
  Calendar, 
  Shield,
  Heart,
  Share2,
  MessageCircle,
  Camera,
  ChevronLeft,
  ChevronRight,
  BedDouble,
  Bath,
  Home,
  FileText
} from 'lucide-react';
import Image from 'next/image';
import { cn } from '@/lib/utils';
import { toast } from 'react-hot-toast';

interface Listing {
  id: string;
  title: string;
  description: string;
  price: number;
  city: string;
  address: string;
  lat?: number;
  lng?: number;
  roomType: string;
  images: string[];
  amenities: string[];
  securityDeposit: number;
  isAvailable: boolean;
  availableFrom: string;
  totalBeds: number;
  totalBaths: number;
  area: number;
  avgRating: number;
  reviewCount: number;
  landlord: {
    id: string;
    name: string;
    phone: string;
    email: string;
    avatar?: string;
  };
  reviews: Array<{
    id: string;
    rating: number;
    comment: string;
    createdAt: string;
    reviewer?: {
      id: string;
      name: string;
    } | null;
  }>;
  createdAt: string;
  updatedAt: string;
}

export default function RoomDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const { data: session } = useSession();
  const [listing, setListing] = useState<Listing | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [showRequestForm, setShowRequestForm] = useState(false);
  const [showBookingForm, setShowBookingForm] = useState(false);

  // Check if room is available based on listing flag and availableFrom date
  const isRoomAvailable = () => {
    if (!listing) return false;
    if (listing.isAvailable === false) return false;
    
    // Check if availableFrom date has passed (available now)
    if (listing.availableFrom) {
      try {
        // Parse the availableFrom date
        const availableDate = startOfDay(parseISO(listing.availableFrom));
        const today = startOfDay(new Date());
        
        // Room is available if availableFrom date is today or in the past
        return !isAfter(availableDate, today);
      } catch (error) {
        console.error('Error parsing availableFrom date:', error);
        return true; // Default to available if there's a parsing error
      }
    }
    
    // If no availableFrom date, consider available
    return true;
  };



  const getAvailabilityMessage = () => {
    if (!listing) return 'Not Available';
    if (listing.isAvailable === false) return 'Currently Unavailable';
    
    // Check date availability
    if (listing.availableFrom) {
      try {
        // Parse the availableFrom date
        const availableDate = startOfDay(parseISO(listing.availableFrom));
        const today = startOfDay(new Date());
        
        if (isAfter(availableDate, today)) {
          return `Available from ${format(availableDate, 'MMM dd, yyyy')}`;
        } else {
          return 'Available Now';
        }
      } catch (error) {
        console.error('Error parsing availableFrom date:', error);
        return 'Available Now';
      }
    }
    
    // If no availableFrom date, consider available
    return 'Available Now';
  };

  const getAvailabilityBadgeVariant = () => {
    if (!listing) return 'destructive';
    if (listing.isAvailable === false) return 'destructive';
    
    if (listing.availableFrom) {
      try {
        // Parse the availableFrom date
        const availableDate = startOfDay(parseISO(listing.availableFrom));
        const today = startOfDay(new Date());
        
        if (isAfter(availableDate, today)) {
          return 'secondary'; // Future availability - gray
        } else {
          return 'default'; // Available now - green
        }
      } catch (error) {
        console.error('Error parsing availableFrom date:', error);
        return 'default';
      }
    }
    
    // If no availableFrom date, consider available
    return 'default';
  };

  useEffect(() => {
    const fetchListing = async () => {
      if (!params?.id) return;
      
      setLoading(true);
      setError(null);
      
      try {
        const response = await fetch(`/api/listings/${params?.id}`);
        
        if (!response.ok) {
          if (response.status === 404) {
            throw new Error('Room not found');
          }
          throw new Error('Failed to load room details');
        }

        const data = await response.json();
        setListing(data.data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred');
      } finally {
        setLoading(false);
      }
    };

    fetchListing();
  }, [params?.id]);

  const handleBooking = () => {
    if (!session) {
      router.push('/auth/signin');
      return;
    }

    if (!listing) return;

    if (!isRoomAvailable()) {
      toast.error('This room is not currently available for booking.');
      return;
    }

    // Open the booking form modal
    setShowBookingForm(true);
  };

  const handleBookingSuccess = () => {
    setShowBookingForm(false);
    toast.success('Booking created successfully!');
    
    // Redirect to dashboard or booking confirmation
    router.push('/dashboard/bachelor');
  };

  const handleContact = () => {
    if (!session) {
      router.push('/auth/signin');
      return;
    }
    // Redirect to chat or show contact modal
    router.push(`/chat?landlord=${listing?.landlord.id}`);
  };

  const nextImage = () => {
    if (!listing) return;
    setCurrentImageIndex((prev) => 
      prev === listing.images.length - 1 ? 0 : prev + 1
    );
  };

  const prevImage = () => {
    if (!listing) return;
    setCurrentImageIndex((prev) => 
      prev === 0 ? listing.images.length - 1 : prev - 1
    );
  };

  const handleShare = async () => {
    if (!listing) return;

    const shareData = {
      title: listing.title,
      text: `Check out this amazing room: ${listing.title} - ৳${listing.price ? listing.price.toLocaleString() : 'Contact for price'}/month`,
      url: window.location.href,
    };

    try {
      // Check if Web Share API is supported
      if (navigator.share && /Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)) {
        await navigator.share(shareData);
        toast.success('Room shared successfully!');
      } else {
        // Fallback to clipboard
        await navigator.clipboard.writeText(`${shareData.title}\n${shareData.text}\n${shareData.url}`);
        toast.success('Room link copied to clipboard!');
      }
    } catch (error) {
      console.error('Error sharing:', error);
      
      // Final fallback - try clipboard again
      try {
        await navigator.clipboard.writeText(window.location.href);
        toast.success('Room link copied to clipboard!');
      } catch (clipboardError) {
        console.error('Clipboard error:', clipboardError);
        toast.error('Unable to share. Please copy the URL manually.');
      }
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Error</h1>
          <p className="text-gray-600 mb-6">{error}</p>
          <Button onClick={() => router.back()}>Go Back</Button>
        </div>
      </div>
    );
  }

  if (!listing) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Room Not Found</h1>
          <p className="text-gray-600 mb-6">The room you&apos;re looking for doesn&apos;t exist.</p>
          <Button onClick={() => router.push('/search')}>Browse Rooms</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Back Navigation */}
      <div className="bg-white border-b">
        <div className="container mx-auto px-4 py-4">
          <Button variant="ghost" onClick={() => router.back()} className="mb-2">
            <ChevronLeft className="h-4 w-4 mr-2" />
            Back to listings
          </Button>
        </div>
      </div>

      <div className="container mx-auto px-4 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Image Gallery */}
            <Card className="overflow-hidden">
              <div className="relative">
                {listing.images.length > 0 ? (
                  <div className="relative h-96 md:h-[500px]">
                    <Image
                      src={listing.images[currentImageIndex]}
                      alt={`${listing.title} - Image ${currentImageIndex + 1}`}
                      fill
                      className="object-cover"
                    />
                    
                    {listing.images.length > 1 && (
                      <>
                        <Button
                          variant="secondary"
                          size="icon"
                          className="absolute left-4 top-1/2 transform -translate-y-1/2 bg-white/80 hover:bg-white"
                          onClick={prevImage}
                        >
                          <ChevronLeft className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="secondary"
                          size="icon"
                          className="absolute right-4 top-1/2 transform -translate-y-1/2 bg-white/80 hover:bg-white"
                          onClick={nextImage}
                        >
                          <ChevronRight className="h-4 w-4" />
                        </Button>
                        
                        <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2">
                          <div className="flex space-x-2">
                            {listing.images.map((_, index) => (
                              <button
                                key={index}
                                onClick={() => setCurrentImageIndex(index)}
                                className={cn(
                                  'w-2 h-2 rounded-full',
                                  index === currentImageIndex ? 'bg-white' : 'bg-white/50'
                                )}
                              />
                            ))}
                          </div>
                        </div>
                      </>
                    )}
                    
                    <div className="absolute top-4 right-4 flex space-x-2">
                      <Button 
                        size="icon" 
                        variant="secondary" 
                        className="bg-white/80 hover:bg-white"
                        onClick={handleShare}
                      >
                        <Share2 className="h-4 w-4" />
                      </Button>
                      <Button size="icon" variant="secondary" className="bg-white/80 hover:bg-white">
                        <Heart className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="h-96 md:h-[500px] flex items-center justify-center bg-gray-200">
                    <Camera className="h-12 w-12 text-gray-400" />
                  </div>
                )}
              </div>
            </Card>

            {/* Title and Basic Info */}
            <Card>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="text-2xl md:text-3xl">{listing.title}</CardTitle>
                    <CardDescription className="flex items-center mt-2">
                      <MapPin className="h-4 w-4 mr-1" />
                      {listing.address}, {listing.city}
                    </CardDescription>
                  </div>
                  
                  <div className="text-right">
                    <div className="text-2xl md:text-3xl font-bold text-blue-600">
                      ৳{listing.price ? listing.price.toLocaleString() : 'Contact for price'}
                      <span className="text-sm text-gray-600 font-normal">/month</span>
                    </div>
                    {listing.avgRating > 0 && (
                      <div className="flex items-center mt-2">
                        <RatingStars rating={listing.avgRating} size="sm" />
                        <span className="ml-2 text-sm text-gray-600">
                          ({listing.reviewCount} reviews)
                        </span>
                      </div>
                    )}
                  </div>
                </div>
                
                <div className="flex flex-wrap gap-2 mt-4">
                  <Badge variant="secondary">{listing.roomType}</Badge>
                  <Badge variant={getAvailabilityBadgeVariant()}>
                    {getAvailabilityMessage()}
                  </Badge>
                </div>
              </CardHeader>
              
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                  <div className="flex items-center">
                    <BedDouble className="h-5 w-5 text-gray-600 mr-2" />
                    <span className="text-sm">{listing.totalBeds} Beds</span>
                  </div>
                  <div className="flex items-center">
                    <Bath className="h-5 w-5 text-gray-600 mr-2" />
                    <span className="text-sm">{listing.totalBaths} Baths</span>
                  </div>
                  <div className="flex items-center">
                    <Home className="h-5 w-5 text-gray-600 mr-2" />
                    <span className="text-sm">{listing.area} sqft</span>
                  </div>
                  <div className="flex items-center">
                    <Calendar className="h-5 w-5 text-gray-600 mr-2" />
                    <span className="text-sm">
                      Available from {new Date(listing.availableFrom).toLocaleDateString()}
                    </span>
                  </div>
                </div>
                
                <Separator className="my-6" />
                
                <div>
                  <h3 className="text-lg font-semibold mb-3">Description</h3>
                  <p className="text-gray-700 leading-relaxed">{listing.description}</p>
                </div>
              </CardContent>
            </Card>

            {/* Amenities */}
            <Card>
              <CardHeader>
                <CardTitle>Amenities</CardTitle>
              </CardHeader>
              <CardContent>
                <AmenitiesSelector 
                  selectedAmenities={listing.amenities}
                  onAmenitiesChange={() => {}}
                />
              </CardContent>
            </Card>

            {/* Location */}
            <Card>
              <CardHeader>
                <CardTitle>Location</CardTitle>
                <CardDescription>{listing.address}, {listing.city}</CardDescription>
              </CardHeader>
              <CardContent>
                {listing.lat && listing.lng ? (
                  <div className="h-64 rounded-lg overflow-hidden">
                    <LeafletMapDisplay
                      position={[listing.lat, listing.lng]}
                      defaultCenter={[listing.lat, listing.lng]}
                      address={`${listing.title} - ${listing.address}, ${listing.city}`}
                      onLocationSelect={() => {}} // Read-only map, no interaction needed
                    />
                  </div>
                ) : (
                  <div className="h-64 rounded-lg bg-gray-100 flex items-center justify-center border-2 border-dashed border-gray-300">
                    <div className="text-center">
                      <MapPin className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                      <p className="text-sm text-gray-600 font-medium">Location coordinates not available</p>
                      <p className="text-xs text-gray-500 mt-1">
                        Address: {listing.address}, {listing.city}
                      </p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Reviews */}
            <Card>
              <CardHeader>
                <CardTitle>Reviews ({listing.reviewCount || 0})</CardTitle>
              </CardHeader>
              <CardContent>
                {listing.reviews.length > 0 ? (
                  <div className="space-y-4">
                    {Array.isArray(listing.reviews) && listing.reviews.slice(0, 5).map((review) => (
                      <div key={review.id} className="border-b pb-4">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center">
                            <Avatar className="h-8 w-8 mr-3">
                              <AvatarFallback>
                                {review.reviewer?.name?.charAt(0)?.toUpperCase() || 'U'}
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <p className="font-medium text-sm">{review.reviewer?.name || 'Anonymous'}</p>
                              <p className="text-xs text-gray-600">
                                {new Date(review.createdAt).toLocaleDateString()}
                              </p>
                            </div>
                          </div>
                          <RatingStars rating={review.rating} size="sm" />
                        </div>
                        <p className="text-gray-700 text-sm">{review.comment}</p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-500 text-center py-8">No reviews yet. Be the first to review!</p>
                )}
              </CardContent>
            </Card>

            {/* Review Form */}
            <ReviewForm 
              listingId={listing.id}
              onReviewSubmitted={() => {
                // Refresh the page to show the new review and updated rating
                window.location.reload();
              }}
            />
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Booking Card */}
            <Card className="sticky top-6">
              <CardHeader>
                <CardTitle className="text-lg">Book This Room</CardTitle>
                <CardDescription>
                  Security Deposit: {listing.securityDeposit ? `৳${listing.securityDeposit.toLocaleString()}` : 'Contact for details'}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <Button 
                    onClick={handleBooking}
                    disabled={!isRoomAvailable()}
                    className="w-full"
                    size="lg"
                    variant={!isRoomAvailable() ? "secondary" : "default"}
                  >
                    <Calendar className="mr-2 h-4 w-4" />
                    {getAvailabilityMessage()}
                  </Button>
                  
                  {/* Show helpful message when unavailable */}
                  {!isRoomAvailable() && (
                    <div className="text-sm text-gray-600 bg-gray-50 p-3 rounded-md">
                      {listing.isAvailable === false ? (
                        <p>This room is currently unavailable. You can contact the landlord or send a tenant request to be notified.</p>
                      ) : (
                        <p>This room will be available from {new Date(listing.availableFrom).toLocaleDateString()}. You can contact the landlord or send a tenant request in advance.</p>
                      )}
                    </div>
                  )}
                  
                  <Button 
                    variant="outline" 
                    onClick={handleContact}
                    className="w-full"
                    size="lg"
                  >
                    <MessageCircle className="mr-2 h-4 w-4" />
                    Contact Landlord
                  </Button>
                  
                  <Button 
                    variant="secondary" 
                    onClick={() => setShowRequestForm(true)}
                    className="w-full"
                    size="lg"
                  >
                    <FileText className="mr-2 h-4 w-4" />
                    Send Tenant Request
                  </Button>
                </div>
                
                <div className="text-xs text-gray-600 text-center">
                  <Shield className="h-4 w-4 inline mr-1" />
                  Secure booking with verified landlords
                </div>
              </CardContent>
            </Card>

            {/* Landlord Info */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Landlord</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center space-x-3 mb-4">
                  <Avatar>
                    <AvatarImage src={listing.landlord.avatar} />
                    <AvatarFallback>
                      {listing.landlord.name?.charAt(0)?.toUpperCase() || 'L'}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-medium">{listing.landlord.name}</p>
                    <p className="text-sm text-gray-600">Verified Landlord</p>
                  </div>
                </div>
                
                <div className="space-y-2 text-sm">
                  <div className="flex items-center">
                    <Phone className="h-4 w-4 mr-2 text-gray-600" />
                    <span>{listing.landlord.phone}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
      
      {/* Tenant Request Dialog */}
      <Dialog open={showRequestForm} onOpenChange={setShowRequestForm}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Send Tenant Request</DialogTitle>
          </DialogHeader>
          {listing && (
            <TenantRequestForm
              listing={{
                id: listing.id,
                title: listing.title,
                address: listing.address,
                price: listing.price,
                images: listing.images,
                landlord: {
                  name: listing.landlord.name,
                },
              }}
              onSuccess={() => {
                setShowRequestForm(false);
                toast.success('Tenant request submitted successfully!');
              }}
              onCancel={() => setShowRequestForm(false)}
            />
          )}
        </DialogContent>
      </Dialog>

      {/* Booking Dialog */}
      <Dialog open={showBookingForm} onOpenChange={setShowBookingForm}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Book {listing?.title}</DialogTitle>
          </DialogHeader>
          {listing && (
            <BookingForm
              listing={{
                id: listing.id,
                title: listing.title,
                price: listing.price,
                securityDeposit: listing.securityDeposit,
                availableFrom: listing.availableFrom,
                isAvailable: listing.isAvailable,
              }}
              onBookingSuccess={handleBookingSuccess}
              onCancel={() => setShowBookingForm(false)}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}