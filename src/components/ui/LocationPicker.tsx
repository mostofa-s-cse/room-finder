'use client';

import { useState, useCallback } from 'react';
import { MapComponent } from './MapComponent';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { MapLocation } from '@/lib/maps/types';
import { useGeolocation, useGeocoding, useMapSearch } from '@/hooks/useMap';
import { MapPin, Navigation, Search, X, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface LocationPickerProps {
  onLocationSelect: (location: MapLocation & { address?: string }) => void;
  initialLocation?: MapLocation;
  initialAddress?: string;
  className?: string;
  height?: string;
  showCurrentLocation?: boolean;
  showSearch?: boolean;
  placeholder?: string;
}

export function LocationPicker({
  onLocationSelect,
  initialLocation,
  initialAddress,
  className = '',
  height = '400px',
  showCurrentLocation = true,
  showSearch = true,
  placeholder = 'Search for a location...'
}: LocationPickerProps) {
  const [selectedLocation, setSelectedLocation] = useState<MapLocation | null>(initialLocation || null);
  const [selectedAddress, setSelectedAddress] = useState<string>(initialAddress || '');
  const [searchQuery, setSearchQuery] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(false);

  const { location: currentLocation, getCurrentLocation, loading: geoLoading } = useGeolocation();
  const { reverseGeocode, loading: geocodeLoading } = useGeocoding();
  const { suggestions, searchLocations, clearSuggestions, loading: searchLoading } = useMapSearch();

  const handleMapClick = useCallback(async (location: MapLocation) => {
    setSelectedLocation(location);
    
    // Get address for the selected location
    try {
      const address = await reverseGeocode(location);
      if (address) {
        setSelectedAddress(address);
        onLocationSelect({ ...location, address });
      } else {
        onLocationSelect(location);
      }
    } catch (error) {
      console.error('Reverse geocoding failed:', error);
      onLocationSelect(location);
    }
  }, [reverseGeocode, onLocationSelect]);

  const handleCurrentLocation = useCallback(() => {
    getCurrentLocation();
  }, [getCurrentLocation]);

  const handleSearchChange = useCallback(async (value: string) => {
    setSearchQuery(value);
    
    if (value.trim()) {
      setShowSuggestions(true);
      await searchLocations(value);
    } else {
      setShowSuggestions(false);
      clearSuggestions();
    }
  }, [searchLocations, clearSuggestions]);

  const handleSuggestionSelect = useCallback((suggestion: { location: MapLocation; address: string }) => {
    setSelectedLocation(suggestion.location);
    setSelectedAddress(suggestion.address);
    setSearchQuery(suggestion.address);
    setShowSuggestions(false);
    onLocationSelect({ ...suggestion.location, address: suggestion.address });
  }, [onLocationSelect]);

  const handleClearSelection = useCallback(() => {
    setSelectedLocation(null);
    setSelectedAddress('');
    setSearchQuery('');
    setShowSuggestions(false);
    clearSuggestions();
  }, [clearSuggestions]);



  const markers = selectedLocation ? [{
    id: 'selected-location',
    position: selectedLocation,
    title: 'Selected Location',
    description: selectedAddress || 'Click to select this location',
    type: 'poi' as const
  }] : [];

  const mapCenter = selectedLocation || currentLocation || { lat: 23.8103, lng: 90.4125 };

  return (
    <Card className={cn('relative', className)}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">Select Location</CardTitle>
          {selectedLocation && (
            <Button size="sm" variant="ghost" onClick={handleClearSelection}>
              <X className="w-4 h-4" />
            </Button>
          )}
        </div>
        
        {showSearch && (
          <div className="relative">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder={placeholder}
                value={searchQuery}
                onChange={(e) => handleSearchChange(e.target.value)}
                className="pl-10 pr-4"
              />
              {searchLoading && (
                <Loader2 className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 animate-spin" />
              )}
            </div>
            
            {/* Search Suggestions */}
            {showSuggestions && suggestions.length > 0 && (
              <Card className="absolute top-full left-0 right-0 z-50 mt-1 max-h-48 overflow-y-auto">
                <CardContent className="p-0">
                  {suggestions.map((suggestion, index) => (
                    <button
                      key={index}
                      className="w-full text-left p-3 hover:bg-muted transition-colors border-b last:border-b-0"
                      onClick={() => handleSuggestionSelect(suggestion)}
                    >
                      <div className="flex items-start space-x-2">
                        <MapPin className="w-4 h-4 mt-0.5 text-muted-foreground flex-shrink-0" />
                        <div className="min-w-0">
                          <p className="text-sm font-medium truncate">
                            {suggestion.address}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {suggestion.location.lat.toFixed(4)}, {suggestion.location.lng.toFixed(4)}
                          </p>
                        </div>
                      </div>
                    </button>
                  ))}
                </CardContent>
              </Card>
            )}
          </div>
        )}
        
        {showCurrentLocation && (
          <div className="flex items-center space-x-2">
            <Button
              size="sm"
              variant="outline"
              onClick={handleCurrentLocation}
              disabled={geoLoading}
            >
              {geoLoading ? (
                <Loader2 className="w-4 h-4 animate-spin mr-1" />
              ) : (
                <Navigation className="w-4 h-4 mr-1" />
              )}
              Use Current Location
            </Button>
            
            {currentLocation && (
              <Badge variant="secondary" className="text-xs">
                Location Available
              </Badge>
            )}
          </div>
        )}
      </CardHeader>
      
      <CardContent className="p-0">
        <MapComponent
          center={mapCenter}
          zoom={selectedLocation ? 15 : 12}
          height={height}
          markers={markers}
          onMapClick={handleMapClick}
          interactive={true}
          showControls={true}
        />
        
        {/* Selected Location Info */}
        {selectedLocation && (
          <div className="p-4 border-t bg-muted/50">
            <div className="space-y-2">
              <div className="flex items-start space-x-2">
                <MapPin className="w-4 h-4 mt-0.5 text-primary" />
                <div className="flex-1 min-w-0">
                  {selectedAddress && (
                    <p className="text-sm font-medium">{selectedAddress}</p>
                  )}
                  <p className="text-xs text-muted-foreground">
                    Coordinates: {selectedLocation.lat.toFixed(6)}, {selectedLocation.lng.toFixed(6)}
                  </p>
                </div>
              </div>
              
              {geocodeLoading && (
                <div className="flex items-center space-x-2 text-xs text-muted-foreground">
                  <Loader2 className="w-3 h-3 animate-spin" />
                  <span>Getting address...</span>
                </div>
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}