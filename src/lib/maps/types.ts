export interface MapLocation {
  lat: number;
  lng: number;
}

export interface MapMarker {
  id: string;
  position: MapLocation;
  title?: string;
  description?: string;
  icon?: string;
  type?: 'listing' | 'user' | 'poi';
  data?: Record<string, unknown>;
}

export interface MapBounds {
  north: number;
  south: number;
  east: number;
  west: number;
}

export interface HeatmapPoint {
  location: MapLocation;
  weight: number;
}

export interface DistanceResult {
  distance: number; // in kilometers
  duration?: number; // in minutes
  route?: MapLocation[];
}

export interface GeocodingResult {
  address: string;
  location: MapLocation;
  placeId?: string;
  types?: string[];
}

export interface MapProvider {
  name: 'google' | 'openstreetmap';
  isAvailable: boolean;
}

export interface MapConfig {
  center: MapLocation;
  zoom: number;
  mapTypeId?: string;
  gestureHandling?: 'cooperative' | 'greedy' | 'none' | 'auto';
  zoomControl?: boolean;
  mapTypeControl?: boolean;
  streetViewControl?: boolean;
  fullscreenControl?: boolean;
}

export interface MapStyle {
  elementType?: string;
  featureType?: string;
  stylers: Array<{
    [key: string]: string | number | boolean;
  }>;
}