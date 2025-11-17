import { MapLocation, MapMarker, DistanceResult, GeocodingResult, HeatmapPoint } from './types';

// Distance calculation utilities using Haversine formula
export class DistanceCalculator {
  /**
   * Calculate distance between two points using Haversine formula
   */
  static calculateDistance(point1: MapLocation, point2: MapLocation): number {
    const R = 6371; // Earth's radius in kilometers
    const dLat = this.toRad(point2.lat - point1.lat);
    const dLon = this.toRad(point2.lng - point1.lng);
    const lat1 = this.toRad(point1.lat);
    const lat2 = this.toRad(point2.lat);

    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.sin(dLon / 2) * Math.sin(dLon / 2) * Math.cos(lat1) * Math.cos(lat2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    
    return R * c;
  }

  /**
   * Calculate distance to multiple points and return sorted by distance
   */
  static calculateDistancesToPoints(
    origin: MapLocation, 
    destinations: Array<{ location: MapLocation; id: string }>
  ): Array<{ id: string; distance: number; location: MapLocation }> {
    return destinations
      .map(dest => ({
        id: dest.id,
        location: dest.location,
        distance: this.calculateDistance(origin, dest.location)
      }))
      .sort((a, b) => a.distance - b.distance);
  }

  /**
   * Find nearest markers within a radius
   */
  static findNearbyMarkers(
    center: MapLocation, 
    markers: MapMarker[], 
    radiusKm: number
  ): MapMarker[] {
    return markers.filter(marker => {
      const distance = this.calculateDistance(center, marker.position);
      return distance <= radiusKm;
    });
  }

  /**
   * Calculate bounding box for a set of locations
   */
  static calculateBounds(locations: MapLocation[]): {
    north: number;
    south: number;
    east: number;
    west: number;
  } {
    if (locations.length === 0) {
      return { north: 0, south: 0, east: 0, west: 0 };
    }

    let north = locations[0].lat;
    let south = locations[0].lat;
    let east = locations[0].lng;
    let west = locations[0].lng;

    locations.forEach(location => {
      north = Math.max(north, location.lat);
      south = Math.min(south, location.lat);
      east = Math.max(east, location.lng);
      west = Math.min(west, location.lng);
    });

    return { north, south, east, west };
  }

  private static toRad(value: number): number {
    return value * Math.PI / 180;
  }
}

// Geocoding utilities
export class GeocodingService {
  /**
   * Forward geocoding - address to coordinates
   */
  static async geocodeAddress(address: string): Promise<GeocodingResult | null> {
    try {
      // Try Google Maps first if API key is available
      const googleApiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
      if (googleApiKey) {
        return await this.googleGeocode(address, googleApiKey);
      }

      // Fallback to Nominatim (OpenStreetMap)
      return await this.nominatimGeocode(address);
    } catch (error) {
      console.error('Geocoding failed:', error);
      return null;
    }
  }

  /**
   * Reverse geocoding - coordinates to address
   */
  static async reverseGeocode(location: MapLocation): Promise<string | null> {
    try {
      const googleApiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
      if (googleApiKey) {
        return await this.googleReverseGeocode(location, googleApiKey);
      }

      return await this.nominatimReverseGeocode(location);
    } catch (error) {
      console.error('Reverse geocoding failed:', error);
      return null;
    }
  }

  private static async googleGeocode(address: string, apiKey: string): Promise<GeocodingResult | null> {
    const response = await fetch(
      `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(address)}&key=${apiKey}`
    );
    const data = await response.json();

    if (data.status === 'OK' && data.results.length > 0) {
      const result = data.results[0];
      return {
        address: result.formatted_address,
        location: {
          lat: result.geometry.location.lat,
          lng: result.geometry.location.lng
        },
        placeId: result.place_id,
        types: result.types
      };
    }

    return null;
  }

  private static async googleReverseGeocode(location: MapLocation, apiKey: string): Promise<string | null> {
    const response = await fetch(
      `https://maps.googleapis.com/maps/api/geocode/json?latlng=${location.lat},${location.lng}&key=${apiKey}`
    );
    const data = await response.json();

    if (data.status === 'OK' && data.results.length > 0) {
      return data.results[0].formatted_address;
    }

    return null;
  }

  private static async nominatimGeocode(address: string): Promise<GeocodingResult | null> {
    const response = await fetch(
      `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(address)}&limit=1`
    );
    const data = await response.json();

    if (data.length > 0) {
      const result = data[0];
      return {
        address: result.display_name,
        location: {
          lat: parseFloat(result.lat),
          lng: parseFloat(result.lon)
        }
      };
    }

    return null;
  }

  private static async nominatimReverseGeocode(location: MapLocation): Promise<string | null> {
    const response = await fetch(
      `https://nominatim.openstreetmap.org/reverse?format=json&lat=${location.lat}&lon=${location.lng}`
    );
    const data = await response.json();

    return data.display_name || null;
  }
}

// Heatmap utilities
export class HeatmapGenerator {
  /**
   * Generate heatmap data from listing densities
   */
  static generateListingHeatmap(listings: Array<{ location: MapLocation; rent: number }>): HeatmapPoint[] {
    const gridSize = 0.01; // ~1km grid
    const grid = new Map<string, { count: number; totalRent: number; location: MapLocation }>();

    listings.forEach(listing => {
      const gridKey = `${Math.floor(listing.location.lat / gridSize)}_${Math.floor(listing.location.lng / gridSize)}`;
      const existing = grid.get(gridKey);

      if (existing) {
        existing.count++;
        existing.totalRent += listing.rent;
      } else {
        grid.set(gridKey, {
          count: 1,
          totalRent: listing.rent,
          location: listing.location
        });
      }
    });

    return Array.from(grid.values()).map(cell => ({
      location: cell.location,
      weight: cell.count // Weight based on listing density
    }));
  }

  /**
   * Generate price-based heatmap
   */
  static generatePriceHeatmap(listings: Array<{ location: MapLocation; rent: number }>): HeatmapPoint[] {
    const maxRent = Math.max(...listings.map(l => l.rent));
    
    return listings.map(listing => ({
      location: listing.location,
      weight: listing.rent / maxRent // Normalized weight based on price
    }));
  }
}

// Map bounds utilities
export class MapBoundsCalculator {
  /**
   * Calculate optimal zoom level for given bounds
   */
  static calculateOptimalZoom(bounds: { north: number; south: number; east: number; west: number }): number {
    const latDiff = bounds.north - bounds.south;
    const lngDiff = bounds.east - bounds.west;
    const maxDiff = Math.max(latDiff, lngDiff);

    if (maxDiff > 10) return 6;
    if (maxDiff > 5) return 8;
    if (maxDiff > 2) return 10;
    if (maxDiff > 1) return 12;
    if (maxDiff > 0.5) return 13;
    if (maxDiff > 0.25) return 14;
    if (maxDiff > 0.125) return 15;
    return 16;
  }

  /**
   * Expand bounds by a percentage
   */
  static expandBounds(
    bounds: { north: number; south: number; east: number; west: number },
    percentage: number = 0.1
  ): { north: number; south: number; east: number; west: number } {
    const latExpansion = (bounds.north - bounds.south) * percentage;
    const lngExpansion = (bounds.east - bounds.west) * percentage;

    return {
      north: bounds.north + latExpansion,
      south: bounds.south - latExpansion,
      east: bounds.east + lngExpansion,
      west: bounds.west - lngExpansion
    };
  }
}