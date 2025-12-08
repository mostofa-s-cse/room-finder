'use client';

import { useState, useEffect, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Slider } from '@/components/ui/slider';
import { Checkbox } from '@/components/ui/checkbox';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { useRecommendations, useRecommendationPreferences } from '@/hooks/useRecommendations';
import { useFavorites } from '@/hooks/useFavorites';
import { MapLocation } from '@/lib/maps/types';
import { DEFAULT_PRIORITY_WEIGHTS } from '@/lib/recommendations/types';
import {
  Target, 
  MapPin, 
  TrendingUp, 
  Star, 
  DollarSign, 
  Navigation,
  Sliders,
  RefreshCw,
  Heart,
  Eye,
  CheckCircle,
  AlertCircle,
  Info
} from 'lucide-react';
import { cn } from '@/lib/utils';
import Image from 'next/image';
import Link from 'next/link';

const COMMON_AMENITIES = [
  'WiFi', 'AC', 'Heating', 'Kitchen', 'Laundry', 'Parking',
  'Security', 'Furnished', 'Balcony', 'Gym', 'Pool', 'Garden'
];

export default function RecommendationsPage() {
  const { data: session } = useSession();
  const {
    recommendations,
    loading,
    error,
    meta,
    generateRecommendations,
    quickRecommendations,
    quickLoading,
    getQuickRecommendations
  } = useRecommendations();
  
  const { isFavorited, toggleFavorite, loading: favoritesLoading } = useFavorites();
  
  const {
    updatePreferences,
    savePreferences,
    loadPreferences
  } = useRecommendationPreferences();

  const [workLocation] = useState<(MapLocation & { address: string }) | null>(null);
  const [selectedAmenities, setSelectedAmenities] = useState<string[]>([]);
  const [roomTypes, setRoomTypes] = useState<('SINGLE' | 'SHARED' | 'ENTIRE_APARTMENT')[]>([]);
  const [maxDistance, setMaxDistance] = useState([25]);
  const [budgetFlexibility, setBudgetFlexibility] = useState([10]);
  const [priorityWeights, setPriorityWeights] = useState(DEFAULT_PRIORITY_WEIGHTS);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [userProfile, setUserProfile] = useState<{ income?: number; affordablePrice?: number } | null>(null);
  const [profileLoading, setProfileLoading] = useState(true);
  const [userBookings, setUserBookings] = useState<string[]>([]);
  const [listingAvailability, setListingAvailability] = useState<Record<string, { isAvailable: boolean; reason: string }>>({});

  useEffect(() => {
    const loadUserData = async () => {
      try {
        setProfileLoading(true);
        const response = await fetch('/api/users/profile');
        if (response.ok) {
          const data = await response.json();
          setUserProfile(data.data || data);
        }
      } catch (error) {
        console.error('Failed to load user profile:', error);
      } finally {
        setProfileLoading(false);
      }
    };

    const loadUserBookings = async () => {
      try {
        const bookingResponse = await fetch('/api/bookings?limit=100');
        if (bookingResponse.ok) {
          const bookingData = await bookingResponse.json();
          const bookings = bookingData.data || [];
          const bookedListingIds = bookings
            .filter((booking: { status: string }) => booking.status === 'PENDING' || booking.status === 'CONFIRMED')
            .map((booking: { listing: { id: string } }) => booking.listing.id);
          setUserBookings(bookedListingIds);
        }
      } catch (error) {
        console.error('Failed to load user bookings:', error);
      }
    };

    if (session) {
      loadUserData();
      loadUserBookings();
      loadPreferences();
      getQuickRecommendations({ limit: 6 });
    }
  }, [session, loadPreferences, getQuickRecommendations]);

  // Fetch availability when quick recommendations load
  useEffect(() => {
    if (quickRecommendations.length > 0) {
      const listingIds = quickRecommendations.map(listing => listing.id);
      fetchListingAvailability(listingIds);
    }
  }, [quickRecommendations]);

  // Fetch availability when recommendations load
  useEffect(() => {
    if (recommendations.length > 0) {
      const listingIds = recommendations.map(result => result.listing.id);
      fetchListingAvailability(listingIds);
    }
  }, [recommendations]);

  // Note: Preferences will be loaded manually when user changes them

  const handleGenerateRecommendations = useCallback(async () => {
    const options = {
      workLocation: workLocation || undefined,
      preferredAmenities: selectedAmenities,
      preferredRoomTypes: roomTypes,
      maxDistance: maxDistance[0],
      budgetFlexibility: budgetFlexibility[0] / 100,
      priorityWeights,
      maxResults: 20
    };

    // Save preferences
    updatePreferences(options);
    await savePreferences();

    // Generate recommendations
    await generateRecommendations(options);
  }, [
    workLocation, 
    selectedAmenities, 
    roomTypes, 
    maxDistance, 
    budgetFlexibility, 
    priorityWeights,
    updatePreferences,
    savePreferences,
    generateRecommendations
  ]);

  const handleAmenityToggle = (amenity: string) => {
    setSelectedAmenities(prev => 
      prev.includes(amenity)
        ? prev.filter(a => a !== amenity)
        : [...prev, amenity]
    );
  };

  const handleRoomTypeToggle = (roomType: 'SINGLE' | 'SHARED' | 'ENTIRE_APARTMENT') => {
    setRoomTypes(prev => 
      prev.includes(roomType)
        ? prev.filter(t => t !== roomType)
        : [...prev, roomType]
    );
  };

  const getBudgetFitColor = (budgetFit: string) => {
    switch (budgetFit) {
      case 'excellent': return 'bg-green-100 text-green-800';
      case 'good': return 'bg-blue-100 text-blue-800';
      case 'fair': return 'bg-yellow-100 text-yellow-800';
      case 'poor': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 0.8) return 'text-green-600';
    if (score >= 0.6) return 'text-blue-600';
    if (score >= 0.4) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getAvailabilityBadge = (listingId: string) => {
    const availability = listingAvailability[listingId];
    
    if (availability?.isAvailable === false) {
      return { label: 'Not Available', color: 'bg-red-600' };
    }
    
    if (userBookings.includes(listingId)) {
      return { label: 'Already Booked', color: 'bg-purple-600' };
    }
    
    return { label: 'Available', color: 'bg-green-600' };
  };

  const fetchListingAvailability = async (listingIds: string[]) => {
    const availabilityMap: Record<string, { isAvailable: boolean; reason: string }> = {};
    
    for (const id of listingIds) {
      try {
        const response = await fetch(`/api/listings/${id}/availability`);
        if (response.ok) {
          const result = await response.json();
          availabilityMap[id] = {
            isAvailable: result.data.isAvailable,
            reason: result.data.reason
          };
        }
      } catch (error) {
        console.error(`Failed to fetch availability for listing ${id}:`, error);
      }
    }
    
    setListingAvailability(availabilityMap);
  };

  if (!session) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="text-center py-8">
            <Target className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
            <h2 className="text-xl font-semibold mb-2">Sign In Required</h2>
            <p className="text-muted-foreground mb-4">
              Please sign in to get personalized room recommendations.
            </p>
            <Button asChild>
              <Link href="/auth/signin">Sign In</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Room Recommendations
          </h1>
          <p className="text-gray-600">
            Get personalized room suggestions based on your preferences and budget.
          </p>
        </div>

        <Tabs defaultValue="quick" className="space-y-6">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="quick" className="flex items-center space-x-2">
              <TrendingUp className="w-4 h-4" />
              <span>Quick Recommendations</span>
            </TabsTrigger>
            <TabsTrigger value="advanced" className="flex items-center space-x-2">
              <Target className="w-4 h-4" />
              <span>Advanced Matching</span>
            </TabsTrigger>
          </TabsList>

          {/* Quick Recommendations Tab */}
          <TabsContent value="quick" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <TrendingUp className="w-5 h-5" />
                  <span>Quick Picks for You</span>
                </CardTitle>
                <p className="text-sm text-muted-foreground">
                  Based on your budget and highly-rated listings.
                </p>
              </CardHeader>
              <CardContent>
                {quickLoading ? (
                  <div className="flex justify-center py-12">
                    <LoadingSpinner />
                  </div>
                ) : quickRecommendations.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {quickRecommendations.map((listing) => {
                      return (
                        <div key={listing.id} className="relative">
                          <Card className="h-full">
                            <CardContent className="p-4 space-y-3">
                              {/* Image */}
                              <div className="relative aspect-video bg-muted rounded-lg overflow-hidden">
                                {listing.images && listing.images.length > 0 ? (
                                  <Image
                                    src={listing.images[0]}
                                    alt={listing.title}
                                    fill
                                    className="object-cover"
                                  />
                                ) : (
                                  <div className="flex items-center justify-center h-full bg-gray-200">
                                    <MapPin className="w-8 h-8 text-gray-400" />
                                  </div>
                                )}
                                
                                {/* Availability Badge */}
                                <div className="absolute top-2 left-2">
                                  <Badge className={`${getAvailabilityBadge(listing.id).color} text-white`}>
                                    {getAvailabilityBadge(listing.id).label}
                                  </Badge>
                                </div>
                              </div>
                              
                              <div>
                                <h3 className="font-semibold mb-1">{listing.title}</h3>
                                <p className="text-sm text-muted-foreground line-clamp-2">
                                  {listing.description}
                                </p>
                              </div>
                              
                              <div className="space-y-2">
                                <div className="flex items-center justify-between">
                                  <span className="text-lg font-bold text-primary">
                                    ৳{listing.price.toLocaleString()}/month
                                  </span>
                                  <Badge className={getBudgetFitColor(listing.budgetFit)}>
                                    {listing.budgetFit}
                                  </Badge>
                                </div>
                                
                                <div className="flex items-center text-sm text-muted-foreground">
                                  <MapPin className="w-4 h-4 mr-1" />
                                  <span className="line-clamp-1">{listing.city}</span>
                                </div>
                                
                                <div className="flex items-center justify-between text-sm">
                                  <div className="flex items-center">
                                    <Star className="w-4 h-4 mr-1 text-yellow-500" />
                                    <span>{listing.ratingAvg.toFixed(1)} ({listing.ratingCount})</span>
                                  </div>
                                  <span className="font-medium text-primary">
                                    {listing.matchPercentage}% match
                                  </span>
                                </div>
                              </div>
                              
                              <div className="flex space-x-2 pt-2">
                                <Button asChild size="sm" className="flex-1">
                                  <Link href={`/rooms/${listing.id}`}>
                                    <Eye className="w-4 h-4 mr-1" />
                                    View
                                  </Link>
                                </Button>
                                <Button 
                                  size="sm" 
                                  variant={isFavorited(listing.id) ? 'default' : 'outline'}
                                  disabled={favoritesLoading}
                                  onClick={() => toggleFavorite(listing.id)}
                                >
                                  <Heart className={cn('w-4 h-4', isFavorited(listing.id) ? 'fill-current' : '')} />
                                </Button>
                              </div>
                            </CardContent>
                          </Card>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <Target className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                    <h3 className="text-lg font-medium mb-2">No recommendations yet</h3>
                    <p className="text-muted-foreground mb-4">
                      Complete your profile to get personalized recommendations.
                    </p>
                    <Button asChild>
                      <Link href="/profile/edit">Complete Profile</Link>
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Advanced Matching Tab */}
          <TabsContent value="advanced" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Preferences Form */}
              <div className="lg:col-span-1 space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center space-x-2">
                      <Sliders className="w-5 h-5" />
                      <span>Your Preferences</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    {/* Work Location */}
                    <div className="space-y-2">
                      <Label>Work Location (Optional)</Label>
                      <div className="text-xs text-muted-foreground">
                        Location picker will be available when maps are configured.
                      </div>
                      {workLocation && (
                        <div className="text-xs text-muted-foreground">
                          📍 {workLocation.address}
                        </div>
                      )}
                    </div>

                    {/* Room Type Preferences */}
                    <div className="space-y-3">
                      <Label>Preferred Room Types</Label>
                      <div className="flex flex-col space-y-2">
                        {(['SINGLE', 'SHARED', 'ENTIRE_APARTMENT'] as const).map(type => (
                          <div key={type} className="flex items-center space-x-2">
                            <Checkbox
                              id={type}
                              checked={roomTypes.includes(type)}
                              onCheckedChange={() => handleRoomTypeToggle(type)}
                            />
                            <Label htmlFor={type} className="text-sm">
                              {type === 'SINGLE' ? 'Single Room' : type === 'SHARED' ? 'Shared Room' : 'Entire Apartment'}
                            </Label>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Amenities */}
                    <div className="space-y-3">
                      <Label>Preferred Amenities</Label>
                      <div className="grid grid-cols-2 gap-2">
                        {COMMON_AMENITIES.map(amenity => (
                          <div key={amenity} className="flex items-center space-x-2">
                            <Checkbox
                              id={amenity}
                              checked={selectedAmenities.includes(amenity)}
                              onCheckedChange={() => handleAmenityToggle(amenity)}
                            />
                            <Label htmlFor={amenity} className="text-xs">
                              {amenity}
                            </Label>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Distance */}
                    <div className="space-y-3">
                      <Label>Maximum Distance: {maxDistance[0]}km</Label>
                      <Slider
                        value={maxDistance}
                        onValueChange={setMaxDistance}
                        max={50}
                        min={1}
                        step={1}
                        className="w-full"
                      />
                    </div>

                    {/* Budget Flexibility */}
                    <div className="space-y-3">
                      <Label>Budget Flexibility: +{budgetFlexibility[0]}%</Label>
                      <Slider
                        value={budgetFlexibility}
                        onValueChange={setBudgetFlexibility}
                        max={50}
                        min={0}
                        step={5}
                        className="w-full"
                      />
                    </div>

                    {/* Advanced Settings */}
                    <div className="space-y-3">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setShowAdvanced(!showAdvanced)}
                        className="w-full"
                      >
                        <Sliders className="w-4 h-4 mr-2" />
                        {showAdvanced ? 'Hide' : 'Show'} Priority Weights
                      </Button>
                      
                      {showAdvanced && (
                        <div className="space-y-4 p-4 bg-muted rounded-lg">
                          <div className="text-sm text-muted-foreground">
                            Adjust how important each factor is in recommendations:
                          </div>
                          
                          {Object.entries(priorityWeights).map(([key, value]) => (
                            <div key={key} className="space-y-2">
                              <Label className="text-xs capitalize">
                                {key}: {Math.round(value * 100)}%
                              </Label>
                              <Slider
                                value={[value]}
                                onValueChange={([newValue]) => 
                                  setPriorityWeights(prev => ({ ...prev, [key]: newValue }))
                                }
                                max={1}
                                min={0}
                                step={0.05}
                                className="w-full"
                              />
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Profile Completeness Check */}
                    {!profileLoading && userProfile && (!userProfile.income && !userProfile.affordablePrice) && (
                      <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg space-y-2">
                        <div className="flex items-center space-x-2 text-yellow-800">
                          <AlertCircle className="w-4 h-4" />
                          <span className="text-sm font-medium">Profile Incomplete</span>
                        </div>
                        <p className="text-xs text-yellow-700">
                          Please set your income or affordable price range in your profile to get better recommendations.
                        </p>
                        <Button asChild size="sm" variant="outline" className="w-full">
                          <Link href="/profile/edit">Complete Profile</Link>
                        </Button>
                      </div>
                    )}

                    {/* Generate Button */}
                    <Button 
                      onClick={handleGenerateRecommendations}
                      disabled={loading || profileLoading}
                      className="w-full"
                    >
                      {loading ? (
                        <>
                          <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                          Generating...
                        </>
                      ) : (
                        <>
                          <Target className="w-4 h-4 mr-2" />
                          Get Recommendations
                        </>
                      )}
                    </Button>
                  </CardContent>
                </Card>
              </div>

              {/* Results */}
              <div className="lg:col-span-2 space-y-4">
                {error && (
                  <Card className="border-red-200 bg-red-50">
                    <CardContent className="pt-6">
                      <div className="flex items-center space-x-2 text-red-600">
                        <AlertCircle className="w-5 h-5" />
                        <span>{error}</span>
                      </div>
                    </CardContent>
                  </Card>
                )}

                {meta && (
                  <Card>
                    <CardContent className="pt-6">
                      <div className="flex items-center justify-between text-sm text-muted-foreground">
                        <span>Found {meta.recommendationsCount} recommendations from {meta.totalListings} listings</span>
                        <span>Average score: {(meta.averageScore * 100).toFixed(0)}%</span>
                      </div>
                    </CardContent>
                  </Card>
                )}

                {loading ? (
                  <div className="flex justify-center py-12">
                    <LoadingSpinner />
                  </div>
                ) : recommendations.length > 0 ? (
                  <div className="space-y-4">
                    {recommendations.map((result) => (
                      <Card key={result.listing.id} className="hover:shadow-md transition-shadow">
                        <CardContent className="p-6">
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            {/* Listing Info */}
                            <div className="md:col-span-2 space-y-3">
                              <div className="flex items-start justify-between gap-2">
                                <h3 className="text-lg font-semibold">{result.listing.title}</h3>
                                <div className="flex gap-2">
                                  <Badge className={cn(
                                    'ml-2 whitespace-nowrap',
                                    getScoreColor(result.score.totalScore)
                                  )}>
                                    {result.matchPercentage}% match
                                  </Badge>
                                  <Badge className={`${getAvailabilityBadge(result.listing.id).color} text-white whitespace-nowrap`}>
                                    {getAvailabilityBadge(result.listing.id).label}
                                  </Badge>
                                </div>
                              </div>
                              
                              <p className="text-muted-foreground text-sm line-clamp-2">
                                {result.listing.description}
                              </p>
                              
                              <div className="flex items-center space-x-4 text-sm">
                                <div className="flex items-center">
                                  <DollarSign className="w-4 h-4 mr-1" />
                                  <span className="font-semibold">৳{result.listing.price.toLocaleString()}</span>
                                </div>
                                
                                {result.distance && (
                                  <div className="flex items-center">
                                    <Navigation className="w-4 h-4 mr-1" />
                                    <span>{result.distance.toFixed(1)}km</span>
                                  </div>
                                )}
                                
                                <div className="flex items-center">
                                  <Star className="w-4 h-4 mr-1 text-yellow-500" />
                                  <span>{result.listing.ratingAvg.toFixed(1)}</span>
                                </div>
                                
                                <Badge className={getBudgetFitColor(result.budgetFit)}>
                                  {result.budgetFit} budget fit
                                </Badge>
                              </div>
                              
                              {/* Explanation */}
                              <div className="space-y-1">
                                {result.score.explanation.map((explanation, index) => (
                                  <div key={index} className="text-xs text-muted-foreground flex items-start space-x-1">
                                    <Info className="w-3 h-3 mt-0.5 flex-shrink-0" />
                                    <span>{explanation}</span>
                                  </div>
                                ))}
                              </div>
                            </div>
                            
                            {/* Score Breakdown */}
                            <div className="space-y-3">
                              <div className="text-sm font-medium">Score Breakdown</div>
                              
                              <div className="space-y-2">
                                {[
                                  { label: 'Budget', score: result.score.budgetScore, icon: DollarSign },
                                  { label: 'Distance', score: result.score.distanceScore, icon: Navigation },
                                  { label: 'Amenities', score: result.score.amenitiesScore, icon: CheckCircle },
                                  { label: 'Rating', score: result.score.ratingScore, icon: Star }
                                ].map(({ label, score, icon: Icon }) => (
                                  <div key={label} className="flex items-center justify-between text-xs">
                                    <div className="flex items-center space-x-1">
                                      <Icon className="w-3 h-3" />
                                      <span>{label}</span>
                                    </div>
                                    <div className="flex items-center space-x-2">
                                      <div className="w-16 bg-gray-200 rounded-full h-1.5">
                                        <div 
                                          className="bg-primary h-1.5 rounded-full" 
                                          style={{ width: `${score * 100}%` }}
                                        />
                                      </div>
                                      <span className={getScoreColor(score)}>
                                        {Math.round(score * 100)}%
                                      </span>
                                    </div>
                                  </div>
                                ))}
                              </div>
                              
                              <div className="flex space-x-2 pt-2">
                                <Button asChild size="sm" className="flex-1">
                                  <Link href={`/rooms/${result.listing.id}`}>
                                    <Eye className="w-4 h-4 mr-1" />
                                    View
                                  </Link>
                                </Button>
                                <Button 
                                  size="sm" 
                                  variant={isFavorited(result.listing.id) ? 'default' : 'outline'}
                                  disabled={favoritesLoading}
                                  onClick={() => toggleFavorite(result.listing.id)}
                                >
                                  <Heart className={cn('w-4 h-4', isFavorited(result.listing.id) ? 'fill-current' : '')} />
                                </Button>
                              </div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                ) : !loading && recommendations.length === 0 && meta ? (
                  <Card>
                    <CardContent className="text-center py-12">
                      <Target className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                      <h3 className="text-lg font-medium mb-2">No matches found</h3>
                      <p className="text-muted-foreground mb-4">
                        Found {meta.totalListings} total listings, but none matched your criteria.
                        Try adjusting your preferences or increasing budget flexibility.
                      </p>
                      {userProfile && (
                        <div className="text-xs text-muted-foreground mb-4 space-y-1">
                          <div>Budget: {userProfile.affordablePrice ? `৳${userProfile.affordablePrice.toLocaleString()}` : 'Not set'}</div>
                          <div>Income: {userProfile.income ? `৳${userProfile.income.toLocaleString()}` : 'Not set'}</div>
                          <div>Selected amenities: {selectedAmenities.length > 0 ? selectedAmenities.join(', ') : 'None'}</div>
                          <div>Room types: {roomTypes.length > 0 ? roomTypes.join(', ') : 'Any'}</div>
                        </div>
                      )}
                      <Button onClick={handleGenerateRecommendations}>
                        <RefreshCw className="w-4 h-4 mr-2" />
                        Try Again
                      </Button>
                    </CardContent>
                  </Card>
                ) : !loading && recommendations.length === 0 && !meta ? (
                  <Card>
                    <CardContent className="text-center py-12">
                      <Target className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                      <h3 className="text-lg font-medium mb-2">Get Started</h3>
                      <p className="text-muted-foreground mb-4">
                        Click &quot;Get Recommendations&quot; to find rooms that match your preferences.
                      </p>
                    </CardContent>
                  </Card>
                ) : null}
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}