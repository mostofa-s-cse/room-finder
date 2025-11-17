'use client';

import { useState, useCallback } from 'react';
import { MapLocation } from '@/lib/maps/types';

interface GeolocationState {
  location: MapLocation | null;
  error: string | null;
  loading: boolean;
}

interface GeocodingResult {
  address: string;
  location: MapLocation;
}

interface DistanceResult {
  distance: number;
  straightLineDistance: number;
  routeDistance?: number;
  duration?: number;
  route?: MapLocation[];
}

export function useGeolocation() {
  const [state, setState] = useState<GeolocationState>({
    location: null,
    error: null,
    loading: false
  });

  const getCurrentLocation = useCallback(() => {
    if (!navigator.geolocation) {
      setState(prev => ({ ...prev, error: 'Geolocation not supported', loading: false }));
      return;
    }

    setState(prev => ({ ...prev, loading: true, error: null }));

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setState({
          location: {
            lat: position.coords.latitude,
            lng: position.coords.longitude
          },
          error: null,
          loading: false
        });
      },
      (error) => {
        let errorMessage = 'Failed to get location';
        switch (error.code) {
          case error.PERMISSION_DENIED:
            errorMessage = 'Location access denied';
            break;
          case error.POSITION_UNAVAILABLE:
            errorMessage = 'Location information unavailable';
            break;
          case error.TIMEOUT:
            errorMessage = 'Location request timeout';
            break;
        }
        setState(prev => ({ ...prev, error: errorMessage, loading: false }));
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 300000 // 5 minutes
      }
    );
  }, []);

  return {
    ...state,
    getCurrentLocation
  };
}

export function useGeocoding() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const geocodeAddress = useCallback(async (address: string): Promise<GeocodingResult | null> => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/maps/geocode?address=${encodeURIComponent(address)}`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Geocoding failed');
      }

      return data.data;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Geocoding failed';
      setError(errorMessage);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  const reverseGeocode = useCallback(async (location: MapLocation): Promise<string | null> => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/maps/reverse-geocode?lat=${location.lat}&lng=${location.lng}`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Reverse geocoding failed');
      }

      return data.data.address;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Reverse geocoding failed';
      setError(errorMessage);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    geocodeAddress,
    reverseGeocode,
    loading,
    error
  };
}

export function useDistance() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const calculateDistance = useCallback(async (
    origin: MapLocation, 
    destination: MapLocation
  ): Promise<DistanceResult | null> => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/maps/distance', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ origin, destination })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Distance calculation failed');
      }

      return {
        distance: data.data.routeDistance || data.data.straightLineDistance,
        straightLineDistance: data.data.straightLineDistance,
        routeDistance: data.data.routeDistance,
        duration: data.data.duration,
        route: data.data.route
      };
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Distance calculation failed';
      setError(errorMessage);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  const calculateDistanceSync = useCallback((origin: MapLocation, destination: MapLocation): number => {
    // Haversine formula for straight-line distance
    const R = 6371; // Earth's radius in kilometers
    const dLat = (destination.lat - origin.lat) * Math.PI / 180;
    const dLon = (destination.lng - origin.lng) * Math.PI / 180;
    const lat1 = origin.lat * Math.PI / 180;
    const lat2 = destination.lat * Math.PI / 180;

    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.sin(dLon / 2) * Math.sin(dLon / 2) * Math.cos(lat1) * Math.cos(lat2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    
    return R * c;
  }, []);

  return {
    calculateDistance,
    calculateDistanceSync,
    loading,
    error
  };
}

export function useMapSearch() {
  const [suggestions, setSuggestions] = useState<GeocodingResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { geocodeAddress } = useGeocoding();

  const searchLocations = useCallback(async (query: string): Promise<GeocodingResult[]> => {
    if (!query.trim()) {
      setSuggestions([]);
      return [];
    }

    setLoading(true);
    setError(null);

    try {
      // For now, we'll just geocode the query
      // In a real implementation, you might use a places/autocomplete API
      const result = await geocodeAddress(query);
      const results = result ? [result] : [];
      setSuggestions(results);
      return results;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Search failed';
      setError(errorMessage);
      setSuggestions([]);
      return [];
    } finally {
      setLoading(false);
    }
  }, [geocodeAddress]);

  const clearSuggestions = useCallback(() => {
    setSuggestions([]);
    setError(null);
  }, []);

  return {
    suggestions,
    searchLocations,
    clearSuggestions,
    loading,
    error
  };
}