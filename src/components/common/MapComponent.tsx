'use client';

import { useEffect, useRef, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
  MapPin,
  ZoomIn,
  ZoomOut,
  Locate,
  AlertCircle,
} from 'lucide-react';
import { cn } from '@/utils/helpers';

interface Location {
  lat: number;
  lng: number;
  address?: string;
  name?: string;
}

interface Marker {
  id: string;
  location: Location;
  title?: string;
  description?: string;
  price?: number;
  type?: 'listing' | 'user' | 'poi';
  featured?: boolean;
}

interface MapComponentProps {
  center?: Location;
  zoom?: number;
  markers?: Marker[];
  selectedMarkerId?: string;
  onMarkerClick?: (marker: Marker) => void;
  onLocationSelect?: (location: Location) => void;
  showSearch?: boolean;
  showControls?: boolean;
  showCurrentLocation?: boolean;
  interactive?: boolean;
  height?: string;
  className?: string;
}

// Mock map implementation (replace with real map library like Leaflet or Google Maps)
export function MapComponent({
  center = { lat: 23.8103, lng: 90.4125 }, // Dhaka, Bangladesh
  zoom = 12,
  markers = [],
  selectedMarkerId,
  onMarkerClick,
  onLocationSelect,
  showSearch = true,
  showControls = true,
  showCurrentLocation = true,
  interactive = true,
  height = '400px',
  className,
}: MapComponentProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const [currentZoom, setCurrentZoom] = useState(zoom);
  const [currentCenter, setCurrentCenter] = useState(center);
  const [searchQuery, setSearchQuery] = useState('');
  const [userLocation, setUserLocation] = useState<Location | null>(null);
  const [isLoadingLocation, setIsLoadingLocation] = useState(false);
  const [mapError, setMapError] = useState<string | null>(null);

  // Get user's current location
  const getCurrentLocation = () => {
    if (!navigator.geolocation) {
      setMapError('Geolocation is not supported by this browser');
      return;
    }

    setIsLoadingLocation(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const location: Location = {
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        };
        setUserLocation(location);
        setCurrentCenter(location);
        setIsLoadingLocation(false);
      },
      (error) => {
        console.error('Error getting location:', error);
        setMapError('Unable to get your location');
        setIsLoadingLocation(false);
      },
      {
        enableHighAccuracy: true,
        timeout: 5000,
        maximumAge: 0,
      }
    );
  };

  // Mock search function (replace with real geocoding API)
  const searchLocation = async (query: string) => {
    if (!query.trim()) return;

    try {
      // Mock search results for Dhaka areas
      const mockResults = [
        { lat: 23.8103, lng: 90.4125, address: 'Dhaka, Bangladesh' },
        { lat: 23.7465, lng: 90.3755, address: 'Dhanmondi, Dhaka' },
        { lat: 23.7808, lng: 90.4108, address: 'Gulshan, Dhaka' },
        { lat: 23.8093, lng: 90.3944, address: 'Mirpur, Dhaka' },
        { lat: 23.7286, lng: 90.3854, address: 'Old Dhaka' },
      ];

      const result = mockResults.find((r) =>
        r.address.toLowerCase().includes(query.toLowerCase())
      );

      if (result) {
        setCurrentCenter(result);
        setCurrentZoom(15);
        if (onLocationSelect) {
          onLocationSelect(result);
        }
      }
    } catch (error) {
      console.error('Search error:', error);
      setMapError('Unable to search location');
    }
  };

  const zoomIn = () => {
    setCurrentZoom((prev) => Math.min(prev + 1, 20));
  };

  const zoomOut = () => {
    setCurrentZoom((prev) => Math.max(prev - 1, 1));
  };

  const handleMapClick = (event: React.MouseEvent<HTMLDivElement>) => {
    if (!interactive || !onLocationSelect) return;

    const rect = mapRef.current?.getBoundingClientRect();
    if (!rect) return;

    // Mock coordinate calculation (replace with real map library)
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;
    
    // Convert pixel coordinates to lat/lng (simplified calculation)
    const lat = currentCenter.lat + (rect.height / 2 - y) * 0.0001;
    const lng = currentCenter.lng + (x - rect.width / 2) * 0.0001;

    const location: Location = { lat, lng };
    onLocationSelect(location);
  };

  useEffect(() => {
    // Initialize map (in real implementation, this would set up the map library)
    // Map initialization would happen here
  }, []);

  return (
    <div className={cn('relative', className)}>
      {/* Map Container */}
      <Card className="overflow-hidden">
        <div className="relative">
          {/* Search Bar */}
          {showSearch && (
            <div className="absolute top-4 left-4 right-4 z-10">
              <div className="flex space-x-2">
                <div className="relative flex-1">
                  <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search for a location..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && searchLocation(searchQuery)}
                    className="pl-10 bg-background/95 backdrop-blur"
                  />
                </div>
                <Button
                  onClick={() => searchLocation(searchQuery)}
                  size="sm"
                  className="bg-background/95 backdrop-blur"
                >
                  Search
                </Button>
              </div>
            </div>
          )}

          {/* Map Display */}
          <div
            ref={mapRef}
            style={{ height }}
            className={cn(
              'relative bg-muted rounded-lg overflow-hidden',
              interactive && 'cursor-crosshair'
            )}
            onClick={handleMapClick}
          >
            {/* Mock Map Background */}
            <div className="absolute inset-0 bg-gradient-to-br from-green-100 to-blue-100">
              {/* Grid Pattern */}
              <div className="absolute inset-0 opacity-20">
                <div className="grid grid-cols-8 grid-rows-8 h-full w-full">
                  {Array.from({ length: 64 }).map((_, i) => (
                    <div key={i} className="border border-gray-300" />
                  ))}
                </div>
              </div>

              {/* Center Indicator */}
              <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
                <div className="w-4 h-4 bg-primary rounded-full border-2 border-white shadow-lg" />
              </div>

              {/* Markers */}
              {markers.map((marker) => {
                const isSelected = marker.id === selectedMarkerId;
                const offsetX = (marker.location.lng - currentCenter.lng) * 1000;
                const offsetY = (currentCenter.lat - marker.location.lat) * 1000;

                return (
                  <div
                    key={marker.id}
                    className={cn(
                      'absolute transform -translate-x-1/2 -translate-y-1/2 cursor-pointer transition-all',
                      isSelected && 'scale-125 z-10'
                    )}
                    style={{
                      left: `calc(50% + ${offsetX}px)`,
                      top: `calc(50% + ${offsetY}px)`,
                    }}
                    onClick={(e) => {
                      e.stopPropagation();
                      if (onMarkerClick) {
                        onMarkerClick(marker);
                      }
                    }}
                  >
                    {/* Marker Pin */}
                    <div
                      className={cn(
                        'relative',
                        marker.type === 'listing' && 'text-primary',
                        marker.type === 'user' && 'text-blue-500',
                        marker.type === 'poi' && 'text-orange-500'
                      )}
                    >
                      <MapPin className="h-6 w-6 fill-current" />
                      
                      {/* Price Badge for Listings */}
                      {marker.price && marker.type === 'listing' && (
                        <Badge
                          className="absolute -top-8 left-1/2 transform -translate-x-1/2 text-xs"
                          variant={marker.featured ? 'default' : 'secondary'}
                        >
                          ৳{marker.price.toLocaleString()}
                        </Badge>
                      )}
                    </div>

                    {/* Marker Info */}
                    {isSelected && (marker.title || marker.description) && (
                      <Card className="absolute top-8 left-1/2 transform -translate-x-1/2 min-w-[200px] z-20">
                        <CardContent className="p-3">
                          {marker.title && (
                            <h4 className="font-medium text-sm">{marker.title}</h4>
                          )}
                          {marker.description && (
                            <p className="text-xs text-muted-foreground mt-1">
                              {marker.description}
                            </p>
                          )}
                          {marker.price && (
                            <div className="mt-2 flex items-center justify-between">
                              <span className="font-semibold text-primary">
                                ৳{marker.price.toLocaleString()}/month
                              </span>
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    )}
                  </div>
                );
              })}

              {/* User Location */}
              {userLocation && (
                <div
                  className="absolute transform -translate-x-1/2 -translate-y-1/2"
                  style={{
                    left: `calc(50% + ${(userLocation.lng - currentCenter.lng) * 1000}px)`,
                    top: `calc(50% + ${(currentCenter.lat - userLocation.lat) * 1000}px)`,
                  }}
                >
                  <div className="relative">
                    <div className="w-4 h-4 bg-blue-500 rounded-full border-2 border-white shadow-lg animate-pulse" />
                    <div className="absolute inset-0 w-4 h-4 bg-blue-500 rounded-full animate-ping opacity-75" />
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Map Controls */}
          {showControls && (
            <div className="absolute bottom-4 right-4 z-10 flex flex-col space-y-2">
              <Button
                variant="secondary"
                size="sm"
                onClick={zoomIn}
                className="w-10 h-10 p-0 bg-background/95 backdrop-blur"
              >
                <ZoomIn className="h-4 w-4" />
              </Button>
              
              <Button
                variant="secondary"
                size="sm"
                onClick={zoomOut}
                className="w-10 h-10 p-0 bg-background/95 backdrop-blur"
              >
                <ZoomOut className="h-4 w-4" />
              </Button>

              {showCurrentLocation && (
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={getCurrentLocation}
                  disabled={isLoadingLocation}
                  className="w-10 h-10 p-0 bg-background/95 backdrop-blur"
                >
                  {isLoadingLocation ? (
                    <div className="animate-spin rounded-full h-4 w-4 border-2 border-primary border-t-transparent" />
                  ) : (
                    <Locate className="h-4 w-4" />
                  )}
                </Button>
              )}
            </div>
          )}

          {/* Zoom Level Indicator */}
          <div className="absolute bottom-4 left-4 z-10">
            <Badge variant="secondary" className="bg-background/95 backdrop-blur">
              Zoom: {currentZoom}
            </Badge>
          </div>

          {/* Error Message */}
          {mapError && (
            <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-20">
              <Card className="bg-destructive/10 border-destructive">
                <CardContent className="flex items-center space-x-2 p-4">
                  <AlertCircle className="h-4 w-4 text-destructive" />
                  <span className="text-sm text-destructive">{mapError}</span>
                </CardContent>
              </Card>
            </div>
          )}
        </div>
      </Card>

      {/* Map Legend */}
      <div className="mt-4 flex flex-wrap gap-4 text-xs text-muted-foreground">
        <div className="flex items-center space-x-1">
          <MapPin className="h-4 w-4 text-primary" />
          <span>Available Rooms</span>
        </div>
        <div className="flex items-center space-x-1">
          <MapPin className="h-4 w-4 text-blue-500" />
          <span>Your Location</span>
        </div>
        <div className="flex items-center space-x-1">
          <MapPin className="h-4 w-4 text-orange-500" />
          <span>Points of Interest</span>
        </div>
      </div>
    </div>
  );
}