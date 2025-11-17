'use client';

import { useState, useCallback, useMemo } from 'react';
import { MapComponent } from './MapComponent';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { MapLocation, MapMarker } from '@/lib/maps/types';
import { DistanceCalculator, HeatmapGenerator } from '@/lib/maps/utils';
import { MapPin, Eye, Heart, Navigation, TrendingUp } from 'lucide-react';
import { formatPrice } from '@/utils/helpers';
import Link from 'next/link';
import Image from 'next/image';

interface Listing extends Record<string, unknown> {
  id: string;
  title: string;
  description: string;
  rent: number;
  location: string;
  latitude: number;
  longitude: number;
  images: string[];
  amenities: string[];
  roomType: 'SINGLE' | 'SHARED' | 'ENTIRE_APARTMENT';
  isAvailable: boolean;
  availableFrom: string;
  avgRating?: number;
  landlord: {
    id: string;
    name: string;
    profilePicture?: string;
  };
  createdAt: string;
  distance?: number;
}

interface ListingMapProps {
  listings: Listing[];
  center?: MapLocation;
  zoom?: number;
  height?: string;
  className?: string;
  showHeatmap?: boolean;
  userLocation?: MapLocation;
  onListingSelect?: (listing: Listing) => void;
  selectedListingId?: string;
}

export function ListingMap({
  listings,
  center,
  zoom = 12,
  height = '500px',
  className = '',
  showHeatmap = false,
  userLocation,
  onListingSelect,
  selectedListingId
}: ListingMapProps) {
  const [selectedListing, setSelectedListing] = useState<Listing | null>(null);
  const [showDistance, setShowDistance] = useState(false);

  // Convert listings to map markers
  const markers: MapMarker[] = useMemo(() => {
    const listingMarkers = listings.map(listing => ({
      id: listing.id,
      position: { lat: listing.latitude, lng: listing.longitude },
      title: listing.title,
      description: `${formatPrice(listing.rent)}/month • ${listing.roomType.replace('_', ' ')}`,
      type: 'listing' as const,
      data: listing
    }));

    // Add user location marker if provided
    if (userLocation) {
      listingMarkers.push({
        id: 'user-location',
        position: userLocation,
        title: 'Your Location',
        description: 'Current location',
        type: 'listing' as const,
        data: {
          id: 'user-location',
          title: 'Your Location',
          description: 'Current location',
          rent: 0,
          location: 'Current location',
          latitude: userLocation.lat,
          longitude: userLocation.lng,
          images: [],
          amenities: [],
          roomType: 'SINGLE' as const,
          isAvailable: false,
          availableFrom: '',
          landlord: { id: '', name: '' },
          createdAt: '',
          isUser: true
        } as Listing
      });
    }

    return listingMarkers;
  }, [listings, userLocation]);

  // Generate heatmap data
  const heatmapData = useMemo(() => {
    if (!showHeatmap) return [];
    
    return HeatmapGenerator.generateListingHeatmap(
      listings.map(listing => ({
        location: { lat: listing.latitude, lng: listing.longitude },
        rent: listing.rent
      }))
    );
  }, [listings, showHeatmap]);

  // Calculate map center
  const mapCenter = useMemo(() => {
    if (center) return center;
    if (listings.length === 0) return { lat: 23.8103, lng: 90.4125 }; // Dhaka default
    
    const bounds = DistanceCalculator.calculateBounds(
      listings.map(listing => ({ lat: listing.latitude, lng: listing.longitude }))
    );
    
    return {
      lat: (bounds.north + bounds.south) / 2,
      lng: (bounds.east + bounds.west) / 2
    };
  }, [center, listings]);

  // Calculate distances if user location is available
  const listingsWithDistance = useMemo(() => {
    if (!userLocation) return listings;
    
    return DistanceCalculator.calculateDistancesToPoints(
      userLocation,
      listings.map(listing => ({
        id: listing.id,
        location: { lat: listing.latitude, lng: listing.longitude }
      }))
    ).map(item => {
      const listing = listings.find(l => l.id === item.id)!;
      return { ...listing, distance: item.distance };
    });
  }, [listings, userLocation]);

  const handleMarkerClick = useCallback((marker: MapMarker) => {
    if (marker.type === 'listing' && marker.data && !('isUser' in marker.data)) {
      setSelectedListing(marker.data as unknown as Listing);
      onListingSelect?.(marker.data as unknown as Listing);
    }
  }, [onListingSelect]);

  const handleListingCardClick = useCallback((listing: Listing) => {
    setSelectedListing(listing);
    onListingSelect?.(listing);
  }, [onListingSelect]);

  const getRoomTypeColor = (roomType: string) => {
    switch (roomType) {
      case 'SINGLE': return 'bg-blue-100 text-blue-800';
      case 'SHARED': return 'bg-green-100 text-green-800';
      case 'ENTIRE_APARTMENT': return 'bg-purple-100 text-purple-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className={`flex flex-col lg:flex-row gap-4 ${className}`}>
      {/* Map */}
      <div className="flex-1">
        <MapComponent
          center={mapCenter}
          zoom={zoom}
          height={height}
          markers={markers}
          showHeatmap={showHeatmap}
          heatmapData={heatmapData}
          onMarkerClick={handleMarkerClick}
          showControls={true}
        />
        
        {/* Map Controls */}
        <div className="flex items-center justify-between mt-2">
          <div className="flex items-center space-x-2 text-sm text-muted-foreground">
            <MapPin className="w-4 h-4" />
            <span>{listings.length} listings shown</span>
          </div>
          
          <div className="flex items-center space-x-2">
            {userLocation && (
              <Button
                size="sm"
                variant={showDistance ? "default" : "outline"}
                onClick={() => setShowDistance(!showDistance)}
              >
                <Navigation className="w-4 h-4 mr-1" />
                Distance
              </Button>
            )}
            
            <Button
              size="sm"
              variant={showHeatmap ? "default" : "outline"}
              onClick={() => {}}
            >
              <TrendingUp className="w-4 h-4 mr-1" />
              Heatmap
            </Button>
          </div>
        </div>
      </div>

      {/* Listings Panel */}
      <div className="lg:w-80 space-y-2">
        <div className="sticky top-4 max-h-[calc(100vh-2rem)] overflow-y-auto space-y-2">
          {selectedListing && (
            <Card className="border-primary">
              <CardHeader className="pb-2">
                <div className="flex items-start justify-between">
                  <CardTitle className="text-lg">{selectedListing.title}</CardTitle>
                  <Button size="sm" variant="ghost" onClick={() => setSelectedListing(null)}>
                    ×
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                {selectedListing.images[0] && (
                  <div className="relative h-32 rounded-md overflow-hidden">
                    <Image
                      src={selectedListing.images[0]}
                      alt={selectedListing.title}
                      fill
                      className="object-cover"
                    />
                  </div>
                )}
                
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-2xl font-bold text-primary">
                      {formatPrice(selectedListing.rent)}
                    </span>
                    <Badge className={getRoomTypeColor(selectedListing.roomType)}>
                      {selectedListing.roomType.replace('_', ' ')}
                    </Badge>
                  </div>
                  
                  <p className="text-sm text-muted-foreground line-clamp-2">
                    {selectedListing.description}
                  </p>
                  
                  <div className="flex items-center text-sm text-muted-foreground">
                    <MapPin className="w-4 h-4 mr-1" />
                    <span>{selectedListing.location}</span>
                  </div>
                  
                  {showDistance && userLocation && (
                    <div className="flex items-center text-sm text-muted-foreground">
                      <Navigation className="w-4 h-4 mr-1" />
                      <span>
                        {DistanceCalculator.calculateDistance(
                          userLocation,
                          { lat: selectedListing.latitude, lng: selectedListing.longitude }
                        ).toFixed(1)} km away
                      </span>
                    </div>
                  )}
                  
                  <div className="flex items-center space-x-2 pt-2">
                    <Button asChild size="sm" className="flex-1">
                      <Link href={`/rooms/${selectedListing.id}`}>
                        <Eye className="w-4 h-4 mr-1" />
                        View
                      </Link>
                    </Button>
                    <Button size="sm" variant="outline">
                      <Heart className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
          
          {/* Listings List */}
          <div className="space-y-2">
            {(showDistance ? listingsWithDistance : listings)
              .slice(0, selectedListing ? 5 : 10)
              .map((listing) => {
                const isSelected = selectedListingId === listing.id || selectedListing?.id === listing.id;
                
                return (
                  <Card 
                    key={listing.id} 
                    className={`cursor-pointer transition-colors hover:bg-muted/50 ${
                      isSelected ? 'border-primary bg-primary/5' : ''
                    }`}
                    onClick={() => handleListingCardClick(listing)}
                  >
                    <CardContent className="p-3">
                      <div className="flex items-start space-x-3">
                        {listing.images[0] && (
                          <div className="relative w-16 h-16 rounded-md overflow-hidden flex-shrink-0">
                            <Image
                              src={listing.images[0]}
                              alt={listing.title}
                              fill
                              className="object-cover"
                            />
                          </div>
                        )}
                        
                        <div className="flex-1 min-w-0">
                          <h4 className="font-medium text-sm truncate">{listing.title}</h4>
                          <p className="text-xs text-muted-foreground truncate">
                            {listing.location}
                          </p>
                          <div className="flex items-center justify-between mt-1">
                            <span className="font-semibold text-primary">
                              {formatPrice(listing.rent)}
                            </span>
                            {listing.distance && (
                              <span className="text-xs text-muted-foreground">
                                {listing.distance.toFixed(1)} km
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
          </div>
        </div>
      </div>
    </div>
  );
}