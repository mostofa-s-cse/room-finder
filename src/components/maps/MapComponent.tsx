'use client';

import { MapContainer, TileLayer, Marker, Popup, useMapEvents } from 'react-leaflet';
import type { LeafletMouseEvent } from 'leaflet';

interface MapComponentProps {
  position: [number, number] | null;
  defaultCenter: [number, number];
  address: string;
  onLocationSelect: (lat: number, lng: number) => void;
}

function MapClickHandler({ onLocationSelect }: { onLocationSelect: (lat: number, lng: number) => void }) {
  useMapEvents({
    click(e: LeafletMouseEvent) {
      onLocationSelect(e.latlng.lat, e.latlng.lng);
    },
  });
  return null;
}

export default function MapComponent({ position, defaultCenter, address, onLocationSelect }: MapComponentProps) {
  return (
    <MapContainer
      center={position || defaultCenter}
      zoom={position ? 15 : 11}
      style={{ height: '100%', width: '100%' }}
      key={position ? `${position[0]}-${position[1]}` : 'default'}
    >
      <TileLayer
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
      />
      <MapClickHandler onLocationSelect={onLocationSelect} />
      {position && (
        <Marker position={position}>
          <Popup>
            Selected location
            {address && (
              <div className="mt-1">
                <small>{address}</small>
              </div>
            )}
          </Popup>
        </Marker>
      )}
    </MapContainer>
  );
}