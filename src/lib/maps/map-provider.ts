'use client';

import { GoogleMapsService } from './google-maps';
import { OpenStreetMapService } from './openstreetmap';
import { MapLocation, MapMarker, MapConfig, HeatmapPoint, MapProvider } from './types';

export class MapProviderService {
  private static instance: MapProviderService;
  private currentProvider: 'google' | 'openstreetmap' = 'openstreetmap';
  private googleMapsService?: GoogleMapsService;
  private openStreetMapService?: OpenStreetMapService;

  private constructor() {
    this.initializeProviders();
  }

  static getInstance(): MapProviderService {
    if (!MapProviderService.instance) {
      MapProviderService.instance = new MapProviderService();
    }
    return MapProviderService.instance;
  }

  private initializeProviders(): void {
    // Try Google Maps first if API key is available
    if (GoogleMapsService.isAvailable()) {
      try {
        this.googleMapsService = GoogleMapsService.getInstance();
        this.currentProvider = 'google';
      } catch (error) {
        console.warn('Google Maps initialization failed, falling back to OpenStreetMap:', error);
        this.initializeOpenStreetMap();
      }
    } else {
      this.initializeOpenStreetMap();
    }
  }

  private initializeOpenStreetMap(): void {
    this.openStreetMapService = OpenStreetMapService.getInstance();
    this.currentProvider = 'openstreetmap';
  }

  getAvailableProviders(): MapProvider[] {
    return [
      {
        name: 'google',
        isAvailable: GoogleMapsService.isAvailable()
      },
      {
        name: 'openstreetmap',
        isAvailable: OpenStreetMapService.isAvailable()
      }
    ];
  }

  getCurrentProvider(): 'google' | 'openstreetmap' {
    return this.currentProvider;
  }

  setProvider(provider: 'google' | 'openstreetmap'): boolean {
    try {
      if (provider === 'google' && GoogleMapsService.isAvailable()) {
        this.googleMapsService = GoogleMapsService.getInstance();
        this.currentProvider = 'google';
        return true;
      } else if (provider === 'openstreetmap') {
        this.openStreetMapService = OpenStreetMapService.getInstance();
        this.currentProvider = 'openstreetmap';
        return true;
      }
      return false;
    } catch (error) {
      console.error(`Failed to switch to ${provider} provider:`, error);
      return false;
    }
  }

  async createMap(container: HTMLElement, config: MapConfig): Promise<google.maps.Map | import('leaflet').Map> {
    if (this.currentProvider === 'google' && this.googleMapsService) {
      return await this.googleMapsService.createMap(container, config);
    } else if (this.openStreetMapService) {
      return await this.openStreetMapService.createMap(container, config);
    }
    
    throw new Error('No map provider available');
  }

  async addMarkers(
    map: google.maps.Map | import('leaflet').Map, 
    markers: MapMarker[]
  ): Promise<google.maps.Marker[] | import('leaflet').Marker[]> {
    if (this.currentProvider === 'google' && this.googleMapsService) {
      return await this.googleMapsService.addMarkers(map as google.maps.Map, markers);
    } else if (this.openStreetMapService) {
      return await this.openStreetMapService.addMarkers(map as import('leaflet').Map, markers);
    }
    
    throw new Error('No map provider available');
  }

  async addHeatmap(
    map: google.maps.Map | import('leaflet').Map, 
    points: HeatmapPoint[]
  ): Promise<google.maps.visualization.HeatmapLayer | import('leaflet').Circle[]> {
    if (this.currentProvider === 'google' && this.googleMapsService) {
      return await this.googleMapsService.addHeatmap(map as google.maps.Map, points);
    } else if (this.openStreetMapService) {
      return await this.openStreetMapService.addHeatmap(map as import('leaflet').Map, points);
    }
    
    throw new Error('No map provider available');
  }

  async calculateRoute(
    origin: MapLocation,
    destination: MapLocation
  ): Promise<{
    distance: number;
    duration: number;
    route: MapLocation[];
  } | null> {
    if (this.currentProvider === 'google' && this.googleMapsService) {
      return await this.googleMapsService.calculateRoute(origin, destination);
    } else if (this.openStreetMapService) {
      return await this.openStreetMapService.calculateRoute(origin, destination);
    }
    
    return null;
  }

  async geocode(address: string): Promise<{ location: MapLocation; address: string } | null> {
    if (this.currentProvider === 'google' && this.googleMapsService) {
      return await this.googleMapsService.geocode(address);
    } else if (this.openStreetMapService) {
      return await this.openStreetMapService.geocode(address);
    }
    
    return null;
  }

  async reverseGeocode(location: MapLocation): Promise<string | null> {
    if (this.currentProvider === 'google' && this.googleMapsService) {
      return await this.googleMapsService.reverseGeocode(location);
    } else if (this.openStreetMapService) {
      return await this.openStreetMapService.reverseGeocode(location);
    }
    
    return null;
  }

  cleanup(container: HTMLElement): void {
    if (this.currentProvider === 'openstreetmap' && this.openStreetMapService) {
      this.openStreetMapService.cleanupMap(container);
    }
    // Google Maps cleanup is handled automatically
  }
}