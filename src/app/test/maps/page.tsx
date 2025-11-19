'use client';

import { useState } from 'react';
import { MapComponent } from '@/components/ui/MapComponent';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { MapPin } from 'lucide-react';
import { MapMarker, MapLocation } from '@/lib/maps/types';

const DHAKA_CENTER = { lat: 23.8103, lng: 90.4125 };
const SAMPLE_MARKERS = [
  {
    id: 'marker1',
    position: { lat: 23.8103, lng: 90.4125 },
    title: 'Dhaka Center',
    description: 'Central Dhaka location'
  },
  {
    id: 'marker2', 
    position: { lat: 23.7461, lng: 90.3760 },
    title: 'Dhanmondi',
    description: 'Popular residential area'
  },
  {
    id: 'marker3',
    position: { lat: 23.7814, lng: 90.4177 },
    title: 'Gulshan',
    description: 'Business district'
  }
];

export default function MapTestPage() {
  const [markers, setMarkers] = useState(SAMPLE_MARKERS);
  const [selectedMarker, setSelectedMarker] = useState<MapMarker | null>(null);

  const handleMarkerClick = (marker: MapMarker) => {
    setSelectedMarker(marker);
  };

  const handleMapClick = (location: MapLocation) => {
    const newMarker = {
      id: `marker-${Date.now()}`,
      position: location,
      title: 'New Location',
      description: `Lat: ${location.lat.toFixed(4)}, Lng: ${location.lng.toFixed(4)}`
    };
    setMarkers(prev => [...prev, newMarker]);
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Map Component Test</h1>
        <p className="text-muted-foreground">
          Testing the MapComponent with OpenStreetMap integration
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MapPin className="h-5 w-5" />
                Interactive Map
              </CardTitle>
            </CardHeader>
            <CardContent>
              <MapComponent
                center={DHAKA_CENTER}
                zoom={12}
                height="500px"
                markers={markers}
                onMarkerClick={handleMarkerClick}
                onMapClick={handleMapClick}
                showControls={true}
                interactive={true}
              />
            </CardContent>
          </Card>
        </div>

        <div>
          <Card>
            <CardHeader>
              <CardTitle>Markers ({markers.length})</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {markers.map((marker) => (
                <div 
                  key={marker.id}
                  className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                    selectedMarker?.id === marker.id 
                      ? 'border-primary bg-primary/5' 
                      : 'border-border hover:border-primary/50'
                  }`}
                  onClick={() => setSelectedMarker(marker)}
                >
                  <h4 className="font-medium text-sm">{marker.title}</h4>
                  <p className="text-xs text-muted-foreground mb-2">
                    {marker.description}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {marker.position.lat.toFixed(4)}, {marker.position.lng.toFixed(4)}
                  </p>
                </div>
              ))}
              
              <Button
                variant="outline"
                size="sm"
                className="w-full"
                onClick={() => setMarkers([])}
                disabled={markers.length === 0}
              >
                Clear All Markers
              </Button>
              
              <Button
                variant="outline"
                size="sm"
                className="w-full"
                onClick={() => setMarkers(SAMPLE_MARKERS)}
              >
                Reset to Sample
              </Button>
            </CardContent>
          </Card>

          {selectedMarker && (
            <Card className="mt-4">
              <CardHeader>
                <CardTitle className="text-sm">Selected Marker</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 text-sm">
                  <div>
                    <strong>Title:</strong> {selectedMarker.title}
                  </div>
                  <div>
                    <strong>Description:</strong> {selectedMarker.description}
                  </div>
                  <div>
                    <strong>Position:</strong><br />
                    Lat: {selectedMarker.position.lat.toFixed(6)}<br />
                    Lng: {selectedMarker.position.lng.toFixed(6)}
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Instructions</CardTitle>
        </CardHeader>
        <CardContent className="text-sm space-y-2">
          <p>• <strong>Click on markers</strong> to select and view details</p>
          <p>• <strong>Click on the map</strong> to add new markers</p>
          <p>• <strong>Use zoom controls</strong> to navigate the map</p>
          <p>• <strong>Drag the map</strong> to pan around</p>
        </CardContent>
      </Card>
    </div>
  );
}