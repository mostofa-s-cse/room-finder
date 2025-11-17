'use client';

import { Map, Marker, Circle } from 'leaflet';
import { MapLocation, MapMarker, MapConfig, HeatmapPoint } from './types';

export class OpenStreetMapService {
  private static instance: OpenStreetMapService;
  private leafletLoaded = false;

  private constructor() {}

  static getInstance(): OpenStreetMapService {
    if (!OpenStreetMapService.instance) {
      OpenStreetMapService.instance = new OpenStreetMapService();
    }
    return OpenStreetMapService.instance;
  }

  static isAvailable(): boolean {
    return true; // OpenStreetMap is always available
  }

  async loadLeaflet(): Promise<void> {
    if (this.leafletLoaded) return;

    // Dynamic import of Leaflet to avoid SSR issues
    if (typeof window !== 'undefined') {
      const L = await import('leaflet');
      
      // Fix for default markers in Leaflet
      delete (L.Icon.Default.prototype as unknown as Record<string, unknown>)._getIconUrl;
      L.Icon.Default.mergeOptions({
        iconRetinaUrl: '/leaflet/marker-icon-2x.png',
        iconUrl: '/leaflet/marker-icon.png',
        shadowUrl: '/leaflet/marker-shadow.png',
      });

      this.leafletLoaded = true;
    }
  }

  async createMap(container: HTMLElement, config: MapConfig): Promise<Map> {
    await this.loadLeaflet();
    const L = await import('leaflet');

    const map = L.map(container, {
      center: [config.center.lat, config.center.lng],
      zoom: config.zoom,
      zoomControl: config.zoomControl !== false,
    });

    // Add OpenStreetMap tile layer
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
      maxZoom: 19,
    }).addTo(map);

    return map;
  }

  async addMarkers(map: Map, markers: MapMarker[]): Promise<Marker[]> {
    await this.loadLeaflet();
    const L = await import('leaflet');

    const leafletMarkers: Marker[] = [];

    for (const marker of markers) {
      const leafletMarker = L.marker([marker.position.lat, marker.position.lng])
        .addTo(map);

      if (marker.title || marker.description) {
        const popupContent = this.createPopupContent(marker);
        leafletMarker.bindPopup(popupContent);
      }

      leafletMarkers.push(leafletMarker);
    }

    return leafletMarkers;
  }

  async addHeatmap(map: Map, points: HeatmapPoint[]): Promise<Circle[]> {
    await this.loadLeaflet();
    const L = await import('leaflet');

    const circles: Circle[] = [];

    // Since Leaflet doesn't have built-in heatmap, we'll use circles with opacity
    for (const point of points) {
      const circle = L.circle([point.location.lat, point.location.lng], {
        color: this.getHeatmapColor(point.weight),
        fillColor: this.getHeatmapColor(point.weight),
        fillOpacity: Math.min(point.weight, 0.6),
        radius: 100 * point.weight, // Radius based on weight
        stroke: false,
      }).addTo(map);

      circles.push(circle);
    }

    return circles;
  }

  async calculateRoute(
    origin: MapLocation,
    destination: MapLocation
  ): Promise<{
    distance: number;
    duration: number;
    route: MapLocation[];
  } | null> {
    try {
      // Use OSRM (Open Source Routing Machine) for routing
      const response = await fetch(
        `https://router.project-osrm.org/route/v1/driving/${origin.lng},${origin.lat};${destination.lng},${destination.lat}?overview=full&geometries=geojson`
      );

      const data = await response.json();

      if (data.routes && data.routes.length > 0) {
        const route = data.routes[0];
        
        return {
          distance: route.distance / 1000, // Convert to km
          duration: route.duration / 60, // Convert to minutes
          route: route.geometry.coordinates.map((coord: [number, number]) => ({
            lat: coord[1],
            lng: coord[0]
          }))
        };
      }
    } catch (error) {
      console.error('OSRM routing failed:', error);
    }

    return null;
  }

  async geocode(address: string): Promise<{ location: MapLocation; address: string } | null> {
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(address)}&limit=1`
      );
      const data = await response.json();

      if (data.length > 0) {
        const result = data[0];
        return {
          location: {
            lat: parseFloat(result.lat),
            lng: parseFloat(result.lon)
          },
          address: result.display_name
        };
      }
    } catch (error) {
      console.error('Nominatim geocoding failed:', error);
    }

    return null;
  }

  async reverseGeocode(location: MapLocation): Promise<string | null> {
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${location.lat}&lon=${location.lng}`
      );
      const data = await response.json();

      return data.display_name || null;
    } catch (error) {
      console.error('Nominatim reverse geocoding failed:', error);
    }

    return null;
  }

  private createPopupContent(marker: MapMarker): string {
    return `
      <div class="p-2 max-w-xs">
        <h3 class="font-semibold text-sm mb-1">${marker.title || 'Location'}</h3>
        ${marker.description ? `<p class="text-xs text-gray-600">${marker.description}</p>` : ''}
      </div>
    `;
  }

  private getHeatmapColor(weight: number): string {
    // Color gradient from blue (low) to red (high)
    const colors = [
      '#0000FF', // Blue
      '#0080FF',
      '#00FFFF', // Cyan
      '#80FF00',
      '#FFFF00', // Yellow
      '#FF8000',
      '#FF0000'  // Red
    ];

    const index = Math.min(Math.floor(weight * colors.length), colors.length - 1);
    return colors[index];
  }
}