'use client';

import { MapContainer, TileLayer, Marker, Popup, useMapEvents } from 'react-leaflet';
import { useEffect } from 'react';
import L from 'leaflet';

// Fix for default markers in react-leaflet
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

interface LeafletMapProps {
  position: [number, number] | null;
  defaultCenter: [number, number];
  address: string;
  onLocationSelect: (lat: number, lng: number) => void;
}

function MapClickHandler({ onLocationSelect }: { onLocationSelect: (lat: number, lng: number) => void }) {
  useMapEvents({
    click(e) {
      onLocationSelect(e.latlng.lat, e.latlng.lng);
    },
  });

  return null;
}

function MapUpdater({ position }: { position: [number, number] | null }) {
  const map = useMapEvents({});
  
  useEffect(() => {
    if (position) {
      map.setView(position, 15);
    }
  }, [position, map]);

  return null;
}

export default function LeafletMap({ position, defaultCenter, address, onLocationSelect }: LeafletMapProps) {
  // Check if we're in the browser (client-side)
  if (typeof window === 'undefined') {
    return (
      <div className="w-full h-full bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
          <p className="text-sm text-gray-600">Loading map...</p>
        </div>
      </div>
    );
  }

  return (
    <MapContainer
      center={position || defaultCenter}
      zoom={position ? 15 : 11}
      style={{ height: '100%', width: '100%' }}
      scrollWheelZoom={true}
      key={position ? `${position[0]}-${position[1]}` : 'default'}
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      <MapClickHandler onLocationSelect={onLocationSelect} />
      <MapUpdater position={position} />
      {position && (
        <Marker position={position}>
          <Popup>
            <div className="text-sm">
              <p className="font-medium">Selected Location</p>
              {address && (
                <p className="mt-1 text-gray-600">{address}</p>
              )}
              <p className="mt-1 text-xs text-gray-500">
                {position[0].toFixed(6)}, {position[1].toFixed(6)}
              </p>
            </div>
          </Popup>
        </Marker>
      )}
    </MapContainer>
  );
}