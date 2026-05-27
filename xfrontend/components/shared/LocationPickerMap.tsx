'use client';

import { MapContainer, TileLayer, Marker, useMapEvents } from 'react-leaflet';
import L from 'leaflet';

// We use CDN URLs for the marker so leaflet resolves them correctly
// regardless of bundler (Next.js / Webpack).
const MARKER_ICON = L.icon({
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

interface LocationPickerMapProps {
  value: [number, number] | null;
  onChange: (lat: number, lng: number) => void;
}

function MapClickHandler({ onClick }: { onClick: (lat: number, lng: number) => void }) {
  useMapEvents({
    click(e) {
      onClick(
      Math.round(e.latlng.lat * 1e6) / 1e6,
      Math.round(e.latlng.lng * 1e6) / 1e6
    );
    },
  });
  return null;
}

export default function LocationPickerMap({ value, onChange }: LocationPickerMapProps) {
  const center: [number, number] = value || [3.848, 11.502];

  return (
    <div className="w-full rounded-xl overflow-hidden border border-gray-200" style={{ height: 280 }}>
      <MapContainer
        center={center}
        zoom={value ? 15 : 6}
        className="h-full w-full"
        scrollWheelZoom={false}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <MapClickHandler onClick={onChange} />
        {value && <Marker position={value} icon={MARKER_ICON} />}
      </MapContainer>
    </div>
  );
}
