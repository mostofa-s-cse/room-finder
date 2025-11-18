'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { MapProviderService } from '@/lib/maps/map-provider';
import { MapLocation, MapMarker, MapConfig } from '@/lib/maps/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { MapPin, ZoomIn, ZoomOut, Layers, Navigation, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface MapComponentProps {
  center?: MapLocation;
  zoom?: number;
  height?: string;
  className?: string;
  markers?: MapMarker[];
  showHeatmap?: boolean;
  heatmapData?: Array<{ location: MapLocation; weight: number }>;
  onMarkerClick?: (marker: MapMarker) => void;
  onMapClick?: (location: MapLocation) => void;
  interactive?: boolean;
  showControls?: boolean;
}

export function MapComponent({ 
  center = { lat: 23.8103, lng: 90.4125 }, // Dhaka, Bangladesh
  zoom = 12,
  height = '400px',
  className = '',
  markers = [],
  showHeatmap = false,
  heatmapData = [],
  onMarkerClick,
  onMapClick,
  interactive = true,
  showControls = true
}: MapComponentProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<google.maps.Map | import('leaflet').Map | null>(null);
  const markersRef = useRef<(google.maps.Marker | import('leaflet').Marker)[]>([]);
  const heatmapRef = useRef<google.maps.visualization.HeatmapLayer | import('leaflet').Circle[] | null>(null);
  
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [mapProvider, setMapProvider] = useState<'google' | 'openstreetmap'>('openstreetmap');
  const [currentZoom, setCurrentZoom] = useState(zoom);

  const mapProviderService = MapProviderService.getInstance();

  const initializeMap = useCallback(async () => {
    if (!mapRef.current) return;

    try {
      setIsLoading(true);
      setError(null);

      // Clean up existing map instance
      if (mapInstanceRef.current) {
        try {
          if (mapProvider === 'google') {
            // Google Maps cleanup is handled automatically
          } else {
            // Leaflet cleanup
            const leafletMap = mapInstanceRef.current as import('leaflet').Map;
            if (leafletMap.remove) {
              leafletMap.remove();
            }
          }
        } catch (error) {
          console.warn('Error during map cleanup:', error);
        }
        mapInstanceRef.current = null;
      }

      const config: MapConfig = {
        center,
        zoom: currentZoom,
        gestureHandling: interactive ? 'auto' : 'none',
        zoomControl: showControls,
        mapTypeControl: showControls,
        streetViewControl: showControls,
        fullscreenControl: showControls,
      };

      const map = await mapProviderService.createMap(mapRef.current, config);
      mapInstanceRef.current = map;
      setMapProvider(mapProviderService.getCurrentProvider());

      // Add click listener if provided
      if (onMapClick) {
        if (mapProvider === 'google') {
          (map as google.maps.Map).addListener('click', (e: google.maps.MapMouseEvent) => {
            if (e.latLng) {
              onMapClick({
                lat: e.latLng.lat(),
                lng: e.latLng.lng()
              });
            }
          });
        } else {
          (map as import('leaflet').Map).on('click', (e: import('leaflet').LeafletMouseEvent) => {
            onMapClick({
              lat: e.latlng.lat,
              lng: e.latlng.lng
            });
          });
        }
      }

      await addMarkersToMap(map);
      await addHeatmapToMap(map);

    } catch (err) {
      console.error('Map initialization failed:', err);
      setError(err instanceof Error ? err.message : 'Failed to load map');
    } finally {
      setIsLoading(false);
    }
  }, [center, currentZoom, interactive, showControls, onMapClick, mapProvider]);

  const addMarkersToMap = useCallback(async (map: google.maps.Map | import('leaflet').Map) => {
    // Clear existing markers
    markersRef.current.forEach(marker => {
      if (mapProvider === 'google') {
        (marker as google.maps.Marker).setMap(null);
      } else {
        (map as import('leaflet').Map).removeLayer(marker as import('leaflet').Marker);
      }
    });
    markersRef.current = [];

    if (markers.length > 0) {
      const newMarkers = await mapProviderService.addMarkers(map, markers);
      markersRef.current = newMarkers;

      // Add click listeners to markers
      if (onMarkerClick) {
        newMarkers.forEach((marker, index) => {
          if (mapProvider === 'google') {
            (marker as google.maps.Marker).addListener('click', () => {
              onMarkerClick(markers[index]);
            });
          } else {
            (marker as import('leaflet').Marker).on('click', () => {
              onMarkerClick(markers[index]);
            });
          }
        });
      }
    }
  }, [markers, onMarkerClick, mapProvider]);

  const addHeatmapToMap = useCallback(async (map: google.maps.Map | import('leaflet').Map) => {
    // Clear existing heatmap
    if (heatmapRef.current) {
      if (mapProvider === 'google') {
        (heatmapRef.current as google.maps.visualization.HeatmapLayer).setMap(null);
      } else {
        (heatmapRef.current as import('leaflet').Circle[]).forEach(circle => {
          (map as import('leaflet').Map).removeLayer(circle);
        });
      }
      heatmapRef.current = null;
    }

    if (showHeatmap && heatmapData.length > 0) {
      const heatmap = await mapProviderService.addHeatmap(map, heatmapData);
      heatmapRef.current = heatmap;
    }
  }, [showHeatmap, heatmapData, mapProvider]);

  const handleZoomIn = useCallback(() => {
    setCurrentZoom(prev => Math.min(prev + 1, 20));
    if (mapInstanceRef.current) {
      if (mapProvider === 'google') {
        (mapInstanceRef.current as google.maps.Map).setZoom(currentZoom + 1);
      } else {
        (mapInstanceRef.current as import('leaflet').Map).setZoom(currentZoom + 1);
      }
    }
  }, [currentZoom, mapProvider]);

  const handleZoomOut = useCallback(() => {
    setCurrentZoom(prev => Math.max(prev - 1, 1));
    if (mapInstanceRef.current) {
      if (mapProvider === 'google') {
        (mapInstanceRef.current as google.maps.Map).setZoom(currentZoom - 1);
      } else {
        (mapInstanceRef.current as import('leaflet').Map).setZoom(currentZoom - 1);
      }
    }
  }, [currentZoom, mapProvider]);

  const toggleProvider = useCallback(() => {
    const newProvider = mapProvider === 'google' ? 'openstreetmap' : 'google';
    if (mapProviderService.setProvider(newProvider)) {
      initializeMap();
    }
  }, [mapProvider, initializeMap]);

  useEffect(() => {
    initializeMap();
  }, [initializeMap]);

  useEffect(() => {
    if (mapInstanceRef.current) {
      addMarkersToMap(mapInstanceRef.current);
    }
  }, [addMarkersToMap]);

  useEffect(() => {
    if (mapInstanceRef.current) {
      addHeatmapToMap(mapInstanceRef.current);
    }
  }, [addHeatmapToMap]);

  // Cleanup effect
  useEffect(() => {
    return () => {
      // Cleanup map instance when component unmounts
      if (mapInstanceRef.current) {
        try {
          if (mapProvider === 'google') {
            // Google Maps cleanup is handled automatically
          } else {
            // Leaflet cleanup
            const leafletMap = mapInstanceRef.current as import('leaflet').Map;
            if (leafletMap.remove) {
              leafletMap.remove();
            }
          }
        } catch (error) {
          console.warn('Error during map cleanup:', error);
        }
        mapInstanceRef.current = null;
      }
      
      // Clean up the container
      if (mapRef.current) {
        mapRef.current.innerHTML = '';
        delete (mapRef.current as any)._leaflet_id;
      }
      
      // Clear markers and heatmap references
      markersRef.current = [];
      heatmapRef.current = null;
    };
  }, [mapProvider]);

  if (error) {
    return (
      <Card className={cn('flex items-center justify-center', className)} style={{ height }}>
        <CardContent className="text-center space-y-2 pt-6">
          <MapPin className="w-12 h-12 text-muted-foreground mx-auto" />
          <p className="text-sm font-medium">Map Failed to Load</p>
          <p className="text-xs text-muted-foreground">{error}</p>
          <Button size="sm" onClick={initializeMap} className="mt-2">
            Try Again
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className={cn('relative rounded-lg overflow-hidden', className)} style={{ height }}>
      <div ref={mapRef} className="w-full h-full" />
      
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-background/80 backdrop-blur-sm">
          <div className="text-center space-y-2">
            <Loader2 className="w-8 h-8 animate-spin mx-auto" />
            <p className="text-sm font-medium">Loading Map...</p>
            <p className="text-xs text-muted-foreground">
              Provider: {mapProvider === 'google' ? 'Google Maps' : 'OpenStreetMap'}
            </p>
          </div>
        </div>
      )}

      {/* Map Controls */}
      {showControls && !isLoading && (
        <div className="absolute top-4 right-4 flex flex-col space-y-2">
          <Button size="sm" variant="secondary" onClick={handleZoomIn}>
            <ZoomIn className="w-4 h-4" />
          </Button>
          <Button size="sm" variant="secondary" onClick={handleZoomOut}>
            <ZoomOut className="w-4 h-4" />
          </Button>
          <Button size="sm" variant="secondary" onClick={toggleProvider}>
            <Layers className="w-4 h-4" />
          </Button>
        </div>
      )}

      {/* Map Info */}
      {!isLoading && (
        <div className="absolute bottom-4 left-4">
          <Card className="px-2 py-1">
            <div className="flex items-center space-x-2 text-xs">
              <Navigation className="w-3 h-3" />
              <span>{center.lat.toFixed(4)}, {center.lng.toFixed(4)}</span>
              <span>•</span>
              <span>Zoom: {currentZoom}</span>
              {markers.length > 0 && (
                <>
                  <span>•</span>
                  <span>{markers.length} markers</span>
                </>
              )}
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}