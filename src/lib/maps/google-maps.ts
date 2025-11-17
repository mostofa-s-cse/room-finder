'use client';

import { Loader } from '@googlemaps/js-api-loader';
import { MapLocation, MapMarker, MapConfig, HeatmapPoint } from './types';

export class GoogleMapsService {
  private static instance: GoogleMapsService;
  private loader: Loader;
  private isLoaded = false;
  private loadPromise: Promise<void> | null = null;

  private constructor() {
    const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
    if (!apiKey) {
      throw new Error('Google Maps API key not found');
    }

    this.loader = new Loader({
      apiKey,
      version: 'weekly',
      libraries: ['places', 'geometry', 'visualization'],
    });
  }

  static getInstance(): GoogleMapsService {
    if (!GoogleMapsService.instance) {
      GoogleMapsService.instance = new GoogleMapsService();
    }
    return GoogleMapsService.instance;
  }

  static isAvailable(): boolean {
    return !!process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
  }

  async loadGoogleMaps(): Promise<void> {
    if (this.isLoaded) return;
    
    if (this.loadPromise) {
      return this.loadPromise;
    }

    this.loadPromise = Promise.resolve().then(async () => {
      try {
        // Access the loader's internal promise directly
        await (this.loader as unknown as { load(): Promise<typeof google> }).load();
        this.isLoaded = true;
      } catch (error: unknown) {
        console.error('Failed to load Google Maps:', error);
        throw error;
      }
    });

    return this.loadPromise;
  }

  async createMap(container: HTMLElement, config: MapConfig): Promise<google.maps.Map> {
    await this.loadGoogleMaps();

    const mapOptions: google.maps.MapOptions = {
      center: { lat: config.center.lat, lng: config.center.lng },
      zoom: config.zoom,
      mapTypeId: config.mapTypeId as google.maps.MapTypeId || google.maps.MapTypeId.ROADMAP,
      gestureHandling: config.gestureHandling || 'auto',
      zoomControl: config.zoomControl !== false,
      mapTypeControl: config.mapTypeControl !== false,
      streetViewControl: config.streetViewControl !== false,
      fullscreenControl: config.fullscreenControl !== false,
      styles: this.getDefaultMapStyles(),
    };

    return new google.maps.Map(container, mapOptions);
  }

  async addMarkers(map: google.maps.Map, markers: MapMarker[]): Promise<google.maps.Marker[]> {
    await this.loadGoogleMaps();

    const googleMarkers: google.maps.Marker[] = [];

    for (const marker of markers) {
      const googleMarker = new google.maps.Marker({
        position: { lat: marker.position.lat, lng: marker.position.lng },
        map,
        title: marker.title,
        icon: this.getMarkerIcon(marker.type),
      });

      if (marker.title || marker.description) {
        const infoWindow = new google.maps.InfoWindow({
          content: this.createInfoWindowContent(marker),
        });

        googleMarker.addListener('click', () => {
          infoWindow.open(map, googleMarker);
        });
      }

      googleMarkers.push(googleMarker);
    }

    return googleMarkers;
  }

  async addHeatmap(map: google.maps.Map, points: HeatmapPoint[]): Promise<google.maps.visualization.HeatmapLayer> {
    await this.loadGoogleMaps();

    const heatmapData = points.map(point => ({
      location: new google.maps.LatLng(point.location.lat, point.location.lng),
      weight: point.weight,
    }));

    const heatmap = new google.maps.visualization.HeatmapLayer({
      data: heatmapData,
      map,
    });

    heatmap.setOptions({
      radius: 20,
      opacity: 0.6,
      gradient: [
        'rgba(0, 255, 255, 0)',
        'rgba(0, 255, 255, 1)',
        'rgba(0, 191, 255, 1)',
        'rgba(0, 127, 255, 1)',
        'rgba(0, 63, 255, 1)',
        'rgba(0, 0, 255, 1)',
        'rgba(0, 0, 223, 1)',
        'rgba(0, 0, 191, 1)',
        'rgba(0, 0, 159, 1)',
        'rgba(0, 0, 127, 1)',
        'rgba(63, 0, 91, 1)',
        'rgba(127, 0, 63, 1)',
        'rgba(191, 0, 31, 1)',
        'rgba(255, 0, 0, 1)'
      ]
    });

    return heatmap;
  }

  async calculateRoute(
    origin: MapLocation,
    destination: MapLocation,
    travelMode: google.maps.TravelMode = google.maps.TravelMode.DRIVING
  ): Promise<{
    distance: number;
    duration: number;
    route: MapLocation[];
  } | null> {
    await this.loadGoogleMaps();

    const directionsService = new google.maps.DirectionsService();

    try {
      const result = await directionsService.route({
        origin: { lat: origin.lat, lng: origin.lng },
        destination: { lat: destination.lat, lng: destination.lng },
        travelMode,
      });

      if (result.routes.length > 0) {
        const route = result.routes[0];
        const leg = route.legs[0];

        return {
          distance: leg.distance?.value ? leg.distance.value / 1000 : 0, // Convert to km
          duration: leg.duration?.value ? leg.duration.value / 60 : 0, // Convert to minutes
          route: route.overview_path.map(point => ({
            lat: point.lat(),
            lng: point.lng()
          }))
        };
      }
    } catch (error) {
      console.error('Route calculation failed:', error);
    }

    return null;
  }

  async geocode(address: string): Promise<{ location: MapLocation; address: string } | null> {
    await this.loadGoogleMaps();

    const geocoder = new google.maps.Geocoder();

    try {
      const result = await geocoder.geocode({ address });
      
      if (result.results.length > 0) {
        const location = result.results[0].geometry.location;
        return {
          location: { lat: location.lat(), lng: location.lng() },
          address: result.results[0].formatted_address
        };
      }
    } catch (error) {
      console.error('Geocoding failed:', error);
    }

    return null;
  }

  async reverseGeocode(location: MapLocation): Promise<string | null> {
    await this.loadGoogleMaps();

    const geocoder = new google.maps.Geocoder();

    try {
      const result = await geocoder.geocode({
        location: { lat: location.lat, lng: location.lng }
      });
      
      if (result.results.length > 0) {
        return result.results[0].formatted_address;
      }
    } catch (error) {
      console.error('Reverse geocoding failed:', error);
    }

    return null;
  }

  private getMarkerIcon(type?: string): google.maps.Icon | undefined {
    const iconBase = 'https://maps.google.com/mapfiles/kml/shapes/';
    
    switch (type) {
      case 'listing':
        return {
          url: iconBase + 'real_estate.png',
          scaledSize: new google.maps.Size(32, 32)
        };
      case 'user':
        return {
          url: iconBase + 'man.png',
          scaledSize: new google.maps.Size(32, 32)
        };
      case 'poi':
        return {
          url: iconBase + 'poi.png',
          scaledSize: new google.maps.Size(32, 32)
        };
      default:
        return undefined;
    }
  }

  private createInfoWindowContent(marker: MapMarker): string {
    return `
      <div class="p-2 max-w-xs">
        <h3 class="font-semibold text-sm mb-1">${marker.title || 'Location'}</h3>
        ${marker.description ? `<p class="text-xs text-gray-600">${marker.description}</p>` : ''}
      </div>
    `;
  }

  private getDefaultMapStyles(): google.maps.MapTypeStyle[] {
    return [
      {
        featureType: 'poi',
        elementType: 'labels',
        stylers: [{ visibility: 'off' }]
      },
      {
        featureType: 'transit',
        elementType: 'labels',
        stylers: [{ visibility: 'off' }]
      }
    ];
  }
}