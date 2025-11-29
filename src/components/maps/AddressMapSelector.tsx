'use client';

import { useState, useCallback } from 'react';
import dynamic from 'next/dynamic';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { MapPin, Search, Crosshair } from 'lucide-react';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';

// Define the LeafletMap props interface
interface LeafletMapProps {
  position: [number, number] | null;
  defaultCenter: [number, number];
  address: string;
  onLocationSelect: (lat: number, lng: number) => void;
}

// Dynamic import for Leaflet map to avoid SSR issues
const LeafletMap = dynamic(
  () => import('@/components/maps/LeafletMap'),
  { 
    ssr: false,
    loading: () => (
      <div className="w-full h-full bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <LoadingSpinner size="lg" />
          <p className="mt-2 text-sm text-gray-600">Loading map...</p>
        </div>
      </div>
    )
  }
) as React.ComponentType<LeafletMapProps>;

interface AddressData {
  address: string;
  latitude: number;
  longitude: number;
  city?: string;
}

interface AddressMapSelectorProps {
  onAddressSelect: (data: AddressData) => void;
  initialAddress?: string;
  initialLatitude?: number;
  initialLongitude?: number;
  className?: string;
}



export default function AddressMapSelector({
  onAddressSelect,
  initialAddress = '',
  initialLatitude,
  initialLongitude,
  className = ''
}: AddressMapSelectorProps) {
  const [position, setPosition] = useState<[number, number] | null>(
    initialLatitude && initialLongitude ? [initialLatitude, initialLongitude] : null
  );
  const [address, setAddress] = useState(initialAddress);
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [isGeolocating, setIsGeolocating] = useState(false);
  const [isReverseGeocoding, setIsReverseGeocoding] = useState(false);

  // Reverse geocoding using Nominatim API
  const reverseGeocode = useCallback(async (lat: number, lng: number) => {
    setIsReverseGeocoding(true);
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&addressdetails=1&limit=1`
      );
      const data = await response.json();
      
      if (data && data.display_name) {
        const newAddress = data.display_name;
        const city = data.address?.city || data.address?.town || data.address?.village || '';
        
        setAddress(newAddress);
        onAddressSelect({
          address: newAddress,
          latitude: lat,
          longitude: lng,
          city: city
        });
      }
    } catch (error) {
      console.error('Reverse geocoding error:', error);
    } finally {
      setIsReverseGeocoding(false);
    }
  }, [onAddressSelect]);



  // Search for address using Nominatim API
  const searchAddress = useCallback(async () => {
    if (!searchQuery.trim()) return;

    setIsSearching(true);
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(searchQuery)}&limit=1&countrycodes=bd&addressdetails=1`
      );
      const data = await response.json();
      
      if (data && data.length > 0) {
        const result = data[0];
        const lat = parseFloat(result.lat);
        const lng = parseFloat(result.lon);
        const newAddress = result.display_name;
        const city = result.address?.city || result.address?.town || result.address?.village || '';
        
        setPosition([lat, lng]);
        setAddress(newAddress);
        onAddressSelect({
          address: newAddress,
          latitude: lat,
          longitude: lng,
          city: city
        });
      } else {
        console.warn('No results found for:', searchQuery);
      }
    } catch (error) {
      console.error('Geocoding error:', error);
    } finally {
      setIsSearching(false);
    }
  }, [searchQuery, onAddressSelect]);

  // Get current location
  const getCurrentLocation = useCallback(() => {
    if (!navigator.geolocation) {
      alert('Geolocation is not supported by this browser.');
      return;
    }

    setIsGeolocating(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const lat = position.coords.latitude;
        const lng = position.coords.longitude;
        setPosition([lat, lng]);
        reverseGeocode(lat, lng);
        setIsGeolocating(false);
      },
      (error) => {
        console.error('Geolocation error:', error);
        setIsGeolocating(false);
        alert('Unable to retrieve your location.');
      },
      { enableHighAccuracy: true, timeout: 5000, maximumAge: 0 }
    );
  }, [reverseGeocode]);



  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      searchAddress();
    }
  };

  return (
    <div className={`space-y-4 ${className}`}>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MapPin className="h-5 w-5" />
            Select Location
          </CardTitle>
          <CardDescription>
            Search for an address or click on the map to set your location
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Address Search */}
          <div className="flex gap-2">
            <div className="flex-1 space-y-2">
              <Label htmlFor="address-search">Search Address</Label>
              <Input
                id="address-search"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="e.g., Dhanmondi, Dhaka"
                disabled={isSearching}
              />
            </div>
            <div className="flex flex-col justify-end gap-2">
              <Button 
                type="button"
                onClick={searchAddress} 
                disabled={isSearching || !searchQuery.trim()}
                size="sm"
              >
                {isSearching ? (
                  <LoadingSpinner size="sm" />
                ) : (
                  <Search className="h-4 w-4" />
                )}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={getCurrentLocation}
                disabled={isGeolocating}
                size="sm"
                title="Use my current location"
              >
                {isGeolocating ? (
                  <LoadingSpinner size="sm" />
                ) : (
                  <Crosshair className="h-4 w-4" />
                )}
              </Button>
            </div>
          </div>

          {/* Selected Address Display */}
          {address && (
            <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <div className="flex items-start gap-2">
                <MapPin className="h-4 w-4 text-blue-600 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-sm font-medium text-blue-900">Selected Address:</p>
                  <p className="text-sm text-blue-700">{address}</p>
                  {position && (
                    <p className="text-xs text-blue-600 mt-1">
                      Coordinates: {position[0].toFixed(6)}, {position[1].toFixed(6)}
                    </p>
                  )}
                </div>
                {isReverseGeocoding && (
                  <LoadingSpinner size="sm" className="ml-auto" />
                )}
              </div>
            </div>
          )}

          {/* Map Container */}
          <div className="relative">
            <div className="w-full h-96 rounded-lg overflow-hidden border">
              <LeafletMap
                position={position}
                defaultCenter={[23.8103, 90.4125]}
                address={address}
                onLocationSelect={(lat: number, lng: number) => {
                  setPosition([lat, lng]);
                  reverseGeocode(lat, lng);
                }}
              />
            </div>
            {position && (
              <div className="mt-3 p-3 bg-green-50 rounded-lg border border-green-200">
                <p className="text-sm font-medium text-green-700 flex items-center gap-2">
                  <MapPin className="h-4 w-4" />
                  Selected: {position[0].toFixed(6)}, {position[1].toFixed(6)}
                </p>
              </div>
            )}
          </div>

          {/* Instructions */}
          <div className="text-sm text-gray-600 bg-gray-50 p-3 rounded-lg">
            <p><strong>How to select your location:</strong></p>
            <ul className="mt-2 space-y-1 list-disc list-inside">
              <li>Search for your area in the search box above</li>
              <li>Click on the crosshair button to use your current location</li>
              <li>Click directly on the map to select a specific location</li>
              <li>The address will be automatically filled based on your selection</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}